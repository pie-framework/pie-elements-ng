import ts from 'typescript';

export type ModuleSpecifierKind = 'import' | 'export' | 'dynamic-import';

export interface ModuleSpecifierContext {
  kind: ModuleSpecifierKind;
  isTypeOnly: boolean;
  isSideEffectOnly: boolean;
}

export interface SourceEdit {
  start: number;
  end: number;
  text: string;
}

export type ModuleSpecifierRewriter = (
  specifier: string,
  context: ModuleSpecifierContext
) => string | null | undefined;

export function applySourceEdits(source: string, edits: SourceEdit[]): string {
  if (edits.length === 0) {
    return source;
  }

  const sorted = [...edits].sort((a, b) => b.start - a.start);
  let previousStart = source.length;
  let transformed = source;

  for (const edit of sorted) {
    if (edit.start < 0 || edit.end < edit.start || edit.end > source.length) {
      throw new Error(`Invalid source edit range: ${edit.start}-${edit.end}`);
    }
    if (edit.end > previousStart) {
      throw new Error(`Overlapping source edit range: ${edit.start}-${edit.end}`);
    }

    transformed = transformed.slice(0, edit.start) + edit.text + transformed.slice(edit.end);
    previousStart = edit.start;
  }

  return transformed;
}

export function rewriteModuleSpecifiers(
  source: string,
  rewriter: ModuleSpecifierRewriter,
  sourceFileName = 'source.tsx'
): string {
  const sourceFile = ts.createSourceFile(
    sourceFileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindForFileName(sourceFileName)
  );
  const edits: SourceEdit[] = [];

  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      addSpecifierEdit(source, sourceFile, edits, node.moduleSpecifier, rewriter, {
        kind: 'import',
        isTypeOnly: node.importClause?.isTypeOnly ?? false,
        isSideEffectOnly: !node.importClause,
      });
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      addSpecifierEdit(source, sourceFile, edits, node.moduleSpecifier, rewriter, {
        kind: 'export',
        isTypeOnly: node.isTypeOnly,
        isSideEffectOnly: false,
      });
    } else if (isDynamicStringImport(node)) {
      addSpecifierEdit(source, sourceFile, edits, node.arguments[0], rewriter, {
        kind: 'dynamic-import',
        isTypeOnly: false,
        isSideEffectOnly: false,
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return applySourceEdits(source, edits);
}

function addSpecifierEdit(
  source: string,
  sourceFile: ts.SourceFile,
  edits: SourceEdit[],
  literal: ts.StringLiteral,
  rewriter: ModuleSpecifierRewriter,
  context: ModuleSpecifierContext
): void {
  const replacement = rewriter(literal.text, context);
  if (!replacement || replacement === literal.text) {
    return;
  }

  const start = literal.getStart(sourceFile);
  const end = literal.getEnd();
  const originalText = source.slice(start, end);

  edits.push({
    start,
    end,
    text: quoteModuleSpecifier(replacement, originalText),
  });
}

function quoteModuleSpecifier(specifier: string, originalText: string): string {
  const delimiter = originalText.startsWith('"') ? '"' : "'";
  const escaped = specifier.replace(/\\/g, '\\\\').replaceAll(delimiter, `\\${delimiter}`);
  return `${delimiter}${escaped}${delimiter}`;
}

function isDynamicStringImport(node: ts.Node): node is ts.CallExpression & {
  arguments: ts.NodeArray<ts.StringLiteral>;
} {
  return (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    node.arguments.length === 1 &&
    ts.isStringLiteral(node.arguments[0])
  );
}

function scriptKindForFileName(sourceFileName: string): ts.ScriptKind {
  if (sourceFileName.endsWith('.ts')) return ts.ScriptKind.TS;
  if (sourceFileName.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (sourceFileName.endsWith('.js')) return ts.ScriptKind.JS;
  if (sourceFileName.endsWith('.jsx')) return ts.ScriptKind.JSX;
  return ts.ScriptKind.TSX;
}
