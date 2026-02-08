export const EDGE_TYPE_LABELS: Record<string, string> = {
  imports: 'Imports',
  calls: 'Calls',
  exports: 'Exports',
  renders: 'Renders',
  extends: 'Extends',
  implements: 'Implements',
  type_depends: 'Type Depends',
};

// Edge styling hints for visualizer
export const EDGE_STYLES: Record<string, { color: string; dashed: boolean }> = {
  imports: { color: '#64748b', dashed: false },
  calls: { color: '#3b82f6', dashed: false },
  exports: { color: '#22c55e', dashed: false },
  renders: { color: '#a855f7', dashed: false },
  extends: { color: '#f59e0b', dashed: true },
  implements: { color: '#f59e0b', dashed: true },
  type_depends: { color: '#6b7280', dashed: true },
};
