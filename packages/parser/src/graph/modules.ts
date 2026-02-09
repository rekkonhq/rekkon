import { posix } from 'node:path';

export function getModulePath(relativeFilePath: string, moduleDepth: number): string {
  const normalizedPath = normalizePath(relativeFilePath);
  const directory = normalizePath(posix.dirname(normalizedPath));
  if (!directory || directory === '.') {
    return '';
  }

  const segments = directory.split('/').filter((segment) => segment.length > 0);
  const depth = sanitizeDepth(moduleDepth);
  if (depth === 0) {
    return '';
  }

  return segments.slice(0, depth).join('/');
}

export function getModuleLabel(modulePath: string): string {
  const normalized = normalizePath(modulePath);
  if (!normalized) {
    return '(root)';
  }

  const segments = normalized.split('/').filter((segment) => segment.length > 0);
  return segments.slice(-2).join('/') || normalized;
}

function sanitizeDepth(moduleDepth: number): number {
  if (!Number.isFinite(moduleDepth)) {
    return 2;
  }

  return Math.max(0, Math.floor(moduleDepth));
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+$/, '');
}
