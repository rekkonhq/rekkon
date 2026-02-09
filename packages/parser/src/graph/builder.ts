import { posix } from 'node:path';
import {
  RekkonGraphSchema,
  generateEdgeId,
  generateNodeId,
  serializeGraph,
  type CytoscapeEdge,
  type CytoscapeNode,
  type NodeSubtype,
  type RekkonGraph,
} from '@rekkon/core';
import type { ParsedFile } from '../languages/index.js';
import { isLocalImportSource, resolveRelativeImportPath } from '../utils/imports.js';
import { classifyFileToLayer } from './layers.js';
import { getModuleLabel, getModulePath } from './modules.js';

const SYMBOL_NODE_SUBTYPES = new Set<NodeSubtype>([
  'function',
  'class',
  'interface',
  'type-alias',
  'variable',
  'enum',
  'constant',
]);

export interface BuildGraphOptions {
  projectRoot: string;
  files: ParsedFile[];
  moduleDepth: number;
  extractSymbols: boolean;
  analyzerVersion: string;
}

export function buildGraph(options: BuildGraphOptions): RekkonGraph {
  const root = normalizePath(options.projectRoot);
  const files = [...options.files].sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const layerNodesById = new Map<string, CytoscapeNode>();
  const moduleNodesByPath = new Map<string, CytoscapeNode>();
  const fileNodesByPath = new Map<string, CytoscapeNode>();
  const symbolNodes: CytoscapeNode[] = [];
  const seenSymbolIds = new Set<string>();

  for (const file of files) {
    const layerLabel = classifyFileToLayer(file.relativePath);
    const layerId = generateNodeId('layer', root, layerLabel);
    if (!layerNodesById.has(layerId)) {
      layerNodesById.set(layerId, {
        data: {
          id: layerId,
          type: 'layer',
          label: layerLabel,
          export_count: 0,
          import_count: 0,
          is_exported: false,
          metadata: {},
        },
      });
    }

    const modulePath = getModulePath(file.relativePath, options.moduleDepth);
    const moduleKey = modulePath || '(root)';
    const moduleId = generateNodeId('module', root, moduleKey);
    if (!moduleNodesByPath.has(modulePath)) {
      moduleNodesByPath.set(modulePath, {
        data: {
          id: moduleId,
          type: 'module',
          label: getModuleLabel(modulePath),
          parent: layerId,
          parent_id: layerId,
          file_path: modulePath || null,
          export_count: 0,
          import_count: 0,
          is_exported: false,
          metadata: {},
        },
      });
    }

    const fileId = generateNodeId('file', root, file.relativePath);
    const fileSubtype = classifyFileSubtype(file.relativePath, file.hasDefaultExport);
    const symbolCount = options.extractSymbols ? file.symbols.length : 0;
    const importCount = file.imports.length;
    const exportedRuntimeSymbolCount = file.symbols.reduce(
      (count, symbol) =>
        count + Number(symbol.isExported && symbol.subtype !== 'interface' && symbol.subtype !== 'type-alias'),
      0,
    );
    const exportCount = exportedRuntimeSymbolCount > 0 ? exportedRuntimeSymbolCount : file.exports.length;
    const fileNode: CytoscapeNode = {
      data: {
        id: fileId,
        type: 'file',
        subtype: fileSubtype,
        label: posix.basename(file.relativePath),
        parent: moduleId,
        parent_id: moduleId,
        file_path: file.relativePath,
        loc: file.loc,
        complexity: estimateComplexity(file.loc, symbolCount),
        export_count: exportCount,
        import_count: importCount,
        is_exported: exportCount > 0,
        metadata: {
          language: file.language,
        },
      },
    };
    fileNodesByPath.set(file.relativePath, fileNode);

    if (!options.extractSymbols) {
      continue;
    }

    for (const symbol of file.symbols) {
      if (!SYMBOL_NODE_SUBTYPES.has(symbol.subtype)) {
        continue;
      }

      const symbolId = generateNodeId('symbol', root, file.relativePath, symbol.name);
      if (seenSymbolIds.has(symbolId)) {
        continue;
      }
      seenSymbolIds.add(symbolId);

      symbolNodes.push({
        data: {
          id: symbolId,
          type: 'symbol',
          subtype: symbol.subtype,
          label: symbol.name,
          parent: fileId,
          parent_id: fileId,
          file_path: file.relativePath,
          loc: Math.max(1, symbol.endLine - symbol.line + 1),
          export_count: 0,
          import_count: 0,
          is_exported: symbol.isExported,
          metadata: {
            language: file.language,
            is_async: symbol.isAsync,
            return_type: symbol.returnType,
            params: symbol.params?.map((name) => ({ name })),
            line: symbol.line,
            end_line: symbol.endLine,
          },
        },
      });
    }
  }

  const layerNodes = [...layerNodesById.values()].sort(compareLayerNodes);
  const moduleNodes = [...moduleNodesByPath.values()].sort(compareModuleNodes);
  const fileNodes = [...fileNodesByPath.values()].sort(compareFileNodes);
  symbolNodes.sort(compareSymbolNodes);

  applyModuleMetrics(moduleNodes, fileNodes);
  applyLayerMetrics(layerNodes, moduleNodes, fileNodes);

  const edges = buildImportEdges(files, fileNodesByPath);
  const totalLoc = fileNodes.reduce((sum, node) => sum + (node.data.loc ?? 0), 0);
  const languages = [...new Set(files.map((file) => file.language))].sort((a, b) =>
    a.localeCompare(b),
  );
  const framework = detectFramework(files.flatMap((file) => file.imports.map((imp) => imp.source)));
  const analyzedAt = new Date().toISOString();

  const raw = {
    version: '1.0.0',
    generated_at: analyzedAt,
    analyzer_version: options.analyzerVersion,
    snapshot: {
      schema_version: '1.0.0',
      total_files: fileNodes.length,
      total_symbols: symbolNodes.length,
      total_edges: edges.length,
      total_loc: totalLoc,
      languages,
      framework,
      layer_summary: buildLayerSummary(layerNodes, moduleNodes, fileNodes, symbolNodes),
      analyzer_version: options.analyzerVersion,
      trigger: 'manual' as const,
      analyzed_at: analyzedAt,
    },
    elements: {
      nodes: [...layerNodes, ...moduleNodes, ...fileNodes, ...symbolNodes],
      edges,
    },
  };

  const validated = RekkonGraphSchema.parse(raw);
  return serializeGraph(validated) as RekkonGraph;
}

