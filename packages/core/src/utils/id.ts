import { createHash } from 'crypto';

/**
 * Generate a deterministic node ID from its path components.
 * Same inputs always produce same output — enables cross-snapshot diffing.
 *
 * Format: type:hash
 * Examples:
 *   "layer:a1b2c3d4"     (layer node)
 *   "module:e5f6g7h8"    (module node)
 *   "file:i9j0k1l2"      (file node)
 *   "symbol:m3n4o5p6"    (symbol node)
 */
export function generateNodeId(type: string, ...parts: string[]): string {
  const input = parts.join('::');
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 8);
  return `${type}:${hash}`;
}

/**
 * Generate a deterministic edge ID from source, target, and type.
 */
export function generateEdgeId(sourceId: string, targetId: string, edgeType: string): string {
  const input = `${sourceId}::${targetId}::${edgeType}`;
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 8);
  return `edge:${hash}`;
}
