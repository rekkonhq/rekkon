import { dirname, basename, relative, resolve, extname } from 'path';
import {
  layerId,
  moduleId,
  fileId,
  symbolId,
  edgeId,
} from './ids.js';
import type {
  FileAnalysis,
  GraphNode,
  GraphEdge,
  CytoscapeElement,
  AnalysisOutput,
  LayerSummary,
} from './types.js';

// ============================================================
// Layer Classification
//
// From v0.5: Hierarchy is Layer → Module → File → Symbol
// Layers are detected from directory conventions:
//   - api/, routes/, server/    → "API"
//   - components/, pages/, app/ → "UI"
//   - hooks/                    → "Hooks"
//   - lib/, utils/, helpers/    → "Lib"
//   - stores/, state/           → "State"
//   - types/                    → "Types"
//   - config/                   → "Config"
//   - services/                 → "Services"
//   - Everything else           → "Core"
// ============================================================

const LAYER_RULES: Array<{ pattern: RegExp; layer: string }> = [
  { pattern: /\/(api|routes|server)\//i, layer: 'API' },
  { pattern: /\/(pages|app)\//i, layer: 'Pages' },
  { pattern: /\/components?\//i, layer: 'UI' },
  { pattern: /\/hooks?\//i, layer: 'Hooks' },
  { pattern: /\/(stores?|state)\//i, layer: 'State' },
  { pattern: /\/(lib|utils?|helpers?)\//i, layer: 'Lib' },
  { pattern: /\/types?\//i, layer: 'Types' },
  { pattern: /\/(config|constants?)\//i, layer: 'Config' },
  { pattern: /\/services?\//i, layer: 'Services' },
  { pattern: /\/(middleware|guards?)\//i, layer: 'Middleware' },
  { pattern: /\/(test|__tests__|spec)\//i, layer: 'Tests' },
];

function classifyLayer(filePath: string): string {
  const normalized = '/' + filePath;
  for (const rule of LAYER_RULES) {
    if (rule.pattern.test(normalized)) return rule.layer;
  }
  return 'Core';
}

/** Get the module (directory) path for a file */
function getModulePath(filePath: string): string {
  return dirname(filePath).replace(/\\/g, '/');
}

/** Pretty label for a module directory */
function moduleLabel(dirPath: string): string {
  const parts = dirPath.split('/').filter(Boolean);
  // Use last 2 path segments for readability
  return parts.slice(-2).join('/') || dirPath;
}

// ============================================================
// Complexity Estimation
//
// Simple heuristic based on LOC + nesting depth + branch count.
// This is intentionally rough for the PoC — real implementation
// would use tree-sitter to count actual branches/nesting.
// ============================================================

function estimateComplexity(loc: number, symbolCount: number): number {
  // Base: 1 per 10 LOC, bonus for high symbol density
  const base = Math.floor(loc / 10);
  const density = symbolCount > 0 ? Math.floor(symbolCount / 3) : 0;
  return Math.min(base + density, 100);
}

// ============================================================
// Graph Builder
// ============================================================

export function buildGraph(
  files: FileAnalysis[],
  projectRoot: string
): AnalysisOutput {
  const startTime = Date.now();

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Track unique layers and modules to avoid duplicates
  const seenLayers = new Map<string, GraphNode>();
  const seenModules = new Map<string, GraphNode>();

  // Maps for edge resolution
  // file_path → file node ID
  const filePathToNodeId = new Map<string, string>();
  // exported symbol name → { fileNodeId, symbolNodeId }
  const exportedSymbols = new Map<string, { fileId: string; symbolId: string; filePath: string }>();

  // ---- Pass 1: Create file nodes, symbol nodes, layer/module hierarchy ----

  for (const file of files) {
    const layer = classifyLayer(file.file_path);
    const modPath = getModulePath(file.file_path);

    // Ensure layer node exists
    const lid = layerId(layer);
    if (!seenLayers.has(lid)) {
      const layerNode: GraphNode = {
        id: lid,
        type: 'layer',
        label: layer,
        metadata: { color: getLayerColor(layer) },
      };
      seenLayers.set(lid, layerNode);
      nodes.push(layerNode);
    }

    // Ensure module node exists (parent = layer)
    const mid = moduleId(modPath);
    if (!seenModules.has(mid)) {
      const modNode: GraphNode = {
        id: mid,
        type: 'module',
        label: moduleLabel(modPath),
        parent_id: lid,
        file_path: modPath,
        metadata: {},
      };
      seenModules.set(mid, modNode);
      nodes.push(modNode);
    }

    // File node (parent = module)
    const fid = fileId(file.file_path);
    filePathToNodeId.set(file.file_path, fid);

    const fileNode: GraphNode = {
      id: fid,
      type: 'file',
      label: basename(file.file_path),
      parent_id: mid,
      file_path: file.file_path,
      loc: file.loc,
      complexity: estimateComplexity(file.loc, file.symbols.length),
      export_count: file.exports.length,
      import_count: file.imports.length,
      is_exported: file.exports.length > 0,
      metadata: {
        language: file.language,
      },
    };
    nodes.push(fileNode);

    // Symbol nodes (parent = file)
    for (const sym of file.symbols) {
      const sid = symbolId(file.file_path, sym.name);
      const symNode: GraphNode = {
        id: sid,
        type: 'symbol',
        subtype: sym.kind,
        label: sym.name,
        parent_id: fid,
        file_path: file.file_path,
        loc: sym.end_line - sym.line + 1,
        is_exported: sym.is_exported,
        metadata: {
          is_async: sym.is_async,
          params: sym.params,
          return_type: sym.return_type,
          jsx_returns: sym.jsx_returns,
          line: sym.line,
          end_line: sym.end_line,
        },
      };
      nodes.push(symNode);

      // Track exported symbols for edge resolution
      if (sym.is_exported) {
        exportedSymbols.set(`${file.file_path}:${sym.name}`, {
          fileId: fid,
          symbolId: sid,
          filePath: file.file_path,
        });
      }
    }
  }

  // Backfill module-level metrics
  for (const [mid, modNode] of seenModules) {
    const childFiles = nodes.filter(n => n.type === 'file' && n.parent_id === mid);
    modNode.loc = childFiles.reduce((sum, f) => sum + (f.loc || 0), 0);
    modNode.export_count = childFiles.reduce((sum, f) => sum + (f.export_count || 0), 0);
    modNode.import_count = childFiles.reduce((sum, f) => sum + (f.import_count || 0), 0);
    modNode.complexity = estimateComplexity(modNode.loc || 0, childFiles.length);
    modNode.metadata = {
      ...modNode.metadata,
      file_count: childFiles.length,
    };
  }

  // Backfill layer-level metrics
  for (const [lid, layerNode] of seenLayers) {
    const childModules = nodes.filter(n => n.type === 'module' && n.parent_id === lid);
    const childFiles = nodes.filter(n => n.type === 'file' &&
      childModules.some(m => m.id === n.parent_id));
    layerNode.loc = childFiles.reduce((sum, f) => sum + (f.loc || 0), 0);
    layerNode.metadata = {
      ...layerNode.metadata,
      module_count: childModules.length,
      file_count: childFiles.length,
    };
  }

  // ---- Pass 2: Build edges from imports ----

  for (const file of files) {
    const sourceFid = filePathToNodeId.get(file.file_path);
    if (!sourceFid) continue;

    for (const imp of file.imports) {
      // Skip external packages (no relative path)
      if (!imp.source.startsWith('.') && !imp.source.startsWith('/')) {
        continue;
      }

      // Resolve relative import to a file path
      const resolvedPath = resolveImportPath(
        file.file_path,
        imp.source,
        new Set(files.map(f => f.file_path))
      );

      if (!resolvedPath) continue;

      const targetFid = filePathToNodeId.get(resolvedPath);
      if (!targetFid || targetFid === sourceFid) continue;

      // File-level import edge
      const eid = edgeId(sourceFid, targetFid, 'imports');
      // Avoid duplicate edges
      if (!edges.find(e => e.id === eid)) {
        edges.push({
          id: eid,
          source_id: sourceFid,
          target_id: targetFid,
          type: 'imports',
          weight: imp.specifiers.length || 1,
          metadata: {
            specifiers: imp.specifiers,
            line: imp.line,
          },
        });
      }
    }
  }

  // ---- Pass 3: Detect framework ----
  const allImportSources = files.flatMap(f => f.imports.map(i => i.source));
  const detectedFramework = detectFramework(allImportSources);

  // ---- Build summary ----
  const allFiles = nodes.filter(n => n.type === 'file');
  const allSymbols = nodes.filter(n => n.type === 'symbol');
  const totalLoc = allFiles.reduce((sum, f) => sum + (f.loc || 0), 0);

  const languages = [...new Set(files.map(f => f.language))];

  const layerSummary: LayerSummary[] = [...seenLayers.values()].map(layer => {
    const layerModules = nodes.filter(n => n.type === 'module' && n.parent_id === layer.id);
    const layerFiles = nodes.filter(n => n.type === 'file' &&
      layerModules.some(m => m.id === n.parent_id));
    const layerSymbols = nodes.filter(n => n.type === 'symbol' &&
      layerFiles.some(f => f.id === n.parent_id));

    return {
      id: layer.id,
      label: layer.label,
      file_count: layerFiles.length,
      symbol_count: layerSymbols.length,
      loc: layerFiles.reduce((sum, f) => sum + (f.loc || 0), 0),
    };
  });

  // ---- Build Cytoscape elements ----
  // CRITICAL from v0.5: "Always sort nodes children-first in our JSON serializer.
  // Parents come after their children in the array."
  const cytoscapeElements = buildCytoscapeElements(nodes, edges);

  const durationMs = Date.now() - startTime;

  return {
    schema_version: '1.0.0',
    analyzed_at: new Date().toISOString(),
    analysis_duration_ms: durationMs,
    analyzer_version: '0.1.0-poc',

    summary: {
      total_files: allFiles.length,
      total_symbols: allSymbols.length,
      total_edges: edges.length,
      total_loc: totalLoc,
      languages,
      detected_framework: detectedFramework,
      layer_summary: layerSummary,
    },

    nodes,
    edges,
    cytoscape_elements: cytoscapeElements,
  };
}

// ============================================================
// Cytoscape.js Element Builder
//
// v0.5 rule: children-first ordering to avoid layout animation bug
// ============================================================

function buildCytoscapeElements(
  nodes: GraphNode[],
  edges: GraphEdge[]
): CytoscapeElement[] {
  const elements: CytoscapeElement[] = [];

  // Sort: symbols first, then files, then modules, then layers (children before parents)
  const typeOrder: Record<string, number> = {
    symbol: 0,
    file: 1,
    module: 2,
    layer: 3,
  };

  const sortedNodes = [...nodes].sort(
    (a, b) => (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99)
  );

  for (const node of sortedNodes) {
    elements.push({
      group: 'nodes',
      data: {
        id: node.id,
        label: node.label,
        type: node.type,
        subtype: node.subtype,
        parent: node.parent_id,  // Cytoscape uses 'parent' not 'parent_id'
        file_path: node.file_path,
        loc: node.loc,
        complexity: node.complexity,
        export_count: node.export_count,
        import_count: node.import_count,
        is_exported: node.is_exported,
        ...node.metadata,
      },
    });
  }

  for (const edge of edges) {
    elements.push({
      group: 'edges',
      data: {
        id: edge.id,
        source: edge.source_id,
        target: edge.target_id,
        type: edge.type,
        weight: edge.weight,
        ...edge.metadata,
      },
    });
  }

  return elements;
}

// ============================================================
// Import Resolution
// ============================================================

function resolveImportPath(
  fromFile: string,
  importSource: string,
  knownFiles: Set<string>
): string | null {
  const fromDir = dirname(fromFile).replace(/\\/g, '/');
  // Resolve relative to the importing file's directory
  // Use posix-style joining since our paths are normalized to forward slashes
  const parts = fromDir.split('/');
  const importParts = importSource.split('/');
  
  for (const part of importParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }
  
  const resolved = parts.join('/');

  // Try exact match and common extensions
  const candidates = [
    resolved,
    resolved + '.ts',
    resolved + '.tsx',
    resolved + '.js',
    resolved + '.jsx',
    resolved + '/index.ts',
    resolved + '/index.tsx',
    resolved + '/index.js',
  ];

  for (const candidate of candidates) {
    if (knownFiles.has(candidate)) return candidate;
  }

  return null;
}

// ============================================================
// Framework Detection
// ============================================================

function detectFramework(importSources: string[]): string | undefined {
  const counts: Record<string, number> = {};
  const frameworks: Record<string, string[]> = {
    nextjs: ['next', 'next/router', 'next/link', 'next/image', 'next/navigation'],
    react: ['react', 'react-dom'],
    express: ['express'],
    fastify: ['fastify'],
    vue: ['vue'],
    svelte: ['svelte'],
    angular: ['@angular/core'],
  };

  for (const source of importSources) {
    for (const [framework, patterns] of Object.entries(frameworks)) {
      if (patterns.some(p => source === p || source.startsWith(p + '/'))) {
        counts[framework] = (counts[framework] || 0) + 1;
      }
    }
  }

  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return undefined;

  // Next.js imports imply React too, so prefer Next.js
  if (counts['nextjs'] && counts['nextjs'] > 0) return 'nextjs';
  return sorted[0][0];
}

// ============================================================
// Layer Colors (for visualization)
// ============================================================

function getLayerColor(layer: string): string {
  const colors: Record<string, string> = {
    API: '#f59e0b',
    Pages: '#8b5cf6',
    UI: '#3b82f6',
    Hooks: '#06b6d4',
    State: '#10b981',
    Lib: '#6366f1',
    Types: '#ec4899',
    Config: '#78716c',
    Services: '#f97316',
    Middleware: '#ef4444',
    Tests: '#a3a3a3',
    Core: '#64748b',
  };
  return colors[layer] || '#64748b';
}