function buildImportEdges(
  files: ParsedFile[],
  fileNodesByPath: Map<string, CytoscapeNode>,
): CytoscapeEdge[] {
  const knownFiles = new Set(fileNodesByPath.keys());
  const edgesById = new Map<string, CytoscapeEdge>();

  for (const file of files) {
    const sourceNode = fileNodesByPath.get(file.relativePath);
    if (!sourceNode) {
      continue;
    }

    for (const extractedImport of file.imports) {
      if (!isLocalImportSource(extractedImport.source)) {
        continue;
      }

      const targetFilePath = resolveRelativeImportPath(
        file.relativePath,
        extractedImport.source,
        knownFiles,
      );
      if (!targetFilePath) {
        continue;
      }

      const targetNode = fileNodesByPath.get(targetFilePath);
      if (!targetNode || sourceNode.data.id === targetNode.data.id) {
        continue;
      }

      const edgeId = generateEdgeId(sourceNode.data.id, targetNode.data.id, 'imports');
      if (edgesById.has(edgeId)) {
        continue;
      }

      edgesById.set(edgeId, {
        data: {
          id: edgeId,
          source: sourceNode.data.id,
          target: targetNode.data.id,
          type: 'imports',
          weight: Math.max(1, extractedImport.specifiers.length),
          metadata: {
            source: extractedImport.source,
            specifiers: extractedImport.specifiers,
            line: extractedImport.line,
          },
        },
      });
    }
  }

  return [...edgesById.values()].sort(compareEdges);
}

