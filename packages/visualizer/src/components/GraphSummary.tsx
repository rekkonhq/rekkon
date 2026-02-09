import type { CSSProperties } from 'react';
import type { RekkonGraph } from '@rekkon/core';

export interface GraphSummaryProps {
  graph: RekkonGraph;
  className?: string;
  darkMode?: boolean;
}

export function GraphSummary({ graph, className, darkMode = true }: GraphSummaryProps) {
  const cardStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 14px',
    border: `1px solid ${darkMode ? '#1e293b' : '#cbd5e1'}`,
    background: darkMode ? 'rgba(15, 23, 42, 0.9)' : 'rgba(248, 250, 252, 0.95)',
    color: darkMode ? '#e2e8f0' : '#0f172a',
    borderRadius: 12,
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    fontSize: 13,
    flexWrap: 'wrap',
  };

  const metricsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  };

  const badgeStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    borderRadius: 999,
    border: `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`,
    background: darkMode ? '#0f172a' : '#ffffff',
    fontSize: 12,
    lineHeight: 1.1,
  };

  return (
    <div className={className} style={cardStyle}>
      <div style={{ fontWeight: 700, letterSpacing: '0.02em' }}>Architecture Overview</div>

      <div style={metricsStyle}>
        <span style={badgeStyle}>{graph.snapshot.total_files} files</span>
        <span style={badgeStyle}>{graph.snapshot.total_symbols} symbols</span>
        <span style={badgeStyle}>{graph.snapshot.total_edges} edges</span>
        <span style={badgeStyle}>{graph.snapshot.total_loc} LOC</span>
        <span style={badgeStyle}>{graph.snapshot.layer_summary.length} layers</span>
        <span style={badgeStyle}>{formatDuration(graph.snapshot.analysis_duration_ms)} analysis</span>
      </div>
    </div>
  );
}

function formatDuration(durationMs?: number): string {
  if (!durationMs || durationMs < 1) {
    return '<1ms';
  }
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }
  return `${(durationMs / 1000).toFixed(2)}s`;
}
