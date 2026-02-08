import Parser from 'tree-sitter';
// @ts-ignore — tree-sitter-typescript has its own types
import TypeScript from 'tree-sitter-typescript';
import { readFileSync } from 'fs';
import type {
  FileAnalysis,
  ExtractedImport,
  ExtractedExport,
  ExtractedSymbol,
  SymbolSubtype,
} from './types.js';

// ============================================================
// Tree-sitter Parser
// 
// Extracts from each TypeScript/TSX file:
// - Import statements (source path + imported names)
// - Export statements (exported names + whether default)
// - Function declarations (name, params, return type, async, line)
// - Class declarations (name, extends, implements)
// - Variable declarations (name, const/let/var, line)
// - JSX/TSX component usage
// - Type declarations (interfaces, type aliases)
// ============================================================

const tsParser = new Parser();
tsParser.setLanguage(TypeScript.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(TypeScript.tsx);

/**
 * Parse a single TypeScript/TSX file and extract all structural information.
 */
export function parseFile(filePath: string, projectRoot: string): FileAnalysis {
  const source = readFileSync(filePath, 'utf-8');
  // Normalize to forward slashes (Windows compat)
  const normalizedFile = filePath.replace(/\\/g, '/');
  const normalizedRoot = projectRoot.replace(/\\/g, '/');
  const relativePath = normalizedFile.replace(normalizedRoot + '/', '');
  const isTsx = filePath.endsWith('.tsx');
  const parser = isTsx ? tsxParser : tsParser;

  const tree = parser.parse(source);
  const rootNode = tree.rootNode;

  const loc = source.split('\n').filter(line => line.trim().length > 0).length;
  const imports = extractImports(rootNode);
  const exports = extractExports(rootNode);
  const symbols = extractSymbols(rootNode, source);

  return {
    file_path: relativePath,
    language: isTsx ? 'tsx' : 'typescript',
    loc,
    imports,
    exports,
    symbols,
  };
}

// ============================================================
// Import Extraction
// ============================================================

function extractImports(root: Parser.SyntaxNode): ExtractedImport[] {
  const imports: ExtractedImport[] = [];

  for (const node of root.children) {
    if (node.type === 'import_statement') {
      const imp = parseImportStatement(node);
      if (imp) imports.push(imp);
    }
  }

  return imports;
}

function parseImportStatement(node: Parser.SyntaxNode): ExtractedImport | null {
  const sourceNode = node.childForFieldName('source');
  if (!sourceNode) return null;

  // Strip quotes from the source string
  const source = sourceNode.text.replace(/['"]/g, '');
  const specifiers: string[] = [];
  let isDefault = false;
  let isNamespace = false;

  for (const child of node.children) {
    if (child.type === 'import_clause') {
      for (const clauseChild of child.children) {
        if (clauseChild.type === 'identifier') {
          // Default import: import Foo from '...'
          isDefault = true;
          specifiers.push(clauseChild.text);
        } else if (clauseChild.type === 'named_imports') {
          // Named imports: import { a, b } from '...'
          for (const spec of clauseChild.children) {
            if (spec.type === 'import_specifier') {
              const name = spec.childForFieldName('name');
              const alias = spec.childForFieldName('alias');
              specifiers.push(alias?.text || name?.text || spec.text);
            }
          }
        } else if (clauseChild.type === 'namespace_import') {
          // Namespace import: import * as X from '...'
          isNamespace = true;
          const name = clauseChild.children.find(c => c.type === 'identifier');
          if (name) specifiers.push(name.text);
        }
      }
    }
  }

  return {
    source,
    specifiers,
    is_default: isDefault,
    is_namespace: isNamespace,
    line: node.startPosition.row + 1,
  };
}

// ============================================================
// Export Extraction
// ============================================================

function extractExports(root: Parser.SyntaxNode): ExtractedExport[] {
  const exports: ExtractedExport[] = [];

  for (const node of root.children) {
    if (node.type === 'export_statement') {
      const isDefault = node.children.some(c => c.text === 'default');

      // export function foo() / export class Bar / export const x
      const declaration = node.childForFieldName('declaration');
      if (declaration) {
        const name = declaration.childForFieldName('name');
        if (name) {
          exports.push({
            name: name.text,
            is_default: isDefault,
            line: node.startPosition.row + 1,
          });
        }
      }

      // export { a, b, c }
      const exportClause = node.children.find(c => c.type === 'export_clause');
      if (exportClause) {
        for (const spec of exportClause.children) {
          if (spec.type === 'export_specifier') {
            const name = spec.childForFieldName('name');
            if (name) {
              exports.push({
                name: name.text,
                is_default: name.text === 'default',
                line: node.startPosition.row + 1,
              });
            }
          }
        }
      }

      // export default expression (no named declaration)
      if (isDefault && !declaration && !exportClause) {
        // export default X or export default function() {}
        const value = node.children.find(c =>
          c.type === 'identifier' ||
          c.type === 'call_expression' ||
          c.type === 'arrow_function' ||
          c.type === 'function_declaration'
        );
        exports.push({
          name: value?.type === 'identifier' ? value.text : 'default',
          is_default: true,
          line: node.startPosition.row + 1,
        });
      }
    }
  }

  return exports;
}

// ============================================================
// Symbol Extraction (functions, classes, components, types)
// ============================================================

function extractSymbols(root: Parser.SyntaxNode, source: string): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];
  const exportedNames = new Set<string>();

  // First pass: collect exported names
  for (const node of root.children) {
    if (node.type === 'export_statement') {
      const decl = node.childForFieldName('declaration');
      if (decl) {
        const name = decl.childForFieldName('name');
        if (name) exportedNames.add(name.text);
      }
      // Also check export clause
      const clause = node.children.find(c => c.type === 'export_clause');
      if (clause) {
        for (const spec of clause.children) {
          if (spec.type === 'export_specifier') {
            const name = spec.childForFieldName('name');
            if (name) exportedNames.add(name.text);
          }
        }
      }
    }
  }

  // Second pass: extract symbols from declarations
  for (const node of root.children) {
    const actualNode = node.type === 'export_statement'
      ? node.childForFieldName('declaration') || node
      : node;

    switch (actualNode.type) {
      case 'function_declaration':
        symbols.push(parseFunctionDecl(actualNode, exportedNames, source));
        break;

      case 'class_declaration':
        symbols.push(parseClassDecl(actualNode, exportedNames));
        break;

      case 'lexical_declaration': // const, let
      case 'variable_declaration': // var
        symbols.push(...parseVariableDecl(actualNode, exportedNames, source));
        break;

      case 'interface_declaration':
        symbols.push(parseInterfaceDecl(actualNode, exportedNames));
        break;

      case 'type_alias_declaration':
        symbols.push(parseTypeAliasDecl(actualNode, exportedNames));
        break;

      case 'enum_declaration':
        symbols.push(parseEnumDecl(actualNode, exportedNames));
        break;
    }
  }

  return symbols;
}

function parseFunctionDecl(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>,
  source: string
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text || 'anonymous';
  const isAsync = node.children.some(c => c.text === 'async');
  const params = extractParams(node);
  const returnType = node.childForFieldName('return_type')?.text?.replace(/^:\s*/, '');
  const jsxReturns = containsJsx(node, source);

  // Determine if it's a React hook or component
  let kind: SymbolSubtype = 'function';
  if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
    kind = 'hook';
  } else if (jsxReturns && name[0] === name[0].toUpperCase()) {
    kind = 'component';
  }

  return {
    name,
    kind,
    is_exported: exportedNames.has(name),
    is_async: isAsync,
    line: node.startPosition.row + 1,
    end_line: node.endPosition.row + 1,
    params,
    return_type: returnType,
    jsx_returns: jsxReturns,
  };
}

