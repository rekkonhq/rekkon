import { posix } from 'node:path';

export function getModulePath(relativeFilePath: string, moduleDepth: number): string {
  const normalizedPath = normalizePath(relativeFilePath);
  const directory = normalizePath(posix.dirname(normalizedPath));
  if (!directory || directory === '.') {
    return '';
  }

  const segments = toModuleSegments(directory);
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

function toModuleSegments(directoryPath: string): string[] {
  const segments = directoryPath.split('/').filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return [];
  }

  // Monorepo-friendly grouping:
  // packages/<pkg>/src/<feature>/file.ts => <pkg>/<feature>
  if (segments.length >= 2 && segments[0] === 'packages') {
    if (segments[2] === 'src') {
      return [segments[1], ...segments.slice(3)];
    }

    return [segments[1], ...segments.slice(2)];
  }

  return segments;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+$/, '');
}
