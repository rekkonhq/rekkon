import { posix } from 'node:path';

const EXTENSION_REWRITES: Record<string, string[]> = {
  '.ts': ['.ts', '.tsx', '.d.ts'],
  '.tsx': ['.tsx', '.ts'],
  '.mts': ['.mts', '.ts'],
  '.cts': ['.cts', '.ts'],
  '.js': ['.ts', '.tsx', '.jsx', '.js', '.mts', '.cts', '.mjs', '.cjs', '.d.ts'],
  '.jsx': ['.tsx', '.jsx', '.js', '.ts'],
  '.mjs': ['.mts', '.mjs', '.js', '.ts'],
  '.cjs': ['.cts', '.cjs', '.js', '.ts'],
  '.d.ts': ['.d.ts', '.ts'],
  '.css': ['.css'],
  '.scss': ['.scss'],
};

const DEFAULT_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mts',
  '.cts',
  '.mjs',
  '.cjs',
  '.d.ts',
  '.css',
  '.scss',
];

export function isLocalImportSource(source: string): boolean {
  return source.startsWith('.') || source.startsWith('/');
}

export function resolveRelativeImportPath(
  fromFilePath: string,
  importSource: string,
  knownFiles: Set<string>,
): string | null {
  const source = stripImportSuffix(importSource);
  if (!source) {
    return null;
  }

  const fromDir = normalizePath(posix.dirname(normalizePath(fromFilePath)));
  const basePath = source.startsWith('/')
    ? normalizePath(source.slice(1))
    : normalizePath(posix.normalize(posix.join(fromDir === '.' ? '' : fromDir, source)));

  if (!basePath || basePath.startsWith('../')) {
    return null;
  }

  const candidates = buildCandidates(basePath);
  for (const candidate of candidates) {
    if (knownFiles.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function buildCandidates(basePath: string): string[] {
  const candidates = new Set<string>();
  const extensionToken = getExtensionToken(basePath);

  const addCandidate = (value: string): void => {
    const normalized = normalizePath(value);
    if (!normalized || normalized === '.') {
      return;
    }
    candidates.add(normalized);
  };

  if (extensionToken) {
    const withoutExtension = stripExtension(basePath, extensionToken);
    const rewrites = EXTENSION_REWRITES[extensionToken] ?? [extensionToken];
    for (const extension of rewrites) {
      addCandidate(`${withoutExtension}${extension}`);
    }
  } else {
    addCandidate(basePath);
    for (const extension of DEFAULT_EXTENSIONS) {
      addCandidate(`${basePath}${extension}`);
    }
    for (const extension of DEFAULT_EXTENSIONS) {
      addCandidate(`${basePath}/index${extension}`);
    }
  }

  return [...candidates];
}

function getExtensionToken(filePath: string): string {
  const normalized = filePath.toLowerCase();
  if (normalized.endsWith('.d.ts')) {
    return '.d.ts';
  }
  return posix.extname(normalized);
}

function stripExtension(filePath: string, extensionToken: string): string {
  if (!extensionToken) {
    return filePath;
  }
  if (extensionToken === '.d.ts') {
    return filePath.slice(0, -5);
  }
  return filePath.slice(0, -extensionToken.length);
}

function stripImportSuffix(importSource: string): string {
  return importSource.split('#')[0].split('?')[0];
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+$/, '');
}
