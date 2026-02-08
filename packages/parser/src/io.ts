import { readdirSync, statSync } from 'node:fs';
import { resolve, relative } from 'node:path';

const DEFAULT_IGNORES = new Set([
  'node_modules',
  '.next',
  '.nuxt',
  'dist',
  'build',
  '.git',
  'coverage',
  '.turbo',
  '.vercel',
  '.cache',
]);

export function discoverTypeScriptFiles(rootDir: string, ignorePaths: string[] = []): string[] {
  const files: string[] = [];
  const normalizedIgnores = new Set(ignorePaths.map(normalizePath));

  const walk = (currentDir: string): void => {
    const entries = readdirSync(currentDir);

    for (const entry of entries) {
      if (entry.startsWith('.')) {
        continue;
      }
      if (DEFAULT_IGNORES.has(entry)) {
        continue;
      }

      const fullPath = resolve(currentDir, entry);
      const relPath = normalizePath(relative(rootDir, fullPath));

      if (normalizedIgnores.has(relPath) || normalizedIgnores.has(entry)) {
        continue;
      }

      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!stat.isFile()) {
        continue;
      }

      if (!entry.endsWith('.ts') && !entry.endsWith('.tsx')) {
        continue;
      }
      if (entry.endsWith('.d.ts')) {
        continue;
      }

      files.push(fullPath);
    }
  };

  walk(rootDir);
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '').replace(/\/+$/, '');
}
