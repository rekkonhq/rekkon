import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import Parser from 'tree-sitter';
import type { ExtractedExport, ExtractedImport, ExtractedSymbol, FileAnalysis, SymbolKind } from './types.js';
// tree-sitter-typescript is a CommonJS package with language exports.
import TypeScriptLanguages from 'tree-sitter-typescript';

type TreeSitterLanguage = Parameters<Parser['setLanguage']>[0];

const languages = TypeScriptLanguages as unknown as {
  typescript: TreeSitterLanguage;
  tsx: TreeSitterLanguage;
};

const tsParser = new Parser();
tsParser.setLanguage(languages.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(languages.tsx);

export function parseFile(filePath: string, projectRoot: string): FileAnalysis {
  const source = readFileSync(filePath, 'utf8');
  const normalizedPath = normalizePath(relative(projectRoot, filePath));
  const isTsx = filePath.endsWith('.tsx');
  const parser = isTsx ? tsxParser : tsParser;
  const tree = parser.parse(source);
  const root = tree.rootNode;

  return {
    filePath: normalizedPath,
    language: isTsx ? 'tsx' : 'typescript',
    loc: countLoc(source),
    imports: extractImports(root),
    exports: extractExports(root),
    symbols: extractSymbols(root),
  };
}

function extractImports(root: Parser.SyntaxNode): ExtractedImport[] {
  const imports: ExtractedImport[] = [];

  for (const node of root.children) {
    if (node.type !== 'import_statement') {
      continue;
    }
    const sourceNode = node.childForFieldName('source');
    if (!sourceNode) {
      continue;
    }

    const specifiers: string[] = [];
    let isDefault = false;
    let isNamespace = false;

    for (const child of node.children) {
      if (child.type !== 'import_clause') {
        continue;
      }

      for (const clauseChild of child.children) {
        if (clauseChild.type === 'identifier') {
          isDefault = true;
          specifiers.push(clauseChild.text);
          continue;
        }

        if (clauseChild.type === 'named_imports') {
          for (const specifier of clauseChild.children) {
            if (specifier.type !== 'import_specifier') {
              continue;
            }
            const name = specifier.childForFieldName('name');
            const alias = specifier.childForFieldName('alias');
            const resolvedName = alias?.text ?? name?.text ?? specifier.text;
            if (resolvedName) {
              specifiers.push(resolvedName);
            }
          }
          continue;
        }

        if (clauseChild.type === 'namespace_import') {
          isNamespace = true;
          const nsIdentifier = clauseChild.children.find(
            (nsChild) => nsChild.type === 'identifier',
          );
          if (nsIdentifier) {
            specifiers.push(nsIdentifier.text);
          }
        }
      }
    }

    imports.push({
      source: stripQuotes(sourceNode.text),
      specifiers,
      isDefault,
      isNamespace,
      line: node.startPosition.row + 1,
    });
  }

  return imports;
}

function extractExports(root: Parser.SyntaxNode): ExtractedExport[] {
  const exports: ExtractedExport[] = [];

  for (const node of root.children) {
    if (node.type !== 'export_statement') {
      continue;
    }

    const isDefault = node.children.some((child) => child.text === 'default');
    const declaration = node.childForFieldName('declaration');

    if (declaration) {
      const name = declaration.childForFieldName('name')?.text;
      if (name) {
        exports.push({
          name,
          isDefault,
          line: node.startPosition.row + 1,
        });
      } else if (isDefault) {
        exports.push({
          name: 'default',
          isDefault: true,
          line: node.startPosition.row + 1,
        });
      }
    }

    const exportClause = node.children.find((child) => child.type === 'export_clause');
    if (!exportClause) {
      continue;
    }

    for (const specifier of exportClause.children) {
      if (specifier.type !== 'export_specifier') {
        continue;
      }
      const name = specifier.childForFieldName('name')?.text;
      if (!name) {
        continue;
      }
      exports.push({
        name,
        isDefault: name === 'default',
        line: node.startPosition.row + 1,
      });
    }
  }

  return exports;
}

function extractSymbols(root: Parser.SyntaxNode): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];
  const exportedNames = collectExportedNames(root);

  for (const topLevelNode of root.children) {
    const declarationNode =
      topLevelNode.type === 'export_statement'
        ? topLevelNode.childForFieldName('declaration') ?? topLevelNode
        : topLevelNode;
    const isDirectExport = topLevelNode.type === 'export_statement';

    switch (declarationNode.type) {
      case 'function_declaration':
        symbols.push(
          buildFunctionSymbol(declarationNode, exportedNames, isDirectExport),
        );
        break;
      case 'class_declaration':
        symbols.push(buildClassSymbol(declarationNode, exportedNames, isDirectExport));
        break;
      case 'lexical_declaration':
      case 'variable_declaration':
        symbols.push(
          ...buildVariableSymbols(declarationNode, exportedNames, isDirectExport),
        );
        break;
      case 'interface_declaration':
        symbols.push(
          buildSimpleSymbol(
            declarationNode,
            'interface',
            exportedNames,
            isDirectExport,
            'AnonymousInterface',
          ),
        );
        break;
      case 'type_alias_declaration':
        symbols.push(
          buildSimpleSymbol(
            declarationNode,
            'type-alias',
            exportedNames,
            isDirectExport,
            'AnonymousType',
          ),
        );
        break;
      case 'enum_declaration':
        symbols.push(
          buildSimpleSymbol(
            declarationNode,
            'enum',
            exportedNames,
            isDirectExport,
            'AnonymousEnum',
          ),
        );
        break;
      default:
        break;
    }
  }

  return symbols;
}

