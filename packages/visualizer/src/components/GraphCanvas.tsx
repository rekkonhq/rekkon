import { useCallback, useEffect, useRef, type CSSProperties } from 'react';
import type cytoscape from 'cytoscape';
import type { RekkonGraph } from '@rekkon/core';
import { useCytoscape } from '../hooks/useCytoscape.js';
import { useGraphData } from '../hooks/useGraphData.js';
import type { GraphCanvasApi, SelectedNodePayload } from '../types.js';

export interface GraphCanvasProps {
  graph: RekkonGraph;
  className?: string;
  darkMode?: boolean;
  showSymbols: boolean;
  hiddenLayerIds: ReadonlySet<string>;
  onNodeSelect?: (nodeId: string, nodeData: Record<string, unknown>) => void;
  onSelectionChange?: (selection: SelectedNodePayload | null) => void;
  onReady?: (api: GraphCanvasApi | null) => void;
}

export function GraphCanvas({
  graph,
  className,
  darkMode = true,
  showSymbols,
  hiddenLayerIds,
  onNodeSelect,
  onSelectionChange,
  onReady,
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { cy, cyRef, runLayout } = useCytoscape(containerRef, darkMode);
  useGraphData(cy, graph, runLayout, { showSymbols, hiddenLayerIds });

  const clearSelection = useCallback(() => {
    const instance = cyRef.current;
    if (!instance) {
      return;
    }
    clearFocus(instance);
    onSelectionChange?.(null);
  }, [cyRef, onSelectionChange]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    const handleNodeTap = (event: cytoscape.EventObjectNode) => {
      const node = event.target;
      const instance = node.cy();
      const neighborhood = node.closedNeighborhood();
      const neighborNodes = neighborhood.nodes().union(node);
      const neighborEdges = neighborhood.edges();

      instance.startBatch();
      clearFocus(instance);
      instance.nodes().difference(neighborNodes).addClass('dimmed');
      instance.edges().difference(neighborEdges).addClass('dimmed');
      neighborNodes.addClass('highlighted');
      neighborEdges.addClass('highlighted');
      node.select();
      instance.endBatch();

      const nodeData = node.data() as Record<string, unknown>;
      const payload: SelectedNodePayload = {
        id: node.id(),
        data: nodeData as SelectedNodePayload['data'],
        node,
      };

      onSelectionChange?.(payload);
      onNodeSelect?.(node.id(), nodeData);
    };

    const handleCanvasTap = (event: cytoscape.EventObject) => {
      if (event.target !== cy) {
        return;
      }
      clearSelection();
    };

    cy.on('tap', 'node', handleNodeTap);
    cy.on('tap', handleCanvasTap);

    return () => {
      cy.off('tap', 'node', handleNodeTap);
      cy.off('tap', handleCanvasTap);
    };
  }, [cy, clearSelection, onNodeSelect, onSelectionChange]);

  useEffect(() => {
    if (!onReady) {
      return;
    }
    if (!cy) {
      onReady(null);
      return;
    }

    const zoomBy = (factor: number) => {
      const nextLevel = clamp(cy.zoom() * factor, cy.minZoom(), cy.maxZoom());
      cy.zoom({
        level: nextLevel,
        renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 },
      });
    };

    const api: GraphCanvasApi = {
      fit: () => {
        cy.fit(undefined, 50);
      },
      zoomIn: () => {
        zoomBy(1.3);
      },
      zoomOut: () => {
        zoomBy(1 / 1.3);
      },
      relayout: () => {
        runLayout();
      },
      clearSelection,
    };

    onReady(api);
    return () => {
      onReady(null);
    };
  }, [clearSelection, cy, onReady, runLayout]);

  useEffect(() => {
    onSelectionChange?.(null);
  }, [graph, onSelectionChange]);

  const frameStyle: CSSProperties = {
    width: '100%',
    height: '100%',
    minHeight: 320,
    borderRadius: 14,
    border: `1px solid ${darkMode ? '#1e293b' : '#d3dce8'}`,
    overflow: 'hidden',
    background: darkMode ? '#050a16' : '#f8fafc',
  };

  const canvasStyle: CSSProperties = {
    width: '100%',
    height: '100%',
  };

  return (
    <div className={className} style={frameStyle}>
      <div ref={containerRef} style={canvasStyle} />
    </div>
  );
}

function clearFocus(cy: cytoscape.Core): void {
  cy.elements().removeClass('highlighted');
  cy.elements().removeClass('dimmed');
  cy.$(':selected').unselect();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
