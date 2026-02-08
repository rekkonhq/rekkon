import { basename, dirname } from 'node:path';
import type { CytoscapeEdge, CytoscapeNode, Edge, Node, NodeSubtype } from '@rekkon/core';
import { DEFAULT_LAYER_RULES, generateEdgeId, generateNodeId } from '@rekkon/core';
import type {
  ExtractedImport,
  ExtractedSymbol,
  FileAnalysis,
  GraphBuildResult,
  LayerSummary,
} from './types.js';

const LAYER_RULES = Object.entries(DEFAULT_LAYER_RULES)
  .map(([pathPattern, layer]) => ({
    normalizedPattern: normalizePath(pathPattern).toLowerCase(),
    layer,
  }))
  .sort((a, b) => b.normalizedPattern.length - a.normalizedPattern.length);

const NODE_ORDER: Record<Node['type'], number> = {
  symbol: 0,
  file: 1,
  module: 2,
  layer: 3,
};

export function buildGraph(files: FileAnalysis[]): GraphBuildResult {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const edgeIds = new Set<string>();

  const layerIdByLabel = new Map<string, string>();
  const moduleIdByPath = new Map<string, string>();
  const fileIdByPath = new Map<string, string>();

  for (const file of files) {
    const layerLabel = classifyLayer(file.filePath);
    const layerNodeId = ensureLayerNode(layerLabel, nodes, layerIdByLabel);

    const modulePath = getModulePath(file.filePath);
    const moduleNodeId = ensureModuleNode(modulePath, layerNodeId, nodes, moduleIdByPath);

    const fileNode = createFileNode(file, moduleNodeId);
    nodes.push(fileNode);
    fileIdByPath.set(file.filePath, fileNode.id);

    for (const symbol of file.symbols) {
      nodes.push(createSymbolNode(file.filePath, fileNode.id, symbol));
    }
  }

  backfillModuleMetrics(nodes);
  backfillLayerMetrics(nodes);
  buildImportEdges(files, fileIdByPath, edges, edgeIds);

  const summary = buildSummary(files, nodes, edges);
  return {
    nodes,
    edges,
    cytoscapeNodes: buildCytoscapeNodes(nodes),
    cytoscapeEdges: buildCytoscapeEdges(edges),
    summary,
  };
}

function ensureLayerNode(
  layerLabel: string,
  nodes: Node[],
  layerIdByLabel: Map<string, string>,
): string {
  const existing = layerIdByLabel.get(layerLabel);
  if (existing) {
    return existing;
  }

  const id = generateNodeId('layer', layerLabel);
  const node: Node = {
    id,
    type: 'layer',
    label: layerLabel,
    export_count: 0,
    import_count: 0,
    is_exported: false,
    metadata: {
      color: getLayerColor(layerLabel),
    },
  };
  nodes.push(node);
  layerIdByLabel.set(layerLabel, id);
  return id;
}

function ensureModuleNode(
  modulePath: string,
  layerNodeId: string,
  nodes: Node[],
  moduleIdByPath: Map<string, string>,
): string {
  const existing = moduleIdByPath.get(modulePath);
  if (existing) {
    return existing;
  }

  const id = generateNodeId('module', modulePath);
  const node: Node = {
    id,
    type: 'module',
    label: moduleLabel(modulePath),
    parent_id: layerNodeId,
    file_path: modulePath || null,
    export_count: 0,
    import_count: 0,
    is_exported: false,
    metadata: {},
  };
  nodes.push(node);
  moduleIdByPath.set(modulePath, id);
  return id;
}

function createFileNode(file: FileAnalysis, moduleNodeId: string): Node {
  return {
    id: generateNodeId('file', file.filePath),
    type: 'file',
    subtype: classifyFileSubtype(file.filePath),
    label: basename(file.filePath),
    parent_id: moduleNodeId,
    file_path: file.filePath,
    loc: file.loc,
    complexity: estimateComplexity(file.loc, file.symbols.length),
    export_count: file.exports.length,
    import_count: file.imports.length,
    is_exported: file.exports.length > 0,
    metadata: {
      language: file.language,
    },
  };
}

function createSymbolNode(filePath: string, parentFileId: string, symbol: ExtractedSymbol): Node {
  return {
    id: generateNodeId('symbol', filePath, symbol.name),
    type: 'symbol',
    subtype: symbol.kind,
    label: symbol.name,
    parent_id: parentFileId,
    file_path: filePath,
    loc: symbol.endLine - symbol.line + 1,
    is_exported: symbol.isExported,
    export_count: 0,
    import_count: 0,
    metadata: {
      is_async: symbol.isAsync,
      params: symbol.params?.map((paramName) => ({ name: paramName })),
      return_type: symbol.returnType,
      jsx_returns: symbol.jsxReturns,
      line: symbol.line,
      end_line: symbol.endLine,
    },
  };
}