function collectExportedNames(root: Parser.SyntaxNode): Set<string> {
  const exportedNames = new Set<string>();

  for (const node of root.children) {
    if (node.type !== 'export_statement') {
      continue;
    }
    const declaration = node.childForFieldName('declaration');
    const declarationName = declaration?.childForFieldName('name')?.text;
    if (declarationName) {
      exportedNames.add(declarationName);
    }

    const exportClause = node.children.find((child) => child.type === 'export_clause');
    if (!exportClause) {
      continue;
    }

    for (const specifier of exportClause.children) {
      if (specifier.type !== 'export_specifier') {
        continue;
      }
      const name = specifier.childForFieldName('name')?.text;
      if (name) {
        exportedNames.add(name);
      }
    }
  }

  return exportedNames;
}

function buildFunctionSymbol(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>,
  isDirectExport: boolean,
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text ?? 'anonymous';
  const isAsync = node.children.some((child) => child.text === 'async');
  const params = extractParams(node);
  const returnType = node
    .childForFieldName('return_type')
    ?.text?.replace(/^:\s*/, '');
  const jsxReturns = containsJsx(node);

  const kind = classifyFunctionLike(name, jsxReturns);
  return {
    name,
    kind,
    isExported: isDirectExport || exportedNames.has(name),
    isAsync,
    line: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    params,
    returnType,
    jsxReturns,
  };
}

function buildClassSymbol(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>,
  isDirectExport: boolean,
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text ?? 'AnonymousClass';
  return {
    name,
    kind: 'class',
    isExported: isDirectExport || exportedNames.has(name),
    isAsync: false,
    line: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    jsxReturns: false,
  };
}

function buildVariableSymbols(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>,
  isDirectExport: boolean,
): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];

  for (const child of node.children) {
    if (child.type !== 'variable_declarator') {
      continue;
    }

    const name = child.childForFieldName('name')?.text;
    if (!name) {
      continue;
    }

    const value = child.childForFieldName('value');
    const valueIsFunction = value?.type === 'arrow_function' || value?.type === 'function';
    const params = valueIsFunction && value ? extractParams(value) : undefined;
    const returnType = valueIsFunction
      ? value?.childForFieldName('return_type')?.text?.replace(/^:\s*/, '')
      : undefined;
    const jsxReturns = valueIsFunction && value ? containsJsx(value) : false;

    const kind: SymbolKind = valueIsFunction
      ? classifyFunctionLike(name, jsxReturns)
      : 'variable';

    symbols.push({
      name,
      kind,
      isExported: isDirectExport || exportedNames.has(name),
      isAsync: valueIsFunction
        ? (value?.children.some((valueChild) => valueChild.text === 'async') ?? false)
        : false,
      line: child.startPosition.row + 1,
      endLine: child.endPosition.row + 1,
      params,
      returnType,
      jsxReturns,
    });
  }

  return symbols;
}

function buildSimpleSymbol(
  node: Parser.SyntaxNode,
  kind: SymbolKind,
  exportedNames: Set<string>,
  isDirectExport: boolean,
  fallbackName: string,
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text ?? fallbackName;
  return {
    name,
    kind,
    isExported: isDirectExport || exportedNames.has(name),
    isAsync: false,
    line: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    jsxReturns: false,
  };
}

function extractParams(node: Parser.SyntaxNode): string[] {
  const paramsNode = node.childForFieldName('parameters');
  if (!paramsNode) {
    return [];
  }

  const params: string[] = [];
  for (const child of paramsNode.children) {
    if (
      child.type !== 'required_parameter' &&
      child.type !== 'optional_parameter' &&
      child.type !== 'rest_parameter'
    ) {
      continue;
    }
    const pattern = child.childForFieldName('pattern');
    if (pattern) {
      params.push(pattern.text);
    }
  }

  return params;
}

function classifyFunctionLike(name: string, jsxReturns: boolean): SymbolKind {
  const hasName = name.length > 0;
  const startsUpperCase = hasName && /^[A-Z]/.test(name);
  const isHook = /^use[A-Z0-9_]/.test(name);

  if (isHook) {
    return 'hook';
  }
  if (jsxReturns && startsUpperCase) {
    return 'component';
  }
  return 'function';
}

function containsJsx(node: Parser.SyntaxNode): boolean {
  const text = node.text;
  return /<[A-Z]/.test(text) || /<[a-z]+[\s>]/.test(text);
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

function countLoc(source: string): number {
  return source.split('\n').filter((line) => line.trim().length > 0).length;
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}
