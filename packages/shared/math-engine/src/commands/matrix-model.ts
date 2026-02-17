import type { MatrixCellLocation, MatrixType } from '../types';

const MAX_ROWS = 5;
const MAX_COLUMNS = 5;

function clampSize(rows: string[][]): string[][] {
  return rows.slice(0, MAX_ROWS).map((row) => row.slice(0, MAX_COLUMNS));
}

export class MatrixModel {
  private readonly kind: MatrixType;
  private cells: string[][];

  constructor(kind: MatrixType, cells: string[][]) {
    this.kind = kind;
    this.cells = clampSize(
      cells.length
        ? cells
        : [
            ['', ''],
            ['', ''],
          ]
    );
  }

  get type(): MatrixType {
    return this.kind;
  }

  get value(): string[][] {
    return this.cells.map((row) => [...row]);
  }

  insertRowAfter(location: MatrixCellLocation): void {
    if (this.cells.length >= MAX_ROWS) {
      return;
    }

    const width = this.cells[location.row]?.length ?? this.cells[0]?.length ?? 1;
    const nextRow = new Array(Math.min(width, MAX_COLUMNS)).fill('');
    this.cells.splice(location.row + 1, 0, nextRow);
  }

  insertColumnAfter(location: MatrixCellLocation): void {
    const currentWidth = this.cells[0]?.length ?? 0;
    if (currentWidth >= MAX_COLUMNS) {
      return;
    }

    this.cells = this.cells.map((row) => {
      const next = [...row];
      next.splice(location.column + 1, 0, '');
      return next.slice(0, MAX_COLUMNS);
    });
  }

  deleteCellAndCleanup(location: MatrixCellLocation): void {
    const row = this.cells[location.row];
    if (!row) {
      return;
    }

    row[location.column] = '';

    const isRowEmpty = (values: string[]): boolean => values.every((entry) => entry.trim() === '');
    const isColumnEmpty = (column: number): boolean =>
      this.cells.every((rowValues) => (rowValues[column] ?? '').trim() === '');

    if (this.cells.length > 1 && isRowEmpty(row)) {
      this.cells.splice(location.row, 1);
    }

    const width = this.cells[0]?.length ?? 0;
    for (let col = width - 1; col >= 0; col -= 1) {
      if (width > 1 && isColumnEmpty(col)) {
        this.cells = this.cells.map((rowValues) => {
          const next = [...rowValues];
          next.splice(col, 1);
          return next;
        });
      }
    }

    this.cells = this.cells.map((rowValues) => (rowValues.length === 0 ? [''] : rowValues));
    if (this.cells.length === 0) {
      this.cells = [['']];
    }

    this.cells = clampSize(this.cells);
  }

  toLatex(): string {
    const rows = this.cells.map((row) => row.map((entry) => entry || ' ').join('&')).join('\\\\');
    return `\\begin{${this.kind}}${rows}\\end{${this.kind}}`;
  }

  static fromLatex(latex: string): MatrixModel | null {
    const out = latex.match(
      /^\\begin\{(pmatrix|bmatrix|vmatrix|Bmatrix|Vmatrix)\}([\s\S]*?)\\end\{\1\}$/
    );
    if (!out) {
      return null;
    }

    const kind = out[1] as MatrixType;
    const content = out[2] ?? '';
    const rows = content.split('\\\\').map((row) => row.split('&'));
    return new MatrixModel(kind, rows);
  }
}
