import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ts from 'typescript';
import type { PieDocsSourcePointer } from './types.js';

type EvaluationScope = Map<string, unknown>;

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const getPathValue = (value: unknown, path?: string): unknown => {
  if (!path || path.trim().length === 0) {
    return value;
  }
  const segments = path.split('.').map((s) => s.trim());
  let current: unknown = value;
  for (const segment of segments) {
    const record = asRecord(current);
    if (!record || !(segment in record)) {
      return undefined;
    }
    current = record[segment];
  }
  return current;
};

const evaluateTemplate = (
  expr: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral,
  scope: EvaluationScope
): unknown => {
  if (ts.isNoSubstitutionTemplateLiteral(expr)) {
    return expr.text;
  }

  let result = expr.head.text;
  for (const span of expr.templateSpans) {
    const evalExpr = evaluateNode(span.expression, scope);
    if (evalExpr === undefined || evalExpr === null) {
      return undefined;
    }
    result += String(evalExpr) + span.literal.text;
  }
  return result;
};

const evaluateObjectLiteral = (
  node: ts.ObjectLiteralExpression,
  scope: EvaluationScope
): unknown => {
  const output: Record<string, unknown> = {};

  for (const property of node.properties) {
    if (ts.isPropertyAssignment(property)) {
      const key = ts.isIdentifier(property.name)
        ? property.name.text
        : ts.isStringLiteral(property.name)
          ? property.name.text
          : ts.isNumericLiteral(property.name)
            ? property.name.text
            : undefined;
      if (!key) {
        continue;
      }
      const value = evaluateNode(property.initializer, scope);
      if (value !== undefined) {
        output[key] = value;
      }
      continue;
    }

    if (ts.isShorthandPropertyAssignment(property)) {
      const value = scope.get(property.name.text);
      if (value !== undefined) {
        output[property.name.text] = value;
      }
      continue;
    }

    if (ts.isSpreadAssignment(property)) {
      const spreadValue = evaluateNode(property.expression, scope);
      const spreadRecord = asRecord(spreadValue);
      if (spreadRecord) {
        Object.assign(output, spreadRecord);
      }
    }
  }

  return output;
};

const evaluateArrayLiteral = (node: ts.ArrayLiteralExpression, scope: EvaluationScope): unknown => {
  const output: unknown[] = [];
  for (const item of node.elements) {
    if (ts.isSpreadElement(item)) {
      const spreadValue = evaluateNode(item.expression, scope);
      if (Array.isArray(spreadValue)) {
        output.push(...spreadValue);
      }
      continue;
    }
    output.push(evaluateNode(item, scope));
  }
  return output;
};

const evaluateNode = (node: ts.Expression, scope: EvaluationScope): unknown => {
  if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) {
    return evaluateNode(node.expression, scope);
  }

  if (ts.isParenthesizedExpression(node)) {
    return evaluateNode(node.expression, scope);
  }

  if (ts.isObjectLiteralExpression(node)) {
    return evaluateObjectLiteral(node, scope);
  }

  if (ts.isArrayLiteralExpression(node)) {
    return evaluateArrayLiteral(node, scope);
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isTemplateExpression(node)) {
    return evaluateTemplate(node, scope);
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }

  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }

  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (ts.isIdentifier(node)) {
    return scope.get(node.text);
  }

  if (ts.isPrefixUnaryExpression(node)) {
    const value = evaluateNode(node.operand, scope);
    if (typeof value !== 'number') {
      return undefined;
    }
    switch (node.operator) {
      case ts.SyntaxKind.MinusToken:
        return -value;
      case ts.SyntaxKind.PlusToken:
        return value;
      default:
        return undefined;
    }
  }

  return undefined;
};

const extractExportExpression = (
  sourceFile: ts.SourceFile,
  exportName: string,
  scope: EvaluationScope
): unknown => {
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement) && exportName === 'default') {
      return evaluateNode(statement.expression, scope);
    }

    if (ts.isVariableStatement(statement)) {
      const hasExport = statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
      if (!hasExport) {
        continue;
      }

      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          continue;
        }
        if (declaration.name.text === exportName) {
          return evaluateNode(declaration.initializer, scope);
        }
      }
    }
  }

  return undefined;
};

const buildScope = (sourceFile: ts.SourceFile): EvaluationScope => {
  const scope: EvaluationScope = new Map();

  // Evaluate top-level const declarations. Multiple passes handle dependency order.
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const statement of sourceFile.statements) {
      if (!ts.isVariableStatement(statement)) {
        continue;
      }
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          continue;
        }
        const identifier = declaration.name.text;
        if (scope.has(identifier)) {
          continue;
        }
        const evaluated = evaluateNode(declaration.initializer, scope);
        if (evaluated !== undefined) {
          scope.set(identifier, evaluated);
          changed = true;
        }
      }
    }
    if (!changed) {
      break;
    }
  }

  return scope;
};

export const loadPointerValue = async (
  packageDir: string,
  pointer: PieDocsSourcePointer
): Promise<unknown> => {
  const filePath = join(packageDir, pointer.file);
  if (!existsSync(filePath)) {
    throw new Error(`Pointer file does not exist: ${pointer.file}`);
  }

  const source = await readFile(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS
  );
  const scope = buildScope(sourceFile);
  const exportName = pointer.exportName || 'default';
  const exportValue = extractExportExpression(sourceFile, exportName, scope);

  if (exportValue === undefined) {
    throw new Error(`Unable to evaluate export "${exportName}" from ${pointer.file}`);
  }

  const pathValue = getPathValue(exportValue, pointer.path);
  if (pathValue === undefined) {
    throw new Error(
      `Unable to resolve path "${pointer.path}" from export "${exportName}" in ${pointer.file}`
    );
  }
  return pathValue;
};
