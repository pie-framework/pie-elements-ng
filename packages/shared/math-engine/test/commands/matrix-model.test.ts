import { describe, expect, it } from 'vitest';
import { MatrixModel } from '../../src/commands/matrix-model';

describe('MatrixModel', () => {
  it('serializes supported matrix types', () => {
    const model = new MatrixModel('pmatrix', [
      ['1', '2'],
      ['3', '4'],
    ]);
    expect(model.toLatex()).toBe('\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix}');
  });

  it('adds row and column within bounds', () => {
    const model = new MatrixModel('bmatrix', [['x']]);
    model.insertRowAfter({ row: 0, column: 0 });
    model.insertColumnAfter({ row: 0, column: 0 });
    expect(model.value).toEqual([
      ['x', ''],
      ['', ''],
    ]);
  });

  it('cleans up empty rows and columns on deletion', () => {
    const model = new MatrixModel('vmatrix', [
      ['a', ''],
      ['', ''],
    ]);
    model.deleteCellAndCleanup({ row: 0, column: 0 });
    expect(model.value).toEqual([['']]);
  });

  it('parses matrix latex', () => {
    const model = MatrixModel.fromLatex('\\begin{Vmatrix}1&2\\\\3&4\\end{Vmatrix}');
    expect(model?.type).toBe('Vmatrix');
    expect(model?.value).toEqual([
      ['1', '2'],
      ['3', '4'],
    ]);
  });
});
