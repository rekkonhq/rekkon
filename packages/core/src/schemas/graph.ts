import { z } from 'zod';
import { CytoscapeNodeSchema } from './node.js';
import { CytoscapeEdgeSchema } from './edge.js';
import { SnapshotSchema } from './snapshot.js';

export const RekkonGraphSchema = z.object({
  // Metadata about this analysis
  version: z.string().default('1.0.0'),
  generated_at: z.string().datetime(),
  analyzer_version: z.string(),

  // Snapshot summary (same shape as DB snapshot minus graph_json)
  snapshot: SnapshotSchema,

  // The graph itself — Cytoscape.js compatible
  elements: z.object({
    nodes: z.array(CytoscapeNodeSchema),
    edges: z.array(CytoscapeEdgeSchema),
  }),
});

export type RekkonGraph = z.infer<typeof RekkonGraphSchema>;
