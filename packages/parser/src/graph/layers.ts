import { DEFAULT_LAYER_RULES, DEFAULT_LAYER_RULES_MULTI } from '@rekkon/core';

export function classifyFileToLayer(relativePath: string): string {
  const normalizedPath = normalizePath(relativePath).toLowerCase();
  const parts = normalizedPath.split('/').filter((segment) => segment.length > 0);
  const filename = parts.pop() ?? '';
  const dirParts = parts;

  // 1. Multi-segment directory rules (most specific: longest match first).
  const multiLayer = classifyByMultiSegmentRules(dirParts);
  if (multiLayer) {
    return multiLayer;
  }

  // 2. Single-segment directory rules (deepest path segment wins).
  for (let index = dirParts.length - 1; index >= 0; index -= 1) {
    const mappedLayer = DEFAULT_LAYER_RULES[dirParts[index]];
    if (mappedLayer) {
      return mappedLayer;
    }
  }

  // 3. Filename fallbacks for convention-heavy projects.
  const fallbackLayer = classifyByFilename(filename);
  if (fallbackLayer) {
    return fallbackLayer;
  }

  return 'Other';
}

function classifyByMultiSegmentRules(dirParts: string[]): string | null {
  for (let length = Math.min(dirParts.length, 3); length >= 2; length -= 1) {
    for (let start = 0; start <= dirParts.length - length; start += 1) {
      const candidate = dirParts.slice(start, start + length).join('/');
      const mappedLayer = DEFAULT_LAYER_RULES_MULTI[candidate];
      if (mappedLayer) {
        return mappedLayer;
      }
    }
  }

  return null;
}

function classifyByFilename(filename: string): string | null {
  const fname = filename.toLowerCase();

  // Hooks
  if (fname.startsWith('use') && /\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'Hooks';
  }

  // Tests
  if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'Tests';
  }
  if (/\.stories\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'Tests';
  }

  // Styles
  if (/\.(module\.css|css|scss|sass|less)$/.test(fname)) {
    return 'Styles';
  }

  // Types
  if (fname.endsWith('.d.ts')) {
    return 'Types';
  }
  if (/\.dto\.(ts|js)$/.test(fname)) {
    return 'Types';
  }

  // Config
  if (/\.config\.(ts|js|mjs|cjs)$/.test(fname)) {
    return 'Config';
  }
  if (/^(tsconfig|turbo|jest|vitest|playwright|webpack|rollup|babel|eslint|prettier|stylelint|commitlint|lint-staged)\b/.test(fname)) {
    return 'Config';
  }
  if (/^(tailwind|postcss|next|vite|nuxt|astro|svelte)\.config\b/.test(fname)) {
    return 'Config';
  }
  if (fname === '.env' || fname.startsWith('.env.')) {
    return 'Config';
  }

  // Next.js / App Router conventions
  if (/^page\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'Pages';
  }
  if (/^(layout|template|loading|error|not-found|global-error)\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'UI';
  }
  if (/^route\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'API';
  }
  if (/^actions\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'API';
  }
  if (/^middleware\.(ts|tsx|js|jsx)$/.test(fname)) {
    return 'Middleware';
  }

  // NestJS / backend conventions
  if (/\.(controller|resolver)\.(ts|js)$/.test(fname)) {
    return 'API';
  }
  if (/\.(service|provider)\.(ts|js)$/.test(fname)) {
    return 'Services';
  }
  if (/\.(entity|model|schema)\.(ts|js)$/.test(fname)) {
    return 'Data';
  }
  if (/\.(guard|interceptor|pipe|filter)\.(ts|js)$/.test(fname)) {
    return 'Middleware';
  }
  if (/\.module\.(ts|js)$/.test(fname)) {
    return 'Config';
  }

  return null;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '');
}
