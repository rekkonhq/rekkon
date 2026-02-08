import { createHash } from 'crypto';

/**
 * Generate deterministic node IDs.
 * 
 * From v0.5: "Our deterministic node IDs (hash of path + name) mean we can
 * diff two snapshots efficiently. Changed files get new node hashes,
 * unchanged files have identical hashes."
 * 
 * Format: {type}:{short_hash}
 * This keeps IDs human-debuggable while still being deterministic.
 */

function shortHash(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 12);
}

/** Layer node ID: layer:{hash(name)} */
export function layerId(name: string): string {
  return `layer:${shortHash(name)}`;
}

/** Module node ID: module:{hash(dir_path)} */
export function moduleId(dirPath: string): string {
  return `module:${shortHash(dirPath)}`;
}

/** File node ID: file:{hash(file_path)} */
export function fileId(filePath: string): string {
  return `file:${shortHash(filePath)}`;
}

/** Symbol node ID: symbol:{hash(file_path + symbol_name)} */
export function symbolId(filePath: string, symbolName: string): string {
  return `symbol:${shortHash(filePath + ':' + symbolName)}`;
}

/** Edge ID: edge:{hash(source + target + type)} */
export function edgeId(sourceId: string, targetId: string, type: string): string {
  return `edge:${shortHash(sourceId + '->' + targetId + ':' + type)}`;
}
