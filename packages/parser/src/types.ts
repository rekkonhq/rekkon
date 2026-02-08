import type { CytoscapeEdge, CytoscapeNode, Edge, Node } from '@rekkon/core';

export type SourceLanguage = 'typescript' | 'tsx';

export type SymbolKind =
  | 'function'
  | 'class'
  | 'component'
  | 'interface'
  | 'type-alias'
  | 'enum'
  | 'variable'
  | 'hook';

export interface ExtractedImport {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  line: number;
}

export interface ExtractedExport {
  name: string;
  isDefault: boolean;
  line: number;
}

export interface ExtractedSymbol {
  name: string;
  kind: SymbolKind;
  isExported: boolean;
  isAsync: boolean;
  line: number;
  endLine: number;
  params?: string[];
  returnType?: string;
  jsxReturns: boolean;
}

export interface FileAnalysis {
  filePath: string;
  language: SourceLanguage;
  loc: number;
  imports: ExtractedImport[];
  exports: ExtractedExport[];
  symbols: ExtractedSymbol[];
}

export interface LayerSummary {
  id: string;
  label: string;
  file_count: number;
  symbol_count: number;
}

export interface GraphBuildSummary {
  total_files: number;
  total_symbols: number;
  total_edges: number;
  total_loc: number;
  languages: string[];
  framework?: string;
  layer_summary: LayerSummary[];
}

export interface GraphBuildResult {
  nodes: Node[];
  edges: Edge[];
  cytoscapeNodes: CytoscapeNode[];
  cytoscapeEdges: CytoscapeEdge[];
  summary: GraphBuildSummary;
}
