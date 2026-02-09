import { DEFAULT_LAYER_RULES } from '@rekkon/core';

export function classifyFileToLayer(relativePath: string): string {
  const segments = normalizePath(relativePath)
    .toLowerCase()
    .split('/')
    .filter((segment) => segment.length > 0);

  for (let i = segments.length - 1; i >= 0; i -= 1) {
    for (let j = 0; j <= i; j += 1) {
      const candidate = segments.slice(j, i + 1).join('/');
      const mappedLayer = DEFAULT_LAYER_RULES[candidate];
      if (mappedLayer) {
        return mappedLayer;
      }
    }

    const mappedSingle = DEFAULT_LAYER_RULES[segments[i]];
    if (mappedSingle) {
      return mappedSingle;
    }
  }

  return 'Other';
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/').replace(/^\.\/+/, '');
}
