import type cytoscape from 'cytoscape';

export const LAYER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  API: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  Pages: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  UI: { bg: '#2d1b4e', border: '#8b5cf6', text: '#c4b5fd' },
  Hooks: { bg: '#1b2e4a', border: '#06b6d4', text: '#67e8f9' },
  Core: { bg: '#1a3329', border: '#22c55e', text: '#86efac' },
  Services: { bg: '#2a1f0f', border: '#f59e0b', text: '#fcd34d' },
  State: { bg: '#2d1b4e', border: '#a855f7', text: '#d8b4fe' },
  Data: { bg: '#1a2332', border: '#6366f1', text: '#a5b4fc' },
  Config: { bg: '#1f1f1f', border: '#6b7280', text: '#9ca3af' },
  Types: { bg: '#1f2937', border: '#6b7280', text: '#9ca3af' },
  Tests: { bg: '#1c1917', border: '#78716c', text: '#a8a29e' },
  Middleware: { bg: '#2a1f0f', border: '#f59e0b', text: '#fcd34d' },
  Styles: { bg: '#2d1b33', border: '#ec4899', text: '#f9a8d4' },
  Assets: { bg: '#1f2937', border: '#6b7280', text: '#9ca3af' },
  Other: { bg: '#1f2937', border: '#6b7280', text: '#9ca3af' },
};

export const NODE_SIZES: Record<string, { width: number; height: number }> = {
  symbol: { width: 20, height: 20 },
  file: { width: 40, height: 40 },
  module: { width: 60, height: 60 },
  layer: { width: 80, height: 80 },
};

export const NODE_SHAPES: Record<string, string> = {
  component: 'round-rectangle',
  page: 'round-rectangle',
  hook: 'diamond',
  function: 'ellipse',
  class: 'hexagon',
  interface: 'pentagon',
  'type-alias': 'pentagon',
  constant: 'round-rectangle',
  variable: 'round-rectangle',
  utility: 'round-rectangle',
  config: 'round-rectangle',
  route: 'tag',
  test: 'round-rectangle',
  style: 'round-rectangle',
  enum: 'octagon',
  'type-definition': 'pentagon',
  default: 'ellipse',
};

export function getLayerColor(label: string | null | undefined): {
  bg: string;
  border: string;
  text: string;
} {
  if (!label) {
    return LAYER_COLORS.Other;
  }
  return LAYER_COLORS[label] ?? LAYER_COLORS.Other;
}

export function getCytoscapeStyles(darkMode = true): cytoscape.StylesheetStyle[] {
  const palette = darkMode
    ? {
        text: '#e2e8f0',
        textOutline: '#0f172a',
        nodeBg: '#334155',
        nodeBorder: '#475569',
        edge: '#475569',
      }
    : {
        text: '#0f172a',
        textOutline: '#f8fafc',
        nodeBg: '#cbd5e1',
        nodeBorder: '#94a3b8',
        edge: '#64748b',
      };

  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        'text-valign': 'center',
        'text-halign': 'center',
        'font-size': '10px',
        'font-family': '"IBM Plex Sans", "Segoe UI", sans-serif',
        color: palette.text,
        'text-outline-color': palette.textOutline,
        'text-outline-width': 1,
        'background-color': palette.nodeBg,
        'border-width': 1,
        'border-color': palette.nodeBorder,
      },
    },
    {
      selector: 'node[type="layer"]',
      style: {
        shape: 'round-rectangle',
        'background-opacity': 0.15,
        'border-width': 2,
        'border-opacity': 0.7,
        'text-valign': 'top',
        'text-halign': 'center',
        'font-size': '14px',
        'font-weight': 'bold',
        padding: '22px',
        'text-margin-y': 10,
      },
    },
    {
      selector: 'node[type="module"]',
      style: {
        shape: 'round-rectangle',
        'background-opacity': 0.1,
        'border-width': 1.5,
        'border-opacity': 0.5,
        'text-valign': 'top',
        'text-halign': 'center',
        'font-size': '11px',
        'font-weight': 600,
        padding: '16px',
        'text-margin-y': 8,
      },
    },
    {
      selector: 'node[type="file"]',
      style: {
        width: 35,
        height: 35,
        'font-size': '8px',
        'text-max-width': '92px',
        'text-wrap': 'ellipsis',
      },
    },
    {
      selector: 'node[type="symbol"]',
      style: {
        width: 18,
        height: 18,
        'font-size': '7px',
        'background-opacity': 0.85,
        'text-max-width': '64px',
        'text-wrap': 'ellipsis',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.5,
        'line-color': palette.edge,
        'target-arrow-color': palette.edge,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        'arrow-scale': 0.8,
        opacity: 0.65,
      },
    },
    {
      selector: 'edge[type="imports"]',
      style: {
        'line-color': '#64748b',
        'target-arrow-color': '#64748b',
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 3,
        'border-color': '#38bdf8',
        'background-opacity': 0.32,
        'overlay-color': '#38bdf8',
        'overlay-opacity': 0.1,
      },
    },
    {
      selector: 'node:active',
      style: {
        'overlay-color': '#38bdf8',
        'overlay-opacity': 0.08,
      },
    },
    {
      selector: 'node.highlighted',
      style: {
        'border-width': 2,
        'border-color': '#fbbf24',
        'background-opacity': 0.26,
      },
    },
    {
      selector: 'node.dimmed',
      style: {
        opacity: 0.2,
      },
    },
    {
      selector: 'edge.dimmed',
      style: {
        opacity: 0.06,
      },
    },
    {
      selector: 'edge.highlighted',
      style: {
        opacity: 1,
        width: 2.5,
      },
    },
    {
      selector: ':parent',
      style: {
        'background-clip': 'none',
      },
    },
  ];
}
