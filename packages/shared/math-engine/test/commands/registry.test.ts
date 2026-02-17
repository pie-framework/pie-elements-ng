import { describe, expect, it } from 'vitest';
import { commandToLatex, isEmptyMathValue } from '../../src/commands/utils';

describe('Math command registry', () => {
  it('serializes LRN exponent commands', () => {
    expect(
      commandToLatex({
        type: 'lrnexponent',
        base: 'x',
        exponent: '12',
      })
    ).toBe('x^{12}');

    expect(
      commandToLatex({
        type: 'lrnsquaredexponent',
        base: 'x',
      })
    ).toBe('x^2');

    expect(
      commandToLatex({
        type: 'lrnsubscript',
        base: 'a',
        subscript: 'n',
      })
    ).toBe('a_n');
  });

  it('serializes matrix and symbol commands', () => {
    expect(
      commandToLatex({
        type: 'matrix',
        matrixType: 'pmatrix',
        cells: [['1', '2']],
      })
    ).toBe('\\begin{pmatrix}1&2\\end{pmatrix}');

    expect(commandToLatex({ type: 'symbol', name: 'nless' })).toBe('\\nless');
    expect(commandToLatex({ type: 'symbol', name: 'ngtr' })).toBe('\\ngtr');
  });

  it('has empty helper parity', () => {
    expect(isEmptyMathValue('')).toBe(true);
    expect(isEmptyMathValue('   ')).toBe(true);
    expect(isEmptyMathValue('x')).toBe(false);
  });
});
