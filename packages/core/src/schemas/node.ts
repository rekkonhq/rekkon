import { z } from 'zod';

// --- Enums ---

export const NodeType = z.enum(['layer', 'module', 'file', 'symbol']);
export type NodeType = z.infer<typeof NodeType>;

export const NodeSubtype = z.enum([
  // File subtypes
  'component',
  'page',
  'route',
  'hook',
  'utility',
  'config',
  'test',
  'style',
  'type-definition',
  // Symbol subtypes
  'function',
  'class',
  'interface',
  'type-alias',
  'variable',
  'enum',
  'constant',
]);
export type NodeSubtype = z.infer<typeof NodeSubtype>;

// --- Core Node Schema ---

export const NodeSchema = z.object({
  id: z.string(), // Deterministic hash-based ID
  type: NodeType,
  subtype: NodeSubtype.nullable().optional(),
  label: z.string(),

  // Hierarchy
  parent_id: z.string().nullable().optional(), // Compound node parent
  file_path: z.string().nullable().optional(), // Relative from project root

  // Core metrics
  loc: z.number().int().nullable().optional(),
  complexity: z.number().int().nullable().optional(),
  export_count: z.number().int().default(0),
  import_count: z.number().int().default(0),
  is_exported: z.boolean().default(false),

  // Extensible metadata (JSONB in DB)
  metadata: z.record(z.unknown()).default({}),

  // AI-generated (Tier 3, optional)
  ai_description: z.string().nullable().optional(),
  ai_summary: z.string().nullable().optional(),
  ai_tags: z.array(z.string()).nullable().optional(),
  ai_generated_at: z.string().datetime().nullable().optional(),
});

export type Node = z.infer<typeof NodeSchema>;

// --- Cytoscape Node Data ---
// What actually gets put into cytoscape.js elements

export const CytoscapeNodeSchema = z.object({
  data: NodeSchema.extend({
    parent: z.string().optional(), // Cytoscape uses 'parent' not 'parent_id'
  }),
});

export type CytoscapeNode = z.infer<typeof CytoscapeNodeSchema>;
