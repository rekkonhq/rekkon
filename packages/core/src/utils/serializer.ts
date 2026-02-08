import type { RekkonGraph } from '../schemas/graph.js';
import type { CytoscapeNode } from '../schemas/node.js';

/**
 * Serialize a RekkonGraph to Cytoscape.js-compatible JSON.
 *
 * IMPORTANT: Nodes must be sorted children-first, parents-last.
 * This is a workaround for a known Cytoscape.js bug where parent nodes
 * appearing before children in the array causes layout fitting issues.
 */
export function serializeGraph(graph: RekkonGraph): object {
  const sorted = sortNodesChildrenFirst(graph.elements.nodes);
  return {
    ...graph,
    elements: {
      nodes: sorted,
      edges: graph.elements.edges,
    },
  };
}

/**
 * Sort nodes so children appear before their parents in the array.
 * Leaf nodes (no children) come first, then modules, then layers.
 */
function sortNodesChildrenFirst(nodes: CytoscapeNode[]): CytoscapeNode[] {
  const typeOrder: Record<string, number> = {
    symbol: 0,
    file: 1,
    module: 2,
    layer: 3,
  };

  return [...nodes].sort((a, b) => {
    const orderA = typeOrder[a.data.type] ?? 99;
    const orderB = typeOrder[b.data.type] ?? 99;
    return orderA - orderB;
  });
}
