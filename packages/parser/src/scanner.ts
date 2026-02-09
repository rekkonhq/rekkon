import { glob } from 'glob';
import { relative, resolve } from 'node:path';

const DEFAULT_IGNORE_PATHS = [
  'node_modules',
  'dist',
  '.git',
  '.next',
  'coverage',
  '__pycache__',
  '.turbo',
  'build',
];

const SOURCE_PATTERNS = ['**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs,css,scss}', '**/*.d.ts'];

export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
}

export async function scanFiles(rootDir: string, ignorePaths: string[] = []): Promise<ScannedFile[]> {
  const absoluteRoot = resolve(rootDir);
  const ignore = buildIgnorePatterns([...DEFAULT_IGNORE_PATHS, ...ignorePaths]);
  const matches = await glob(SOURCE_PATTERNS, {
    cwd: absoluteRoot,
    absolute: true,
    nodir: true,
    windowsPathsNoEscape: true,
    ignore,
  });

  const filesByPath = new Map<string, ScannedFile>();
  for (const absolutePath of matches) {
    const relativePath = normalizePath(relative(absoluteRoot, absolutePath));
    filesByPath.set(relativePath, {
      absolutePath: resolve(absolutePath),
      relativePath,
    });
  }

  return [...filesByPath.values()].sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}

function buildIgnorePatterns(ignorePaths: string[]): string[] {
  const patterns = new Set<string>();

  for (const rawPath of ignorePaths) {
    const cleaned = normalizeIgnorePath(rawPath);
    if (!cleaned) {
      continue;
    }

    if (hasGlobMagic(cleaned)) {
      patterns.add(cleaned);
      continue;
    }

    patterns.add(cleaned);
    patterns.add(`${cleaned}/**`);
    patterns.add(`**/${cleaned}`);
    patterns.add(`**/${cleaned}/**`);
  }

  return [...patterns];
}

function hasGlobMagic(input: string): boolean {
  return /[*?[\]{}()]/.test(input);
}

function normalizeIgnorePath(value: string): string {
  return normalizePath(value).replace(/^\.\/+/, '').replace(/\/+$/, '');
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}
