import { describe, expect, it } from 'vitest';
import { composeStaticLatex, parseMatrixLatex, parseStaticLatex } from '../../src/core/parser';

describe('parseStaticLatex', () => {
  it('parses response placeholders as fields', () => {
    const tokens = parseStaticLatex('x=\\MathQuillMathField[r1]{2}+\\MathQuillMathField[r2]{}');
    expect(tokens).toEqual([
      { type: 'text', value: 'x=' },
      { type: 'field', id: 'r1', value: '2' },
      { type: 'text', value: '+' },
      { type: 'field', id: 'r2', value: '' },
    ]);
  });

  it('normalizes answerBlock embeds into fields', () => {
    const tokens = parseStaticLatex('\\embed{answerBlock}[r3]');
    expect(tokens).toEqual([{ type: 'field', id: 'r3', value: '' }]);
  });

  it('recomposes latex deterministically', () => {
    const tokens = parseStaticLatex('a\\MathQuillMathField[r1]{b}');
    expect(composeStaticLatex(tokens)).toBe('a\\MathQuillMathField[r1]{b}');
  });

  it('parses matrix latex via matrix model', () => {
    const matrix = parseMatrixLatex('\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}');
    expect(matrix?.value).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });
});
