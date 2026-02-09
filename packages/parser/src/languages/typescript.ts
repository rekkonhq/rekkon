import { readFileSync } from 'node:fs';
import Parser from 'tree-sitter';
import JavaScriptLanguage from 'tree-sitter-javascript';
import TypeScriptLanguages from 'tree-sitter-typescript';
import type { ScannedFile } from '../scanner.js';
import type { ExtractedExport, ExtractedImport, ExtractedSymbol, ParsedFile } from './index.js';

type TreeSitterLanguage = Parameters<Parser['setLanguage']>[0];

const typescriptLanguages = TypeScriptLanguages as unknown as {
  typescript: TreeSitterLanguage;
  tsx: TreeSitterLanguage;
};

const javascriptLanguage = JavaScriptLanguage as unknown as TreeSitterLanguage;

const typescriptParser = new Parser();
typescriptParser.setLanguage(typescriptLanguages.typescript);

const tsxParser = new Parser();
tsxParser.setLanguage(typescriptLanguages.tsx);

const javascriptParser = new Parser();
javascriptParser.setLanguage(javascriptLanguage);

export function parseTypeScriptLikeFile(file: ScannedFile): ParsedFile {
  const source = readFileSync(file.absolutePath, 'utf8');
  const parser = getParserForFile(file.relativePath);
  const tree = parser.parse(source);
  const root = tree.rootNode;

  const imports = extractImports(root);
  const { exports, hasDefaultExport } = extractExports(root);
  const symbols = extractSymbols(root);

  return {
    absolutePath: file.absolutePath,
    relativePath: normalizePath(file.relativePath),
    language: inferLanguage(file.relativePath),
    loc: countLoc(source),
    imports,
    exports,
    symbols,
    hasDefaultExport,
  };
}

function getParserForFile(relativePath: string): Parser {
  const normalized = relativePath.toLowerCase();
  if (normalized.endsWith('.tsx')) {
    return tsxParser;
  }
  if (
    normalized.endsWith('.ts') ||
    normalized.endsWith('.mts') ||
    normalized.endsWith('.cts') ||
    normalized.endsWith('.d.ts')
  ) {
    return typescriptParser;
  }
  return javascriptParser;
}

function inferLanguage(relativePath: string): string {
  const normalized = relativePath.toLowerCase();
  if (
    normalized.endsWith('.ts') ||
    normalized.endsWith('.tsx') ||
    normalized.endsWith('.mts') ||
    normalized.endsWith('.cts') ||
    normalized.endsWith('.d.ts')
  ) {
    return 'typescript';
  }
  if (normalized.endsWith('.jsx')) {
    return 'jsx';
  }
  return 'javascript';
}

function extractImports(root: Parser.SyntaxNode): ExtractedImport[] {
  const imports: ExtractedImport[] = [];

  for (const node of root.children) {
    if (node.type === 'import_statement') {
      const extractedImport = extractImportStatement(node);
      if (extractedImport) {
        imports.push(extractedImport);
      }
      continue;
    }

    if (node.type === 'export_statement') {
      const extractedReExport = extractReExportStatement(node);
      if (extractedReExport) {
        imports.push(extractedReExport);
      }
    }
  }

  return imports;
}

function extractImportStatement(node: Parser.SyntaxNode): ExtractedImport | null {
  const sourceNode = node.childForFieldName('source');
  if (!sourceNode) {
    return null;
  }

  const specifiers: string[] = [];
  for (const child of node.children) {
    if (child.type !== 'import_clause') {
      continue;
    }

    for (const clauseChild of child.children) {
      if (clauseChild.type === 'identifier') {
        specifiers.push(clauseChild.text);
        continue;
      }

      if (clauseChild.type === 'named_imports') {
        for (const namedImport of clauseChild.children) {
          if (namedImport.type !== 'import_specifier') {
            continue;
          }
          const name = namedImport.childForFieldName('name');
          const alias = namedImport.childForFieldName('alias');
          const resolved = alias?.text ?? name?.text ?? namedImport.text;
          if (resolved) {
            specifiers.push(resolved);
          }
        }
        continue;
      }

      if (clauseChild.type === 'namespace_import') {
        const namespaceIdentifier = clauseChild.children.find(
          (namespaceChild) => namespaceChild.type === 'identifier',
        );
        if (namespaceIdentifier) {
          specifiers.push(namespaceIdentifier.text);
        }
      }
    }
  }

  return {
    source: stripQuotes(sourceNode.text),
    specifiers,
    line: node.startPosition.row + 1,
  };
}

