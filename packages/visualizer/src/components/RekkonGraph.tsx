import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { RekkonGraph as RekkonGraphType } from '@rekkon/core';
import { GraphCanvas } from './GraphCanvas.js';
import { GraphControls } from './GraphControls.js';
import { GraphSummary } from './GraphSummary.js';
import { NodeDetail } from './NodeDetail.js';
import { getAvailableLayers } from '../hooks/useGraphData.js';
import type { GraphCanvasApi, SelectedNodePayload } from '../types.js';

export interface RekkonGraphProps {
  graph: RekkonGraphType;
  height?: string;
  width?: string;
  darkMode?: boolean;
  className?: string;
  onNodeSelect?: (nodeId: string, nodeData: Record<string, unknown>) => void;
  showSymbols?: boolean;
}

export function RekkonGraph({
  graph,
  height = '100vh',
  width = '100%',
  darkMode = true,
  className,
  onNodeSelect,
  showSymbols = false,
}: RekkonGraphProps) {
  const [selectedNode, setSelectedNode] = useState<SelectedNodePayload | null>(null);
  const [canvasApi, setCanvasApi] = useState<GraphCanvasApi | null>(null);
  const [symbolsVisible, setSymbolsVisible] = useState(showSymbols);
  const [hiddenLayerIds, setHiddenLayerIds] = useState<Set<string>>(new Set());

  const layers = useMemo(() => getAvailableLayers(graph), [graph]);
  const layerOptions = useMemo(
    () =>
      layers.map((layer) => ({
        id: layer.id,
        label: layer.label,
        visible: !hiddenLayerIds.has(layer.id),
      })),
    [hiddenLayerIds, layers],
  );

  useEffect(() => {
    setSymbolsVisible(showSymbols);
  }, [showSymbols]);

  useEffect(() => {
    setHiddenLayerIds(new Set());
    setSelectedNode(null);
  }, [graph]);

  const handleToggleSymbols = useCallback(() => {
    setSymbolsVisible((prev) => !prev);
  }, []);

  const handleLayerVisibilityChange = useCallback(
    (layerId: string, visible: boolean) => {
      setHiddenLayerIds((current) => {
        const next = new Set(current);
        if (visible) {
          next.delete(layerId);
        } else {
          next.add(layerId);
        }
        return next;
      });
      setSelectedNode(null);
      canvasApi?.clearSelection();
    },
    [canvasApi],
  );

  const rootStyle: CSSProperties = {
    width,
    height,
    minHeight: 420,
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr)',
    gap: 10,
    background: darkMode
      ? 'radial-gradient(140% 100% at 10% 0%, #172554 0%, #0f172a 46%, #020617 100%)'
      : 'linear-gradient(160deg, #eff6ff 0%, #f8fafc 48%, #eef2ff 100%)',
    border: `1px solid ${darkMode ? '#1e293b' : '#d1d9e4'}`,
    borderRadius: 16,
    padding: 10,
    boxSizing: 'border-box',
    position: 'relative',
  };

  const stageStyle: CSSProperties = {
    minHeight: 0,
    position: 'relative',
  };

  return (
    <div className={className} style={rootStyle}>
      <GraphSummary graph={graph} darkMode={darkMode} />

      <div style={stageStyle}>
        <GraphCanvas
          graph={graph}
          darkMode={darkMode}
          showSymbols={symbolsVisible}
          hiddenLayerIds={hiddenLayerIds}
          onNodeSelect={onNodeSelect}
          onSelectionChange={setSelectedNode}
          onReady={setCanvasApi}
        />

        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 5,
          }}
        >
          <GraphControls
            darkMode={darkMode}
            layers={layerOptions}
            showSymbols={symbolsVisible}
            onToggleSymbols={handleToggleSymbols}
            onFit={() => canvasApi?.fit()}
            onZoomIn={() => canvasApi?.zoomIn()}
            onZoomOut={() => canvasApi?.zoomOut()}
            onRelayout={() => canvasApi?.relayout()}
            onLayerVisibilityChange={handleLayerVisibilityChange}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            zIndex: 6,
            maxWidth: '100%',
          }}
        >
          <NodeDetail
            darkMode={darkMode}
            selectedNode={selectedNode}
            onClose={() => {
              setSelectedNode(null);
              canvasApi?.clearSelection();
            }}
          />
        </div>
      </div>
    </div>
  );
}