function parseClassDecl(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text || 'AnonymousClass';

  return {
    name,
    kind: 'class',
    is_exported: exportedNames.has(name),
    is_async: false,
    line: node.startPosition.row + 1,
    end_line: node.endPosition.row + 1,
    jsx_returns: false,
  };
}

function parseVariableDecl(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>,
  source: string
): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];

  // Walk through declarators
  for (const child of node.children) {
    if (child.type === 'variable_declarator') {
      const name = child.childForFieldName('name')?.text;
      if (!name) continue;

      const value = child.childForFieldName('value');
      let kind: SymbolSubtype = 'variable';
      let isAsync = false;
      let jsxReturns = false;
      let params: string[] | undefined;
      let returnType: string | undefined;

      if (value) {
        if (value.type === 'arrow_function' || value.type === 'function') {
          isAsync = value.children.some(c => c.text === 'async');
          params = extractParams(value);
          returnType = value.childForFieldName('return_type')?.text?.replace(/^:\s*/, '');
          jsxReturns = containsJsx(value, source);

          if (name.startsWith('use') && name.length > 3 && name[3] === name[3].toUpperCase()) {
            kind = 'hook';
          } else if (jsxReturns && name[0] === name[0].toUpperCase()) {
            kind = 'component';
          } else {
            kind = 'arrow_function';
          }
        }
      }

      symbols.push({
        name,
        kind,
        is_exported: exportedNames.has(name),
        is_async: isAsync,
        line: child.startPosition.row + 1,
        end_line: child.endPosition.row + 1,
        params,
        return_type: returnType,
        jsx_returns: jsxReturns,
      });
    }
  }

  return symbols;
}

function parseInterfaceDecl(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text || 'AnonymousInterface';
  return {
    name,
    kind: 'interface',
    is_exported: exportedNames.has(name),
    is_async: false,
    line: node.startPosition.row + 1,
    end_line: node.endPosition.row + 1,
    jsx_returns: false,
  };
}

function parseTypeAliasDecl(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text || 'AnonymousType';
  return {
    name,
    kind: 'type_alias',
    is_exported: exportedNames.has(name),
    is_async: false,
    line: node.startPosition.row + 1,
    end_line: node.endPosition.row + 1,
    jsx_returns: false,
  };
}

function parseEnumDecl(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text || 'AnonymousEnum';
  return {
    name,
    kind: 'enum',
    is_exported: exportedNames.has(name),
    is_async: false,
    line: node.startPosition.row + 1,
    end_line: node.endPosition.row + 1,
    jsx_returns: false,
  };
}

// ============================================================
// Helpers
// ============================================================

function extractParams(node: Parser.SyntaxNode): string[] {
  const paramsNode = node.childForFieldName('parameters');
  if (!paramsNode) return [];

  const params: string[] = [];
  for (const child of paramsNode.children) {
    if (
      child.type === 'required_parameter' ||
      child.type === 'optional_parameter' ||
      child.type === 'rest_parameter'
    ) {
      const pattern = child.childForFieldName('pattern');
      if (pattern) params.push(pattern.text);
    }
  }
  return params;
}

function containsJsx(node: Parser.SyntaxNode, source: string): boolean {
  // Quick check: does the node's text contain JSX-like patterns?
  const text = node.text;
  return /<[A-Z]/.test(text) || /<[a-z]+[\s>]/.test(text);
}
