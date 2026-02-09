import type { CSSProperties } from 'react';
import type { LayerVisibilityOption } from '../types.js';

export interface GraphControlsProps {
  className?: string;
  darkMode?: boolean;
  layers: LayerVisibilityOption[];
  showSymbols: boolean;
  onToggleSymbols: () => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRelayout: () => void;
  onLayerVisibilityChange: (layerId: string, visible: boolean) => void;
}

export function GraphControls({
  className,
  darkMode = true,
  layers,
  showSymbols,
  onToggleSymbols,
  onFit,
  onZoomIn,
  onZoomOut,
  onRelayout,
  onLayerVisibilityChange,
}: GraphControlsProps) {
  const panelStyle: CSSProperties = {
    width: 260,
    borderRadius: 14,
    border: `1px solid ${darkMode ? '#1e293b' : '#cbd5e1'}`,
    background: darkMode ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.95)',
    color: darkMode ? '#e2e8f0' : '#0f172a',
    padding: 10,
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    boxShadow: darkMode
      ? '0 14px 32px rgba(2, 6, 23, 0.55)'
      : '0 14px 26px rgba(15, 23, 42, 0.15)',
  };

  const actionRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
  };

  const buttonStyle: CSSProperties = {
    borderRadius: 9,
    border: `1px solid ${darkMode ? '#334155' : '#cbd5e1'}`,
    background: darkMode ? '#111827' : '#f8fafc',
    color: 'inherit',
    padding: '7px 10px',
    fontSize: 12,
    cursor: 'pointer',
  };

  const listStyle: CSSProperties = {
    maxHeight: 190,
    overflowY: 'auto',
    border: `1px solid ${darkMode ? '#1e293b' : '#dbe3ef'}`,
    borderRadius: 10,
    padding: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  };

  return (
    <div className={className} style={panelStyle}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        Controls
      </div>

      <div style={actionRowStyle}>
        <button type="button" style={buttonStyle} onClick={onZoomIn}>
          Zoom In
        </button>
        <button type="button" style={buttonStyle} onClick={onZoomOut}>
          Zoom Out
        </button>
        <button type="button" style={buttonStyle} onClick={onFit}>
          Fit
        </button>
        <button type="button" style={buttonStyle} onClick={onRelayout}>
          Re-layout
        </button>
      </div>

      <button
        type="button"
        style={{
          ...buttonStyle,
          width: '100%',
          borderColor: showSymbols ? '#22c55e' : buttonStyle.borderColor,
        }}
        onClick={onToggleSymbols}
      >
        {showSymbols ? 'Hide Symbols' : 'Show Symbols'}
      </button>

      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
        Layers
      </div>
      <div style={listStyle}>
        {layers.map((layer) => (
          <label
            key={layer.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={(event) => onLayerVisibilityChange(layer.id, event.currentTarget.checked)}
            />
            <span>{layer.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
