import type { NodeSingular } from 'cytoscape';
import type { RekkonGraph } from '@rekkon/core';

export type RekkonGraphNodeData = RekkonGraph['elements']['nodes'][number]['data'];
export type RekkonGraphEdgeData = RekkonGraph['elements']['edges'][number]['data'];

export interface SelectedNodePayload {
  id: string;
  data: RekkonGraphNodeData;
  node: NodeSingular;
}

export interface GraphCanvasApi {
  fit: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  relayout: () => void;
  clearSelection: () => void;
}

export interface LayerVisibilityOption {
  id: string;
  label: string;
  visible: boolean;
}
