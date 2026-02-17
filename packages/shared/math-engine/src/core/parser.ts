import type { StaticToken } from '../types';
import { normalizeLatex } from './latex';
import { MatrixModel } from '../commands/matrix-model';

const FIELD_REGEX = /\\MathQuillMathField\[(r\d+)\]\{([\s\S]*?)\}/g;
const EMBED_ANSWER_REGEX = /\\embed\{answerBlock\}\[(r\d+)\]/g;

export function parseStaticLatex(rawLatex: string): StaticToken[] {
  const latex = normalizeLatex(rawLatex);
  const tokens: StaticToken[] = [];
  let index = 0;

  const withEmbedsAsFields = latex.replace(EMBED_ANSWER_REGEX, '\\MathQuillMathField[$1]{}');
  FIELD_REGEX.lastIndex = 0;

  for (const match of withEmbedsAsFields.matchAll(FIELD_REGEX)) {
    const full = match[0];
    const fieldId = match[1];
    const fieldValue = match[2] ?? '';
    const start = match.index ?? 0;

    if (start > index) {
      tokens.push({
        type: 'text',
        value: withEmbedsAsFields.slice(index, start),
      });
    }

    tokens.push({
      type: 'field',
      id: fieldId,
      value: fieldValue,
    });

    index = start + full.length;
  }

  if (index < withEmbedsAsFields.length) {
    tokens.push({
      type: 'text',
      value: withEmbedsAsFields.slice(index),
    });
  }

  if (tokens.length === 0) {
    tokens.push({
      type: 'text',
      value: withEmbedsAsFields,
    });
  }

  return tokens;
}

export function composeStaticLatex(tokens: StaticToken[]): string {
  return tokens
    .map((token) => {
      if (token.type === 'text') {
        return token.value;
      }
      return `\\MathQuillMathField[${token.id}]{${token.value}}`;
    })
    .join('');
}

export function parseMatrixLatex(latex: string): MatrixModel | null {
  return MatrixModel.fromLatex(latex || '');
}
