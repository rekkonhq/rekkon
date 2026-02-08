import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import type { RekkonGraph } from '@rekkon/core';
import { buildGraph } from './graph-builder.js';
import { discoverTypeScriptFiles } from './io.js';
import { parseFile } from './tree-sitter-parser.js';

export interface AnalyzeOptions {
  rootDir: string;
  ignorePaths?: string[];
}

const ANALYZER_VERSION = '0.1.0';

/**
 * Analyze a codebase and produce a RekkonGraph.
 */
export async function analyze(options: AnalyzeOptions): Promise<RekkonGraph> {
  const startedAt = Date.now();
  const rootDir = resolve(options.rootDir);
  const ignorePaths = options.ignorePaths ?? [];

  if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
    throw new Error(`Directory not found: ${rootDir}`);
  }

  const files = discoverTypeScriptFiles(rootDir, ignorePaths);
  if (files.length === 0) {
    throw new Error(`No TypeScript files found in: ${rootDir}`);
  }

  const analyses = files
    .map((filePath) => {
      try {
        return parseFile(filePath, rootDir);
      } catch {
        return null;
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (analyses.length === 0) {
    throw new Error(`Failed to parse all files under: ${rootDir}`);
  }

  const built = buildGraph(analyses);
  const generatedAt = new Date().toISOString();

  return {
    version: '1.0.0',
    generated_at: generatedAt,
    analyzer_version: ANALYZER_VERSION,
    snapshot: {
      schema_version: '1.0.0',
      total_files: built.summary.total_files,
      total_symbols: built.summary.total_symbols,
      total_edges: built.summary.total_edges,
      total_loc: built.summary.total_loc,
      languages: built.summary.languages,
      framework: built.summary.framework ?? null,
      layer_summary: built.summary.layer_summary,
      analysis_duration_ms: Date.now() - startedAt,
      analyzer_version: ANALYZER_VERSION,
      trigger: 'manual',
      analyzed_at: generatedAt,
    },
    elements: {
      nodes: built.cytoscapeNodes,
      edges: built.cytoscapeEdges,
    },
  };
}