function applyModuleMetrics(moduleNodes: CytoscapeNode[], fileNodes: CytoscapeNode[]): void {
  for (const moduleNode of moduleNodes) {
    const childFiles = fileNodes.filter((fileNode) => fileNode.data.parent_id === moduleNode.data.id);
    const loc = childFiles.reduce((sum, fileNode) => sum + (fileNode.data.loc ?? 0), 0);
    const importCount = childFiles.reduce(
      (sum, fileNode) => sum + (fileNode.data.import_count ?? 0),
      0,
    );
    const exportCount = childFiles.reduce(
      (sum, fileNode) => sum + (fileNode.data.export_count ?? 0),
      0,
    );

    moduleNode.data.loc = loc;
    moduleNode.data.import_count = importCount;
    moduleNode.data.export_count = exportCount;
    moduleNode.data.complexity = estimateComplexity(loc, childFiles.length);
    moduleNode.data.metadata = {
      ...moduleNode.data.metadata,
      file_count: childFiles.length,
    };
  }
}

function applyLayerMetrics(
  layerNodes: CytoscapeNode[],
  moduleNodes: CytoscapeNode[],
  fileNodes: CytoscapeNode[],
): void {
  for (const layerNode of layerNodes) {
    const layerModules = moduleNodes.filter((moduleNode) => moduleNode.data.parent_id === layerNode.data.id);
    const moduleIds = new Set(layerModules.map((moduleNode) => moduleNode.data.id));
    const layerFiles = fileNodes.filter((fileNode) => moduleIds.has(fileNode.data.parent_id ?? ''));
    const loc = layerFiles.reduce((sum, fileNode) => sum + (fileNode.data.loc ?? 0), 0);

    layerNode.data.loc = loc;
    layerNode.data.metadata = {
      ...layerNode.data.metadata,
      module_count: layerModules.length,
      file_count: layerFiles.length,
    };
  }
}

function buildLayerSummary(
  layerNodes: CytoscapeNode[],
  moduleNodes: CytoscapeNode[],
  fileNodes: CytoscapeNode[],
  symbolNodes: CytoscapeNode[],
): Array<{ id: string; label: string; file_count: number; symbol_count: number }> {
  const summary = layerNodes.map((layerNode) => {
    const layerModules = moduleNodes.filter((moduleNode) => moduleNode.data.parent_id === layerNode.data.id);
    const moduleIds = new Set(layerModules.map((moduleNode) => moduleNode.data.id));
    const layerFiles = fileNodes.filter((fileNode) => moduleIds.has(fileNode.data.parent_id ?? ''));
    const fileIds = new Set(layerFiles.map((fileNode) => fileNode.data.id));
    const layerSymbols = symbolNodes.filter((symbolNode) => fileIds.has(symbolNode.data.parent_id ?? ''));

    return {
      id: layerNode.data.id,
      label: layerNode.data.label,
      file_count: layerFiles.length,
      symbol_count: layerSymbols.length,
    };
  });

  return summary.sort((a, b) => a.label.localeCompare(b.label) || a.id.localeCompare(b.id));
}