function backfillModuleMetrics(nodes: Node[]): void {
  const modules = nodes.filter((node) => node.type === 'module');

  for (const moduleNode of modules) {
    const childFiles = nodes.filter(
      (node) => node.type === 'file' && node.parent_id === moduleNode.id,
    );
    const totalLoc = childFiles.reduce((sum, fileNode) => sum + (fileNode.loc ?? 0), 0);
    const totalImports = childFiles.reduce(
      (sum, fileNode) => sum + (fileNode.import_count ?? 0),
      0,
    );
    const totalExports = childFiles.reduce(
      (sum, fileNode) => sum + (fileNode.export_count ?? 0),
      0,
    );

    moduleNode.loc = totalLoc;
    moduleNode.import_count = totalImports;
    moduleNode.export_count = totalExports;
    moduleNode.complexity = estimateComplexity(totalLoc, childFiles.length);
    moduleNode.metadata = {
      ...moduleNode.metadata,
      file_count: childFiles.length,
    };
  }
}

function backfillLayerMetrics(nodes: Node[]): void {
  const modules = nodes.filter((node) => node.type === 'module');
  const files = nodes.filter((node) => node.type === 'file');
  const layers = nodes.filter((node) => node.type === 'layer');

  for (const layerNode of layers) {
    const childModules = modules.filter((moduleNode) => moduleNode.parent_id === layerNode.id);
    const childModuleIds = new Set(childModules.map((moduleNode) => moduleNode.id));
    const childFiles = files.filter((fileNode) => childModuleIds.has(fileNode.parent_id ?? ''));
    const totalLoc = childFiles.reduce((sum, fileNode) => sum + (fileNode.loc ?? 0), 0);

    layerNode.loc = totalLoc;
    layerNode.metadata = {
      ...layerNode.metadata,
      module_count: childModules.length,
      file_count: childFiles.length,
    };
  }
}

function buildImportEdges(
  files: FileAnalysis[],
  fileIdByPath: Map<string, string>,
  edges: Edge[],
  edgeIds: Set<string>,
): void {
  const knownFiles = new Set(files.map((file) => file.filePath));

  for (const file of files) {
    const sourceId = fileIdByPath.get(file.filePath);
    if (!sourceId) {
      continue;
    }

    for (const imp of file.imports) {
      if (!isLocalImport(imp)) {
        continue;
      }
      const resolvedTargetPath = resolveImportPath(file.filePath, imp.source, knownFiles);
      if (!resolvedTargetPath) {
        continue;
      }

      const targetId = fileIdByPath.get(resolvedTargetPath);
      if (!targetId || targetId === sourceId) {
        continue;
      }

      const id = generateEdgeId(sourceId, targetId, 'imports');
      if (edgeIds.has(id)) {
        continue;
      }

      edges.push({
        id,
        source_id: sourceId,
        target_id: targetId,
        type: 'imports',
        weight: Math.max(1, imp.specifiers.length),
        metadata: {
          specifiers: imp.specifiers,
          line: imp.line,
        },
      });
      edgeIds.add(id);
    }
  }
}

function buildSummary(files: FileAnalysis[], nodes: Node[], edges: Edge[]): GraphBuildResult['summary'] {
  const fileNodes = nodes.filter((node) => node.type === 'file');
  const symbolNodes = nodes.filter((node) => node.type === 'symbol');
  const layerNodes = nodes.filter((node) => node.type === 'layer');
  const moduleNodes = nodes.filter((node) => node.type === 'module');

  const totalLoc = fileNodes.reduce((sum, fileNode) => sum + (fileNode.loc ?? 0), 0);
  const languages = [...new Set(files.map((file) => file.language))].sort();
  const framework = detectFramework(files.flatMap((file) => file.imports.map((imp) => imp.source)));

  const layerSummary: LayerSummary[] = layerNodes.map((layerNode) => {
    const layerModules = moduleNodes.filter((moduleNode) => moduleNode.parent_id === layerNode.id);
    const layerModuleIds = new Set(layerModules.map((moduleNode) => moduleNode.id));
    const layerFiles = fileNodes.filter((fileNode) => layerModuleIds.has(fileNode.parent_id ?? ''));
    const layerFileIds = new Set(layerFiles.map((fileNode) => fileNode.id));
    const layerSymbols = symbolNodes.filter((symbolNode) =>
      layerFileIds.has(symbolNode.parent_id ?? ''),
    );

    return {
      id: layerNode.id,
      label: layerNode.label,
      file_count: layerFiles.length,
      symbol_count: layerSymbols.length,
    };
  });

  return {
    total_files: fileNodes.length,
    total_symbols: symbolNodes.length,
    total_edges: edges.length,
    total_loc: totalLoc,
    languages,
    framework,
    layer_summary: layerSummary,
  };
}

