/**
 * Matrix Commands (PIE) - FULL IMPLEMENTATION
 *
 * Source: PIE fork (2019)
 * File: src/legacy/mathquill-bundle.js lines 6543-6985
 *
 * Adds full support for LaTeX matrix commands with all advanced features:
 * - \pmatrix: Matrix with parentheses ()
 * - \bmatrix: Matrix with square brackets []
 * - \vmatrix: Matrix with vertical bars ||
 * - \Bmatrix: Matrix with curly braces {}
 * - \Vmatrix: Matrix with double vertical bars ‖‖
 *
 * Features:
 * - Dynamic matrix sizing (NxM up to 5×5)
 * - Shift-Enter to insert rows
 * - Shift-Space to insert columns
 * - Auto-cleanup of empty rows/columns on deletion
 * - Arrow key navigation (including wrap-around)
 * - Full LaTeX parsing and generation
 * - Parentheses/bracket scaling based on content
 */

import type { MathQuillInterface } from 'mathquill';
import './styles.css';

export function addMatrixCommands(MQ: MathQuillInterface): void {
  const mqInternal = MQ as any;

  if (!mqInternal.L?.LatexCmds) {
    console.warn('MathQuill internals not accessible for matrix commands');
    return;
  }

  const {
    LatexCmds,
    MathCommand,
    MathBlock,
    Parser,
    DOMView,
    h,
    L,
    R,
    latexMathParser,
    NodeBase,
  } = mqInternal.L;

  if (!MathCommand || !MathBlock || !Parser || !DOMView || !h) {
    console.warn('Required MathQuill internals not available for matrices');
    return;
  }

  // Constants for row/column delimiters
  const delimiters = {
    column: '&',
    row: '\\\\',
  };

  /**
   * MatrixCell - A cell within a matrix
   * Extends MathBlock to add row/column tracking and custom keyboard handling
   */
  class MatrixCell extends MathBlock {
    column: number = 0;
    row: number = 0;

    constructor(column?: number, row?: number) {
      super();
      if (column !== undefined) this.column = column;
      if (row !== undefined) this.row = row;
    }

    keystroke(key: string, e: KeyboardEvent | undefined, ctrlr: any) {
      switch (key) {
        case 'Shift-Spacebar':
          e?.preventDefault();
          this.parent.insertColumn(this);
          return;
        case 'Shift-Enter':
          this.parent.insertRow(this);
          return;
      }
      return super.keystroke(key, e, ctrlr);
    }

    deleteOutOf(dir: any, cursor: any) {
      const args = arguments;
      this.parent.backspace(this, dir, cursor, () => {
        // called when last cell gets deleted
        return super.deleteOutOf.apply(this, args as any);
      });
    }
  }

  /**
   * Matrix - Base class for all matrix types
   * Handles dynamic sizing, cell management, and LaTeX parsing/generation
   */
  class Matrix extends MathCommand {
    ctrlSeq: string = '\\matrix';
    parentheses: { left: string | null; right: string | null } = {
      left: null,
      right: null,
    };
    maximum = { rows: 5, columns: 5 };
    defaults = { rows: 2, columns: 2 };
    cursor: any;
    defaultHtmlTemplate?: string;
    htmlTemplate?: string;

    constructor(
      ctrlSeq: string,
      parentheses: { left: string | null; right: string | null }
    ) {
      super();
      this.ctrlSeq = ctrlSeq;
      this.parentheses = parentheses;
    }

    /**
     * Generate HTML template for matrix with given dimensions
     */
    generateHtmlTemplate(numRows: number, numColumns: number): string {
      const parenTemplate = (paren: string | null) =>
        paren ? `<span class="mq-paren mq-scaled">${paren}</span>` : '';

      numRows = Math.min(numRows, this.maximum.rows);
      numColumns = Math.min(numColumns, this.maximum.columns);

      let matrix = '<span class="mq-matrix mq-non-leaf">';
      matrix += parenTemplate(this.parentheses.left);
      matrix += '<table class="mq-non-leaf">';

      let count = 0;
      for (let row = 0; row < numRows; row++) {
        matrix += '<tr>';
        for (let col = 0; col < numColumns; col++) {
          matrix += `<td>&${count}</td>`;
          count++;
        }
        matrix += '</tr>';
      }

      matrix += '</table>';
      matrix += parenTemplate(this.parentheses.right);
      matrix += '</span>';

      return matrix;
    }

    /**
     * Create blocks from HTML template
     * Parses &0, &1, &2... placeholders and creates MatrixCell for each
     */
    createBlocks() {
      const blocks: any[] = (this.blocks = []);
      let prevRow: number | undefined;
      let column: number = 0;
      let i = 0;

      const template = this.htmlTemplate || '';

      template.replace(/&\d+/g, (match, index) => {
        const beforeMatch = template.substring(0, index);
        const row = (beforeMatch.match(/<tr[^>]*>/gi) || []).length - 1;
        column = prevRow === row ? column + 1 : 0;

        blocks[i] = new MatrixCell(column, row);
        blocks[i].adopt(this, this.ends[R], 0);
        prevRow = row;
        i++;
        return match;
      });
    }

    /**
     * Create matrix when inserting into document
     */
    createLeftOf(cursor: any) {
      this.cursor = cursor;

      const rows = Math.min(this.defaults.rows, this.maximum.rows);
      const columns = Math.min(this.defaults.columns, this.maximum.columns);

      this.defaultHtmlTemplate =
        this.defaultHtmlTemplate || this.generateHtmlTemplate(rows, columns);
      this.htmlTemplate = this.defaultHtmlTemplate;

      super.createLeftOf(cursor);
    }

    /**
     * Get matrix name (e.g., "pmatrix", "bmatrix")
     */
    getMatrixName(): string {
      return this.ctrlSeq.replace('\\', '');
    }

    /**
     * Generate LaTeX from matrix content
     */
    latex(): string {
      const matrixName = this.getMatrixName();
      let latex = `\\begin{${matrixName}}`;
      let thisRow: number;
      let row: number | undefined;

      const blocks = this.blocks || [];
      for (let i = 0; i < blocks.length; i++) {
        thisRow = blocks[i].row;

        if (row !== undefined) {
          if (row !== thisRow) {
            latex += delimiters.row;
          } else {
            latex += delimiters.column;
          }
        }

        row = thisRow;
        latex += blocks[i].latex();
      }

      latex += `\\end{${matrixName}}`;
      return latex;
    }

    /**
     * Override latexRecursive for consistent LaTeX generation
     */
    latexRecursive(ctx: any) {
      this.checkCursorContextOpen(ctx);
      ctx.uncleanedLatex += this.latex();
      this.checkCursorContextClose(ctx);
    }

    /**
     * Parse LaTeX matrix notation
     * Handles: \begin{matrix}1&2\\3&4\end{matrix}
     */
    parser() {
      const matrixName = this.getMatrixName();
      const rgxContents = new RegExp(`^(.*?)\\\\end{${matrixName}}`);
      const rgxEnd = new RegExp(`\\\\end{${matrixName}}`);

      return Parser.regex(rgxContents).then((content: string) => {
        // Strip out the trailing \end{matrix} command
        content = content.replace(rgxEnd, '');

        // Parse rows and columns
        const blocks: any[] = [];
        const rows = content.split(delimiters.row);
        const numRows = Math.min(rows.length, this.maximum.rows);
        let numColumns = 0;

        // Get maximum number of columns
        for (let i = 0; i < numRows; i++) {
          const columns = rows[i].split(delimiters.column);
          numColumns = Math.max(numColumns, columns.length);
        }
        numColumns = Math.min(numColumns, this.maximum.columns);

        // Parse each cell
        for (let i = 0; i < numRows; i++) {
          const columns = rows[i].split(delimiters.column);
          for (let a = 0; a < numColumns; a++) {
            const block = new MatrixCell(a, i);
            const tmpBlock = latexMathParser.parse(columns[a] || ' ');

            // Transfer children from parsed block to matrix cell
            tmpBlock.children().adopt(block, block.ends[R], 0);
            blocks.push(block);
          }
        }

        // Generate HTML template for this matrix size
        this.htmlTemplate = this.generateHtmlTemplate(numRows, numColumns);

        // Attach blocks to parent matrix
        this.blocks = blocks;
        for (let i = 0; i < blocks.length; i++) {
          blocks[i].adopt(this, this.ends[R], 0);
        }

        return Parser.succeed(this);
      });
    }

    /**
     * Finalize tree after DOM changes
     * Updates row count CSS class and relinks cells
     */
    finalizeTree() {
      const domFrag = this.domFrag();
      const el = domFrag.oneElement?.() || domFrag.firstChild;
      if (!el) return;

      const table = (el as Element).querySelector('table');
      if (!table) return;

      this.relink();

      // Update mq-rows-<number> class
      const rowCount = table.querySelectorAll('tr').length;
      table.className = table.className.replace(/mq-rows-\d+/g, '');
      table.classList.add(`mq-rows-${rowCount}`);
    }

    /**
     * Relink cells for cursor navigation
     * Sets up horizontal ([L], [R]) and vertical (upOutOf, downOutOf) navigation
     */
    relink() {
      const domFrag = this.domFrag();
      const el = domFrag.oneElement?.() || domFrag.firstChild;
      if (!el) return;

      const allCells = Array.from((el as Element).querySelectorAll('td'));
      if (allCells.length === 0) return;

      const firstCellBlock = NodeBase.getNodeOfElement(allCells[0]);
      const lastCellBlock = NodeBase.getNodeOfElement(allCells[allCells.length - 1]);
      const firstRow = allCells[0]?.closest('tr');
      const blocks: any[] = [];

      allCells.forEach((cellEl, cellIndex) => {
        const cellBlock = NodeBase.getNodeOfElement(cellEl);
        if (!cellBlock) return;

        const tr = cellEl.closest('tr');
        if (!tr) return;

        const nextCell = allCells[cellIndex + 1];
        const nextRow = tr.nextElementSibling as HTMLTableRowElement | null;
        const indexInRow = Array.from(tr.children).indexOf(cellEl);
        const indexInColumn = Array.from(
          (tr.parentElement as HTMLTableSectionElement).children
        ).indexOf(tr);

        // Horizontal linkage
        if (nextCell) {
          const nextCellBlock = NodeBase.getNodeOfElement(nextCell);
          if (nextCellBlock) {
            cellBlock[R] = nextCellBlock;
            nextCellBlock[L] = cellBlock;
          }
        }

        // Vertical linkage
        let downCell: Element | null = null;
        if (nextRow) {
          downCell = nextRow.children[indexInRow] as HTMLTableCellElement;
        } else {
          // Wrap to top of next column
          if (firstRow) {
            downCell = firstRow.children[indexInRow + 1] as HTMLTableCellElement;
          }
        }

        if (downCell) {
          const downCellBlock = NodeBase.getNodeOfElement(downCell);
          if (downCellBlock) {
            cellBlock.downOutOf = downCellBlock;
            downCellBlock.upOutOf = cellBlock;
          }
        }

        cellBlock.column = indexInRow;
        cellBlock.row = indexInColumn;
        blocks.push(cellBlock);
      });

      // Set matrix ends
      this.setEnds({ [L]: firstCellBlock, [R]: lastCellBlock });

      // Clean up stray linkage
      if (firstCellBlock && firstCellBlock[L]) {
        delete firstCellBlock[L];
      }
      if (lastCellBlock && lastCellBlock[R]) {
        delete lastCellBlock[R];
      }

      this.blocks = blocks;
    }

    /**
     * Delete a cell and clean up empty rows/columns
     */
    deleteCell(cell: any): any {
      const domFrag = this.domFrag();
      const el = domFrag.oneElement?.() || domFrag.firstChild;
      if (!el) return;

      const cellEl = cell.domFrag().oneElement?.() || cell.domFrag().firstChild;
      if (!cellEl) return;

      const row = cellEl.closest('tr');
      if (!row) return;

      const indexInRow = Array.from(row.children).indexOf(cellEl);
      const indexInColumn = Array.from(
        (row.parentElement as HTMLTableSectionElement).children
      ).indexOf(row);

      const rowCells = Array.from(row.children).filter((c) => c !== cellEl);
      const table = (el as Element).querySelector('table');
      if (!table) return;

      const allRows = Array.from(table.querySelectorAll('tr'));
      const colCells = allRows
        .filter((r) => r !== row)
        .map((r) => r.children[indexInRow])
        .filter(Boolean);

      const allCells = Array.from((el as Element).querySelectorAll('td'));
      const isLastBlock = allCells.length === 1;

      function isEmpty(td: unknown): boolean {
        const cellBlock = NodeBase.getNodeOfElement(td as Element);
        return cellBlock ? cellBlock.isEmpty() : true;
      }

      let otherBlock: any;

      // Check if row is empty
      if (rowCells.every(isEmpty) && colCells.length > 0) {
        rowCells.forEach((c) => (c as HTMLElement).remove());
        cellEl.remove();
        row.remove();
        this.finalizeTree();
      }

      // Check if column is empty
      if (colCells.every(isEmpty) && rowCells.length > 0) {
        colCells.forEach((c) => (c as HTMLElement).remove());
        cellEl.remove();
        this.finalizeTree();
      }

      // Find next block to focus
      if (!isLastBlock) {
        const rows = Array.from((el as Element).querySelectorAll('tr'));
        const newIndexInColumn = Math.min(indexInColumn, rows.length - 1);
        const targetRow = rows[newIndexInColumn];
        if (targetRow) {
          const cells = Array.from(targetRow.children);
          const newIndexInRow = Math.min(indexInRow, cells.length - 1);
          const targetCell = cells[newIndexInRow];
          if (targetCell) {
            otherBlock = NodeBase.getNodeOfElement(targetCell);
          }
        }
      }

      return otherBlock;
    }

    /**
     * Handle backspace in matrix cell
     */
    backspace(currentBlock: any, _dir: any, cursor: any, finalDeleteCallback: () => void) {
      if (currentBlock.isEmpty()) {
        const otherBlock = this.deleteCell(currentBlock);

        if (otherBlock) {
          cursor.insAtRightEnd(otherBlock);
        } else {
          finalDeleteCallback();
          this.finalizeTree();
        }
        this.bubble('edited');
      }
    }

    /**
     * Add a new row after the given row
     */
    addRow(prevRow: HTMLTableRowElement): any {
      const domFrag = this.domFrag();
      const el = domFrag.oneElement?.() || domFrag.firstChild;
      if (!el) return;

      const table = (el as Element).querySelector('table');
      if (!table) return;

      // Check row limit
      if (table.querySelectorAll('tr').length >= this.maximum.rows) {
        return;
      }

      const numCols = prevRow.children.length;
      const newRow = document.createElement('tr');
      let firstNewBlock: any;

      for (let i = 0; i < numCols; i++) {
        const newBlock = new MatrixCell();
        newBlock.parent = this;

        const newTd = document.createElement('td');
        newTd.className = 'mq-empty';
        newTd.setAttribute('mathquill-block-id', newBlock.id.toString());
        NodeBase.linkElementByBlockNode(newTd, newBlock);
        newBlock.setDOM(newTd);

        newRow.appendChild(newTd);
        firstNewBlock = firstNewBlock || newBlock;
      }

      prevRow.after(newRow);
      return firstNewBlock;
    }

    /**
     * Add a new column after the given cell
     */
    addColumn(prevCell: HTMLTableCellElement): any {
      const domFrag = this.domFrag();
      const el = domFrag.oneElement?.() || domFrag.firstChild;
      if (!el) return;

      const tr = prevCell.closest('tr');
      if (!tr) return;

      // Check column limit
      if (tr.children.length >= this.maximum.columns) {
        return;
      }

      const index = Array.from(tr.children).indexOf(prevCell);
      const rowIndex = Array.from(
        (tr.parentElement as HTMLTableSectionElement).children
      ).indexOf(tr);

      const table = (el as Element).querySelector('table');
      if (!table) return;

      const allRows = Array.from(table.querySelectorAll('tr'));
      const newBlocks: any[] = [];

      allRows.forEach((row) => {
        const newBlock = new MatrixCell();
        newBlock.parent = this;

        const newTd = document.createElement('td');
        newTd.className = 'mq-empty';
        newTd.setAttribute('mathquill-block-id', newBlock.id.toString());
        NodeBase.linkElementByBlockNode(newTd, newBlock);
        newBlock.setDOM(newTd);

        const targetCell = row.children[index];
        if (targetCell) {
          targetCell.after(newTd);
        }

        newBlocks.push(newBlock);
      });

      return newBlocks[rowIndex];
    }

    /**
     * Insert a new column (triggered by Shift-Space)
     */
    insertColumn(currentBlock: any) {
      const cellEl =
        currentBlock.domFrag().oneElement?.() || currentBlock.domFrag().firstChild;
      if (!cellEl) return;

      const newBlock = this.addColumn(cellEl);
      if (newBlock) {
        this.cursor = this.cursor || this.parent.cursor;
        this.finalizeTree();
        this.bubble('reflow');
        this.cursor.insAtRightEnd(newBlock);
      }
    }

    /**
     * Insert a new row (triggered by Shift-Enter)
     */
    insertRow(currentBlock: any) {
      const cellEl =
        currentBlock.domFrag().oneElement?.() || currentBlock.domFrag().firstChild;
      if (!cellEl) return;

      const row = cellEl.closest('tr');
      if (!row) return;

      const newBlock = this.addRow(row);
      if (newBlock) {
        this.cursor = this.cursor || this.parent.cursor;
        this.finalizeTree();
        this.bubble('reflow');
        this.cursor.insAtRightEnd(newBlock);
      }
    }

    /**
     * Reflow matrix - scale parentheses based on content height
     */
    reflow() {
      const domFrag = this.domFrag();
      const el = domFrag.oneElement?.() || domFrag.firstChild;
      if (!el) return;

      const table = (el as Element).querySelector('table');
      if (!table) return;

      // Get table height in em units
      const rect = table.getBoundingClientRect();
      const fontSize = parseFloat(getComputedStyle(table).fontSize);
      const height = rect.height / fontSize;

      // Scale parentheses
      const parens = (el as Element).querySelectorAll('.mq-paren');
      if (parens.length > 0) {
        const scale = Math.min(1 + 0.2 * (height - 1), 1.2);
        const verticalScale = 1.05 * height;

        parens.forEach((paren) => {
          (paren as HTMLElement).style.transform = `scale(${scale}, ${verticalScale})`;
        });
      }
    }
  }

  // Register matrix types
  if (!LatexCmds.pmatrix) {
    LatexCmds.pmatrix = class extends Matrix {
      constructor() {
        super('\\pmatrix', { left: '(', right: ')' });
      }
    };
  }

  if (!LatexCmds.bmatrix) {
    LatexCmds.bmatrix = class extends Matrix {
      constructor() {
        super('\\bmatrix', { left: '[', right: ']' });
      }
    };
  }

  if (!LatexCmds.vmatrix) {
    LatexCmds.vmatrix = class extends Matrix {
      constructor() {
        super('\\vmatrix', { left: '|', right: '|' });
      }
    };
  }

  if (!LatexCmds.Bmatrix) {
    LatexCmds.Bmatrix = class extends Matrix {
      constructor() {
        super('\\Bmatrix', { left: '{', right: '}' });
      }
    };
  }

  if (!LatexCmds.Vmatrix) {
    LatexCmds.Vmatrix = class extends Matrix {
      constructor() {
        super('\\Vmatrix', { left: '‖', right: '‖' });
      }
    };
  }

  console.info('Matrix commands registered (FULL implementation)');
  console.info('Features: Dynamic sizing, Shift-Enter/Space, auto-cleanup, navigation');
}
