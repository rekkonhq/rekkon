import { useEffect } from 'react';
import type { Core, NodeSingular } from 'cytoscape';
import { EDGE_STYLES, type RekkonGraph } from '@rekkon/core';
import { LAYER_COLORS, NODE_SHAPES, NODE_SIZES, getLayerColor } from '../styles/theme.js';

interface GraphDataOptions {
  showSymbols: boolean;
  hiddenLayerIds: ReadonlySet<string>;
}

export function useGraphData(
  cy: Core | null,
  graph: RekkonGraph | null,
  runLayout: () => void,
  options: GraphDataOptions,
): void {
  useEffect(() => {
    if (!cy || !graph) {
      return;
    }

    const nodesById = new Map(graph.elements.nodes.map((node) => [node.data.id, node.data]));

    cy.startBatch();
    cy.elements().remove();
    cy.add([...graph.elements.nodes, ...graph.elements.edges]);

    cy.nodes().forEach((node) => {
      const nodeData = nodesById.get(node.id());
      if (!nodeData) {
        return;
      }

      const type = node.data('type') as string | undefined;
      const subtype = node.data('subtype') as string | null | undefined;

      if (type) {
        node.addClass(type);
      }
      if (subtype) {
        node.addClass(subtype);
      }

      const layerLabel = getLayerLabel(nodeData.id, nodesById);
      const colors = getLayerColor(layerLabel);
      applyNodeStyle(node, type, subtype, colors, nodeData.loc);
    });

    cy.edges().forEach((edge) => {
      const edgeType = edge.data('type') as string | undefined;
      const weight = Number(edge.data('weight') ?? 1);
      const edgeStyle = edgeType ? EDGE_STYLES[edgeType] : undefined;
      edge.style({
        width: Math.max(1, Math.min(4, 1 + weight * 0.45)),
        'line-color': edgeStyle?.color ?? '#64748b',
        'target-arrow-color': edgeStyle?.color ?? '#64748b',
        'line-style': edgeStyle?.dashed ? 'dashed' : 'solid',
      });
    });

    applyVisibility(cy, options.showSymbols, options.hiddenLayerIds);
    cy.endBatch();

    runLayout();
  }, [cy, graph, runLayout]);

  useEffect(() => {
    if (!cy || !graph) {
      return;
    }

    cy.startBatch();
    applyVisibility(cy, options.showSymbols, options.hiddenLayerIds);
    cy.endBatch();
    runLayout();
  }, [cy, graph, options.showSymbols, options.hiddenLayerIds, runLayout]);
}

function getLayerLabel(
  nodeId: string,
  nodesById: Map<
    string,
    {
      type: string;
      label: string;
      parent?: string | undefined;
      parent_id?: string | null | undefined;
    }
  >,
): string {
  let current = nodesById.get(nodeId);
  let guard = 0;

  while (current && guard < 8) {
    if (current.type === 'layer') {
      return current.label;
    }
    const parentId = current.parent ?? current.parent_id ?? undefined;
    if (!parentId) {
      break;
    }
    current = nodesById.get(parentId);
    guard += 1;
  }

  return 'Other';
}

function applyNodeStyle(
  node: NodeSingular,
  type: string | undefined,
  subtype: string | null | undefined,
  colors: { bg: string; border: string; text: string },
  loc: number | null | undefined,
): void {
  if (!type) {
    return;
  }

  const size = NODE_SIZES[type] ?? NODE_SIZES.file;
  const shape =
    type === 'layer' || type === 'module'
      ? 'round-rectangle'
      : NODE_SHAPES[subtype ?? 'default'] ?? NODE_SHAPES.default;

  const numericLoc = Number(loc ?? 0);
  const fileScale =
    type === 'file' ? Math.max(30, Math.min(64, 30 + Math.round(Math.sqrt(Math.max(numericLoc, 1)) * 2))) : 0;
  const width = type === 'file' ? fileScale : size.width;
  const height = type === 'file' ? fileScale : size.height;

  const bgColor = type === 'layer' ? colors.bg : type === 'module' ? colors.bg : colors.border;
  const textColor = type === 'layer' || type === 'module' ? colors.text : '#f8fafc';
  const backgroundOpacity = type === 'symbol' ? 0.85 : 1;

  node.style({
    shape,
    width,
    height,
    'background-color': bgColor,
    'background-opacity': backgroundOpacity,
    'border-color': colors.border,
    color: textColor,
  });
}

function applyVisibility(cy: Core, showSymbols: boolean, hiddenLayerIds: ReadonlySet<string>): void {
  cy.nodes().style('display', 'element');
  cy.edges().style('display', 'element');

  if (!showSymbols) {
    const symbolNodes = cy.nodes('[type="symbol"]');
    symbolNodes.style('display', 'none');
  }

  hiddenLayerIds.forEach((layerId) => {
    hideLayer(cy, layerId);
  });

  cy.edges().forEach((edge) => {
    const sourceVisible = edge.source().style('display') !== 'none';
    const targetVisible = edge.target().style('display') !== 'none';
    edge.style('display', sourceVisible && targetVisible ? 'element' : 'none');
  });
}

function hideLayer(cy: Core, layerId: string): void {
  const layer = cy.getElementById(layerId);
  if (layer.empty() || !layer.isNode()) {
    return;
  }

  const nodesToHide = layer.union(layer.descendants());
  nodesToHide.style('display', 'none');
  nodesToHide.connectedEdges().style('display', 'none');
}

export function getAvailableLayers(graph: RekkonGraph): Array<{ id: string; label: string }> {
  const snapshotLayers = graph.snapshot.layer_summary.map((layer) => ({
    id: layer.id,
    label: layer.label,
  }));
  if (snapshotLayers.length > 0) {
    return snapshotLayers.sort((a, b) => a.label.localeCompare(b.label));
  }

  const layers = graph.elements.nodes
    .filter((node) => node.data.type === 'layer')
    .map((node) => ({ id: node.data.id, label: node.data.label }));

  return layers.sort((a, b) => a.label.localeCompare(b.label));
}

export function getLayerPalette(labels: string[]): Record<string, { bg: string; border: string; text: string }> {
  return labels.reduce<Record<string, { bg: string; border: string; text: string }>>((acc, label) => {
    acc[label] = LAYER_COLORS[label] ?? LAYER_COLORS.Other;
    return acc;
  }, {});
}
