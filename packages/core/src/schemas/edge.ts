import { z } from 'zod';

export const EdgeType = z.enum([
  'imports', // File imports another file
  'calls', // Symbol calls another symbol
  'exports', // Module exports to layer
  'renders', // Component renders another component
  'extends', // Class extends another class
  'implements', // Class implements interface
  'type_depends', // Type depends on another type
]);
export type EdgeType = z.infer<typeof EdgeType>;

export const EdgeSchema = z.object({
  id: z.string(),
  source_id: z.string(),
  target_id: z.string(),
  type: EdgeType,
  weight: z.number().default(1.0),
  metadata: z.record(z.unknown()).default({}),
});

export type Edge = z.infer<typeof EdgeSchema>;

export const CytoscapeEdgeSchema = z.object({
  data: z.object({
    id: z.string(),
    source: z.string(), // Cytoscape uses 'source' not 'source_id'
    target: z.string(), // Cytoscape uses 'target' not 'target_id'
    type: EdgeType,
    weight: z.number().default(1.0),
    metadata: z.record(z.unknown()).default({}),
  }),
});

export type CytoscapeEdge = z.infer<typeof CytoscapeEdgeSchema>;
