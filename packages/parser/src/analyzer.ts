import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { RekkonGraphSchema, type RekkonGraph } from '@rekkon/core';
import type { AnalyzeOptions, AnalyzeResult } from './index.js';
import { buildGraph } from './graph/builder.js';
import { getLanguageAnalyzer, inferLanguage, type ParsedFile } from './languages/index.js';
import { scanFiles, type ScannedFile } from './scanner.js';

const ANALYZER_VERSION = '0.1.0';

export async function analyzeProject(options: AnalyzeOptions): Promise<AnalyzeResult> {
  const startedAt = Date.now();
  const rootDir = resolve(options.rootDir);
  const ignorePaths = options.ignorePaths ?? [];
  const extractSymbols = options.extractSymbols ?? true;
  const moduleDepth = sanitizeModuleDepth(options.moduleDepth);

  if (!existsSync(rootDir) || !statSync(rootDir).isDirectory()) {
    throw new Error(`Directory not found: ${rootDir}`);
  }

  const files = await scanFiles(rootDir, ignorePaths);
  const errors: Array<{ file: string; error: string }> = [];
  const analyses: ParsedFile[] = [];

  for (const file of files) {
    const languageAnalyzer = getLanguageAnalyzer(file.relativePath);

    if (!languageAnalyzer) {
      const fallback = buildFallbackAnalysis(file);
      if (fallback) {
        analyses.push(fallback);
      } else {
        errors.push({
          file: file.relativePath,
          error: 'Failed to read file for fallback analysis',
        });
      }
      continue;
    }

    try {
      const parsed = languageAnalyzer(file);
      analyses.push(
        extractSymbols
          ? parsed
          : {
              ...parsed,
              symbols: [],
            },
      );
    } catch (error) {
      errors.push({
        file: file.relativePath,
        error: toErrorMessage(error),
      });
    }
  }

  const graph = buildGraph({
    projectRoot: rootDir,
    files: analyses,
    moduleDepth,
    extractSymbols,
    analyzerVersion: ANALYZER_VERSION,
  });

  const durationMs = Date.now() - startedAt;
  const withDuration: RekkonGraph = RekkonGraphSchema.parse({
    ...graph,
    snapshot: {
      ...graph.snapshot,
      analysis_duration_ms: durationMs,
      analyzer_version: ANALYZER_VERSION,
    },
  });

  return {
    graph: withDuration,
    duration_ms: durationMs,
    errors,
  };
}

function buildFallbackAnalysis(file: ScannedFile): ParsedFile | null {
  try {
    const source = readFileSync(file.absolutePath, 'utf8');
    return {
      absolutePath: file.absolutePath,
      relativePath: file.relativePath,
      language: inferLanguage(file.relativePath),
      loc: countLoc(source),
      imports: [],
      exports: [],
      symbols: [],
      hasDefaultExport: false,
    };
  } catch {
    return null;
  }
}

function sanitizeModuleDepth(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) {
    return 2;
  }
  return Math.max(0, Math.floor(value));
}

function countLoc(source: string): number {
  return source.split('\n').filter((line) => line.trim().length > 0).length;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