function classifyFileSubtype(relativePath: string, hasDefaultExport: boolean): NodeSubtype | undefined {
  const normalizedPath = normalizePath(relativePath).toLowerCase();
  const fileName = posix.basename(normalizedPath);

  if (normalizedPath.endsWith('.d.ts')) {
    return 'type-definition';
  }
  if (
    normalizedPath.endsWith('.module.css') ||
    normalizedPath.endsWith('.css') ||
    normalizedPath.endsWith('.scss')
  ) {
    return 'style';
  }
  if (fileName.includes('.test.') || fileName.includes('.spec.')) {
    return 'test';
  }
  if (
    normalizedPath.startsWith('app/api/') ||
    normalizedPath.includes('/app/api/') ||
    normalizedPath.startsWith('routes/') ||
    normalizedPath.includes('/routes/')
  ) {
    return 'route';
  }
  if (
    normalizedPath.startsWith('app/') ||
    normalizedPath.includes('/app/') ||
    normalizedPath.startsWith('pages/') ||
    normalizedPath.includes('/pages/')
  ) {
    return 'page';
  }
  if (fileName.startsWith('use')) {
    return 'hook';
  }
  if (
    normalizedPath.startsWith('utils/') ||
    normalizedPath.includes('/utils/') ||
    normalizedPath.startsWith('helpers/') ||
    normalizedPath.includes('/helpers/')
  ) {
    return 'utility';
  }
  if (normalizedPath.startsWith('config/') || normalizedPath.includes('/config/')) {
    return 'config';
  }
  if ((normalizedPath.endsWith('.tsx') || normalizedPath.endsWith('.jsx')) && hasDefaultExport) {
    return 'component';
  }

  return undefined;
}

function detectFramework(importSources: string[]): string | null {
  const frameworks: Record<string, string[]> = {
    nextjs: ['next', 'next/router', 'next/link', 'next/image', 'next/navigation'],
    react: ['react', 'react-dom'],
    express: ['express'],
    fastify: ['fastify'],
    vue: ['vue'],
    svelte: ['svelte'],
    angular: ['@angular/core'],
  };

  const counts: Record<string, number> = {};
  for (const source of importSources) {
    for (const [framework, patterns] of Object.entries(frameworks)) {
      if (patterns.some((pattern) => source === pattern || source.startsWith(`${pattern}/`))) {
        counts[framework] = (counts[framework] ?? 0) + 1;
      }
    }
  }

  if ((counts.nextjs ?? 0) > 0) {
    return 'nextjs';
  }

  const topFramework = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return topFramework?.[0] ?? null;
}

function estimateComplexity(loc: number, symbolCount: number): number {
  const base = Math.floor(loc / 10);
  const density = symbolCount > 0 ? Math.floor(symbolCount / 3) : 0;
  return Math.min(base + density, 100);
}

function compareLayerNodes(a: CytoscapeNode, b: CytoscapeNode): number {
  return (
    a.data.label.localeCompare(b.data.label) ||
    a.data.id.localeCompare(b.data.id)
  );
}

function compareModuleNodes(a: CytoscapeNode, b: CytoscapeNode): number {
  return (
    (a.data.file_path ?? '').localeCompare(b.data.file_path ?? '') ||
    a.data.id.localeCompare(b.data.id)
  );
}

function compareFileNodes(a: CytoscapeNode, b: CytoscapeNode): number {
  return (
    (a.data.file_path ?? '').localeCompare(b.data.file_path ?? '') ||
    a.data.id.localeCompare(b.data.id)
  );
}

function compareSymbolNodes(a: CytoscapeNode, b: CytoscapeNode): number {
  const lineA = (a.data.metadata.line as number | undefined) ?? 0;
  const lineB = (b.data.metadata.line as number | undefined) ?? 0;
  return (
    (a.data.file_path ?? '').localeCompare(b.data.file_path ?? '') ||
    lineA - lineB ||
    a.data.label.localeCompare(b.data.label) ||
    a.data.id.localeCompare(b.data.id)
  );
}

function compareEdges(a: CytoscapeEdge, b: CytoscapeEdge): number {
  return (
    a.data.source.localeCompare(b.data.source) ||
    a.data.target.localeCompare(b.data.target) ||
    a.data.type.localeCompare(b.data.type) ||
    a.data.id.localeCompare(b.data.id)
  );
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '');
}