function buildCytoscapeNodes(nodes: Node[]): CytoscapeNode[] {
  const sortedNodes = [...nodes].sort((a, b) => NODE_ORDER[a.type] - NODE_ORDER[b.type]);
  return sortedNodes.map((node) => ({
    data: {
      ...node,
      parent: node.parent_id ?? undefined,
    },
  }));
}

function buildCytoscapeEdges(edges: Edge[]): CytoscapeEdge[] {
  return edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source_id,
      target: edge.target_id,
      type: edge.type,
      weight: edge.weight,
      metadata: edge.metadata,
    },
  }));
}

function isLocalImport(imp: ExtractedImport): boolean {
  return imp.source.startsWith('.') || imp.source.startsWith('/');
}

function resolveImportPath(fromFilePath: string, source: string, knownFiles: Set<string>): string | null {
  const fromDirectory = getModulePath(fromFilePath);
  const segments = fromDirectory ? fromDirectory.split('/') : [];

  for (const sourcePart of source.split('/')) {
    if (sourcePart === '.' || sourcePart.length === 0) {
      continue;
    }
    if (sourcePart === '..') {
      segments.pop();
      continue;
    }
    segments.push(sourcePart);
  }

  const resolved = segments.join('/');
  const candidates = [
    resolved,
    `${resolved}.ts`,
    `${resolved}.tsx`,
    `${resolved}.js`,
    `${resolved}.jsx`,
    `${resolved}/index.ts`,
    `${resolved}/index.tsx`,
    `${resolved}/index.js`,
    `${resolved}/index.jsx`,
  ];

  for (const candidate of candidates) {
    if (knownFiles.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function classifyLayer(filePath: string): string {
  const normalized = normalizePath(filePath).toLowerCase();
  for (const rule of LAYER_RULES) {
    const paddedPath = `/${normalized}/`;
    const paddedPattern = `/${rule.normalizedPattern}/`;
    if (paddedPath.includes(paddedPattern)) {
      return rule.layer;
    }
  }
  return 'Core';
}

function classifyFileSubtype(filePath: string): NodeSubtype | undefined {
  const normalized = normalizePath(filePath).toLowerCase();

  if (/(^|\/)(components?|ui)\//.test(normalized)) return 'component';
  if (/(^|\/)(api|routes?)\//.test(normalized)) return 'route';
  if (/(^|\/)(pages|app)\//.test(normalized)) return 'page';
  if (/(^|\/)hooks?\//.test(normalized)) return 'hook';
  if (/(^|\/)(lib|utils?|helpers?)\//.test(normalized)) return 'utility';
  if (/(^|\/)(config|constants?)\//.test(normalized)) return 'config';
  if (/(^|\/)(__tests__|tests?|spec)\//.test(normalized)) return 'test';
  if (/(^|\/)types?\//.test(normalized) || /\.types?\.(ts|tsx)$/.test(normalized)) {
    return 'type-definition';
  }
  if (/(^|\/)styles?\//.test(normalized) || /\.styles?\.(ts|tsx)$/.test(normalized)) {
    return 'style';
  }

  return undefined;
}

function detectFramework(importSources: string[]): string | undefined {
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
  return topFramework?.[0];
}

function getModulePath(filePath: string): string {
  const modulePath = normalizePath(dirname(filePath));
  return modulePath === '.' ? '' : modulePath;
}

function moduleLabel(modulePath: string): string {
  if (!modulePath) {
    return '(root)';
  }
  const parts = modulePath.split('/').filter(Boolean);
  return parts.slice(-2).join('/') || modulePath;
}

function estimateComplexity(loc: number, symbolCount: number): number {
  const base = Math.floor(loc / 10);
  const density = symbolCount > 0 ? Math.floor(symbolCount / 3) : 0;
  return Math.min(base + density, 100);
}

function getLayerColor(layer: string): string {
  const colors: Record<string, string> = {
    API: '#f59e0b',
    Pages: '#8b5cf6',
    UI: '#3b82f6',
    Hooks: '#06b6d4',
    State: '#10b981',
    Core: '#6366f1',
    Services: '#f97316',
    Data: '#0ea5e9',
    Types: '#ec4899',
    Styles: '#14b8a6',
    Assets: '#84cc16',
    Config: '#78716c',
    Middleware: '#ef4444',
    Tests: '#a3a3a3',
  };
  return colors[layer] ?? '#64748b';
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}
