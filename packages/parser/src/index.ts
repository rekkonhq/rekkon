import type { RekkonGraph } from '@rekkon/core';
import { analyzeProject } from './analyzer.js';

export interface AnalyzeOptions {
  /** Absolute path to the project root directory */
  rootDir: string;
  /** Glob patterns to ignore (added to defaults like node_modules, dist, .git) */
  ignorePaths?: string[];
  /** Whether to extract function/class-level symbols (default: true) */
  extractSymbols?: boolean;
  /** Maximum depth for module grouping (default: 2) */
  moduleDepth?: number;
}

export interface AnalyzeResult {
  graph: RekkonGraph;
  /** Duration in milliseconds */
  duration_ms: number;
  /** Files that failed to parse (non-fatal) */
  errors: Array<{ file: string; error: string }>;
}

export async function analyze(options: AnalyzeOptions): Promise<AnalyzeResult> {
  return analyzeProject(options);
}

export type { RekkonGraph } from '@rekkon/core';