function extractReExportStatement(node: Parser.SyntaxNode): ExtractedImport | null {
  const sourceNode = node.childForFieldName('source');
  if (!sourceNode) {
    return null;
  }

  const specifiers: string[] = [];

  const exportClause = node.children.find((child) => child.type === 'export_clause');
  if (exportClause) {
    for (const specifier of exportClause.children) {
      if (specifier.type !== 'export_specifier') {
        continue;
      }
      const name = specifier.childForFieldName('name');
      const alias = specifier.childForFieldName('alias');
      const resolved = alias?.text ?? name?.text ?? specifier.text;
      if (resolved) {
        specifiers.push(resolved);
      }
    }
  }

  const namespaceExport = node.children.find((child) => child.type === 'namespace_export');
  if (namespaceExport) {
    const namespaceIdentifier = namespaceExport.children.find(
      (namespaceChild) => namespaceChild.type === 'identifier',
    );
    if (namespaceIdentifier) {
      specifiers.push(namespaceIdentifier.text);
    }
  }

  if (
    specifiers.length === 0 &&
    node.children.some((child) => child.type === '*' || child.text === '*')
  ) {
    specifiers.push('*');
  }

  return {
    source: stripQuotes(sourceNode.text),
    specifiers,
    line: node.startPosition.row + 1,
  };
}

function extractExports(root: Parser.SyntaxNode): {
  exports: ExtractedExport[];
  hasDefaultExport: boolean;
} {
  const exports: ExtractedExport[] = [];
  const seen = new Set<string>();
  let hasDefaultExport = false;

  for (const node of root.children) {
    if (node.type !== 'export_statement') {
      continue;
    }

    const isDefault = node.children.some((child) => child.text === 'default');
    if (isDefault) {
      hasDefaultExport = true;
    }

    const declaration = node.childForFieldName('declaration');
    if (declaration) {
      const name = declaration.childForFieldName('name')?.text;
      if (name) {
        addExport(exports, seen, name, isDefault, node.startPosition.row + 1);
      } else if (isDefault) {
        addExport(exports, seen, 'default', true, node.startPosition.row + 1);
      }
    }

    const exportClause = node.children.find((child) => child.type === 'export_clause');
    if (exportClause) {
      for (const specifier of exportClause.children) {
        if (specifier.type !== 'export_specifier') {
          continue;
        }
        const name = specifier.childForFieldName('name')?.text;
        if (!name) {
          continue;
        }
        addExport(exports, seen, name, name === 'default', node.startPosition.row + 1);
      }
    }

    if (isDefault && !declaration && !exportClause) {
      addExport(exports, seen, 'default', true, node.startPosition.row + 1);
    }
  }

  return { exports, hasDefaultExport };
}

function addExport(
  list: ExtractedExport[],
  seen: Set<string>,
  name: string,
  isDefault: boolean,
  line: number,
): void {
  const key = `${name}:${Number(isDefault)}:${line}`;
  if (seen.has(key)) {
    return;
  }
  seen.add(key);
  list.push({ name, isDefault, line });
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
        symbols.push(buildFunctionSymbol(declarationNode, exportedNames, isDirectExport));
        break;
      case 'class_declaration':
        symbols.push(buildSimpleSymbol(declarationNode, 'class', exportedNames, isDirectExport));
        break;
      case 'interface_declaration':
        symbols.push(buildSimpleSymbol(declarationNode, 'interface', exportedNames, isDirectExport));
        break;
      case 'type_alias_declaration':
        symbols.push(buildSimpleSymbol(declarationNode, 'type-alias', exportedNames, isDirectExport));
        break;
      case 'enum_declaration':
        symbols.push(buildSimpleSymbol(declarationNode, 'enum', exportedNames, isDirectExport));
        break;
      case 'lexical_declaration':
      case 'variable_declaration':
        symbols.push(...buildVariableSymbols(declarationNode, exportedNames, isDirectExport));
        break;
      default:
        break;
    }
  }

  symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name));
  return symbols;
}

