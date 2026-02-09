import { extname } from 'node:path';
import type { NodeSubtype } from '@rekkon/core';
import type { ScannedFile } from '../scanner.js';
import { parseTypeScriptLikeFile } from './typescript.js';

export type SymbolSubtype = Extract<
  NodeSubtype,
  'function' | 'class' | 'interface' | 'type-alias' | 'variable' | 'enum' | 'constant'
>;

export interface ExtractedImport {
  source: string;
  specifiers: string[];
  line: number;
}

export interface ExtractedExport {
  name: string;
  isDefault: boolean;
  line: number;
}

export interface ExtractedSymbol {
  name: string;
  subtype: SymbolSubtype;
  isExported: boolean;
  isAsync: boolean;
  line: number;
  endLine: number;
  params?: string[];
  returnType?: string;
}

export interface ParsedFile {
  absolutePath: string;
  relativePath: string;
  language: string;
  loc: number;
  imports: ExtractedImport[];
  exports: ExtractedExport[];
  symbols: ExtractedSymbol[];
  hasDefaultExport: boolean;
}

export type LanguageAnalyzer = (file: ScannedFile) => ParsedFile;

const PARSED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

export function getLanguageAnalyzer(relativePath: string): LanguageAnalyzer | null {
  const normalized = relativePath.toLowerCase();
  if (normalized.endsWith('.d.ts')) {
    return parseTypeScriptLikeFile;
  }

  const extension = extname(normalized);
  if (PARSED_EXTENSIONS.has(extension)) {
    return parseTypeScriptLikeFile;
  }

  return null;
}

export function inferLanguage(relativePath: string): string {
  const normalized = relativePath.toLowerCase();
  if (normalized.endsWith('.d.ts')) {
    return 'typescript';
  }

  const extension = extname(normalized);
  switch (extension) {
    case '.ts':
    case '.tsx':
    case '.mts':
    case '.cts':
      return 'typescript';
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      return 'javascript';
    case '.css':
      return 'css';
    case '.scss':
      return 'scss';
    default:
      return extension ? extension.slice(1) : 'unknown';
  }
}
