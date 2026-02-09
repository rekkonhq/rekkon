import { useMemo, type CSSProperties } from 'react';
import type { SelectedNodePayload } from '../types.js';

export interface NodeDetailProps {
  className?: string;
  darkMode?: boolean;
  selectedNode: SelectedNodePayload | null;
  onClose: () => void;
}

export function NodeDetail({ className, darkMode = true, selectedNode, onClose }: NodeDetailProps) {
  const data = selectedNode?.data;
  const connections = useMemo(() => {
    if (!selectedNode) {
      return { outgoing: [] as string[], incoming: [] as string[] };
    }

    const outgoing: string[] = [];
    const incoming: string[] = [];

    selectedNode.node.connectedEdges().forEach((edge) => {
      const edgeType = String(edge.data('type') ?? 'edge');
      const source = edge.source();
      const target = edge.target();
      const sourceLabel = String(source.data('label') ?? source.id());
      const targetLabel = String(target.data('label') ?? target.id());
      if (source.id() === selectedNode.id) {
        outgoing.push(`${targetLabel} (${edgeType})`);
      } else if (target.id() === selectedNode.id) {
        incoming.push(`${sourceLabel} (${edgeType})`);
      }
    });

    return {
      outgoing: unique(outgoing).sort((a, b) => a.localeCompare(b)),
      incoming: unique(incoming).sort((a, b) => a.localeCompare(b)),
    };
  }, [selectedNode]);

  const metadata = useMemo(() => {
    if (!data) {
      return [];
    }
    const value = data.metadata;
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return [];
    }
    return Object.entries(value as Record<string, unknown>);
  }, [data]);

  const panelStyle: CSSProperties = {
    width: 330,
    maxWidth: '42vw',
    height: '100%',
    borderLeft: `1px solid ${darkMode ? '#1e293b' : '#d1d9e4'}`,
    background: darkMode ? '#0f172a' : '#ffffff',
    color: darkMode ? '#e2e8f0' : '#0f172a',
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    display: 'flex',
    flexDirection: 'column',
    transform: selectedNode ? 'translateX(0)' : 'translateX(100%)',
    opacity: selectedNode ? 1 : 0,
    transition: 'transform 180ms ease, opacity 160ms ease',
    pointerEvents: selectedNode ? 'auto' : 'none',
    boxShadow: darkMode
      ? '-16px 0 36px rgba(2, 6, 23, 0.45)'
      : '-12px 0 24px rgba(15, 23, 42, 0.12)',
  };

  const sectionTitleStyle: CSSProperties = {
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontWeight: 700,
    opacity: 0.75,
    marginBottom: 8,
  };

  return (
    <aside className={className} style={panelStyle}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 8,
          padding: 14,
          borderBottom: `1px solid ${darkMode ? '#1e293b' : '#dbe2ef'}`,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2, wordBreak: 'break-word' }}>
            {data?.label ?? 'No selection'}
          </div>
          <div style={{ marginTop: 3, fontSize: 12, opacity: 0.75 }}>
            {data?.subtype ? `${data.subtype} • ` : ''}
            {data?.type ?? ''}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: `1px solid ${darkMode ? '#334155' : '#d1d9e4'}`,
            background: darkMode ? '#111827' : '#f8fafc',
            color: 'inherit',
            borderRadius: 8,
            padding: '5px 9px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </header>

      <div style={{ padding: 14, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <section>
          <div style={sectionTitleStyle}>Stats</div>
          <DataRow label="Path" value={data?.file_path ?? 'n/a'} />
          <DataRow label="LOC" value={formatNumber(data?.loc)} />
          <DataRow label="Complexity" value={formatNumber(data?.complexity)} />
          <DataRow label="Exports" value={formatNumber(data?.export_count)} />
          <DataRow label="Imports" value={formatNumber(data?.import_count)} />
          <DataRow label="Exported" value={data?.is_exported ? 'true' : 'false'} />
        </section>

        <section>
          <div style={sectionTitleStyle}>Connections</div>
          <ConnectionList title="<- Imported by" values={connections.incoming} />
          <ConnectionList title="-> Imports" values={connections.outgoing} />
        </section>

        {metadata.length > 0 ? (
          <section>
            <div style={sectionTitleStyle}>Metadata</div>
            {metadata.map(([key, value]) => (
              <DataRow key={key} label={key} value={formatValue(value)} />
            ))}
          </section>
        ) : null}
      </div>
    </aside>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '94px minmax(0, 1fr)',
        gap: 8,
        fontSize: 12,
        marginBottom: 6,
      }}
    >
      <span style={{ opacity: 0.65 }}>{label}</span>
      <span style={{ wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

function ConnectionList({ title, values }: { title: string; values: string[] }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 12, marginBottom: 5, opacity: 0.78 }}>{title}</div>
      {values.length === 0 ? (
        <div style={{ fontSize: 12, opacity: 0.55 }}>None</div>
      ) : (
        values.slice(0, 14).map((value) => (
          <div key={value} style={{ fontSize: 12, lineHeight: 1.45 }}>
            {value}
          </div>
        ))
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return 'n/a';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join(', ');
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return String(value);
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return 'n/a';
  }
  return `${value}`;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}