function collectExportedNames(root: Parser.SyntaxNode): Set<string> {
  const names = new Set<string>();

  for (const node of root.children) {
    if (node.type !== 'export_statement') {
      continue;
    }

    const declaration = node.childForFieldName('declaration');
    const declarationName = declaration?.childForFieldName('name')?.text;
    if (declarationName) {
      names.add(declarationName);
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
        names.add(name);
      }
    }
  }

  return names;
}

function buildFunctionSymbol(
  node: Parser.SyntaxNode,
  exportedNames: Set<string>,
  isDirectExport: boolean,
): ExtractedSymbol {
  const name = node.childForFieldName('name')?.text ?? 'anonymous';
  return {
    name,
    subtype: 'function',
    isExported: isDirectExport || exportedNames.has(name),
    isAsync: node.children.some((child) => child.text === 'async'),
    line: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
    params: extractParams(node),
    returnType: node.childForFieldName('return_type')?.text?.replace(/^:\s*/, ''),
  };
}

function buildSimpleSymbol(
  node: Parser.SyntaxNode,
  subtype: ExtractedSymbol['subtype'],
  exportedNames: Set<string>,
  isDirectExport: boolean,
): ExtractedSymbol {
  const fallbackNames: Record<ExtractedSymbol['subtype'], string> = {
    function: 'anonymous',
    class: 'AnonymousClass',
    interface: 'AnonymousInterface',
    'type-alias': 'AnonymousType',
    variable: 'anonymousVariable',
    enum: 'AnonymousEnum',
    constant: 'anonymousConstant',
  };

  const name = node.childForFieldName('name')?.text ?? fallbackNames[subtype];
  return {
    name,
    subtype,
    isExported: isDirectExport || exportedNames.has(name),
    isAsync: false,
    line: node.startPosition.row + 1,
    endLine: node.endPosition.row + 1,
  };
}

function buildVariableSymbols(
  declarationNode: Parser.SyntaxNode,
  exportedNames: Set<string>,
  isDirectExport: boolean,
): ExtractedSymbol[] {
  const symbols: ExtractedSymbol[] = [];
  const isConstDeclaration =
    declarationNode.type === 'lexical_declaration' &&
    declarationNode.children.some((child) => child.type === 'const' || child.text === 'const');

  for (const child of declarationNode.children) {
    if (child.type !== 'variable_declarator') {
      continue;
    }

    const name = child.childForFieldName('name')?.text;
    if (!name) {
      continue;
    }

    const value = child.childForFieldName('value');
    const isFunctionValue =
      value?.type === 'arrow_function' ||
      value?.type === 'function' ||
      value?.type === 'function_expression';

    symbols.push({
      name,
      subtype: isFunctionValue ? 'function' : isConstDeclaration ? 'constant' : 'variable',
      isExported: isDirectExport || exportedNames.has(name),
      isAsync: isFunctionValue
        ? (value?.children.some((valueChild) => valueChild.text === 'async') ?? false)
        : false,
      line: child.startPosition.row + 1,
      endLine: child.endPosition.row + 1,
      params: isFunctionValue && value ? extractParams(value) : undefined,
      returnType: isFunctionValue
        ? value?.childForFieldName('return_type')?.text?.replace(/^:\s*/, '')
        : undefined,
    });
  }

  return symbols;
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
    const paramPattern = child.childForFieldName('pattern');
    if (paramPattern) {
      params.push(paramPattern.text);
    }
  }

  return params;
}

function countLoc(source: string): number {
  return source.split('\n').filter((line) => line.trim().length > 0).length;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, '');
}

function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}
