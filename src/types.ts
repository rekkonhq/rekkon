// ============================================================
// Types matching v0.5 database schema (archviz-brainstorm-v5.md)
// These map 1:1 to the `nodes` and `edges` SQL tables
// ============================================================

/** Node types in the hierarchy: Layer → Module → File → Symbol */
export type NodeType = 'layer' | 'module' | 'file' | 'symbol';

/** Symbol subtypes extracted by tree-sitter */
export type SymbolSubtype =
  | 'function'
  | 'arrow_function'
  | 'class'
  | 'component'      // React component (function returning JSX)
  | 'interface'
  | 'type_alias'
  | 'enum'
  | 'variable'
  | 'hook';           // React hook (use* convention)

/** Edge types between nodes */
export type EdgeType = 'imports' | 'exports' | 'calls' | 'renders' | 'implements';

/**
 * Graph node — maps to the `nodes` table in v0.5 schema.
 * Columns match exactly: id, type, subtype, label, parent_id, file_path,
 * loc, complexity, export_count, import_count, is_exported, metadata
 */
export interface GraphNode {
  // Primary key (deterministic: hash of path + name)
  id: string;

  // Core identity
  type: NodeType;
  subtype?: SymbolSubtype | string;
  label: string;

  // Hierarchy (compound node parent)
  parent_id?: string;
  file_path?: string;

  // Core metrics (own columns in DB)
  loc?: number;
  complexity?: number;
  export_count?: number;
  import_count?: number;
  is_exported?: boolean;

  // Extensible metadata (JSONB in DB)
  metadata: Record<string, unknown>;
}

/**
 * Graph edge — maps to the `edges` table in v0.5 schema.
 */
export interface GraphEdge {
  id: string;
  source_id: string;
  target_id: string;
  type: EdgeType | string;
  weight: number;
  metadata: Record<string, unknown>;
}

/**
 * Complete analysis output — maps to what gets stored in
 * `snapshots.graph_json` as Cytoscape.js-compatible JSON
 */
export interface AnalysisOutput {
  // Snapshot metadata
  schema_version: string;
  analyzed_at: string;
  analysis_duration_ms: number;
  analyzer_version: string;

  // Summary metrics (denormalized on snapshots table)
  summary: {
    total_files: number;
    total_symbols: number;
    total_edges: number;
    total_loc: number;
    languages: string[];
    detected_framework?: string;
    layer_summary: LayerSummary[];
  };

  // Source of truth (nodes + edges tables)
  nodes: GraphNode[];
  edges: GraphEdge[];

  // Cytoscape.js-compatible graph (for snapshots.graph_json)
  cytoscape_elements: CytoscapeElement[];
}

export interface LayerSummary {
  id: string;
  label: string;
  file_count: number;
  symbol_count: number;
  loc: number;
}

/** Cytoscape.js element format */
export interface CytoscapeElement {
  group: 'nodes' | 'edges';
  data: Record<string, unknown>;
}

// ============================================================
// Tree-sitter extraction intermediate types
// ============================================================

/** Raw import extracted from a file */
export interface ExtractedImport {
  source: string;          // The import path (e.g., './utils', 'react')
  specifiers: string[];    // Named imports
  is_default: boolean;     // Whether it includes a default import
  is_namespace: boolean;   // import * as X
  line: number;
}

/** Raw export extracted from a file */
export interface ExtractedExport {
  name: string;
  is_default: boolean;
  line: number;
}

/** Raw symbol (function, class, etc.) extracted from a file */
export interface ExtractedSymbol {
  name: string;
  kind: SymbolSubtype;
  is_exported: boolean;
  is_async: boolean;
  line: number;
  end_line: number;
  params?: string[];
  return_type?: string;
  jsx_returns: boolean;    // Does this function return JSX?
  decorators?: string[];
}

/** Full extraction result for a single file */
export interface FileAnalysis {
  file_path: string;       // Relative to project root
  language: 'typescript' | 'tsx';
  loc: number;
  imports: ExtractedImport[];
  exports: ExtractedExport[];
  symbols: ExtractedSymbol[];
}
