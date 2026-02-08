import type { RekkonGraph } from '@rekkon/core';

export interface AnalyzeOptions {
  rootDir: string;
  ignorePaths?: string[];
}

/**
 * Analyze a codebase and produce a RekkonGraph.
 * Placeholder — real implementation will be migrated from the PoC in src/
 */
export async function analyze(options: AnalyzeOptions): Promise<RekkonGraph> {
  throw new Error('Not implemented yet. See src/ for PoC implementation.');
}
