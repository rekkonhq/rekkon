import { DEFAULT_LAYER_RULES } from '@rekkon/core';

export function classifyFileToLayer(relativePath: string): string {
  const parts = normalizePath(relativePath)
    .toLowerCase()
    .split('/')
    .filter((segment) => segment.length > 0);

  // Ignore filename and classify from directories only.
  parts.pop();

  for (let length = parts.length; length >= 1; length -= 1) {
    for (let end = parts.length; end >= length; end -= 1) {
      const start = end - length;
      const candidate = parts.slice(start, end).join('/');
      const mappedLayer = DEFAULT_LAYER_RULES[candidate];
      if (mappedLayer) {
        return mappedLayer;
      }
    }
  }

  return 'Other';
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '');
}
