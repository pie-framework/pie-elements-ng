/**
 * MathJax typesets the MathML elementary-math elements only through its experimental `mml3`
 * extension, an XSLT transform that depends on the browser's `XSLTProcessor`, which Chrome is
 * removing. Without it, `mstack` and `mlongdiv` are a "Math input error". This module rewrites both
 * into the `mtable` they describe before MathJax reads them: one column per digit, lines as cell
 * borders, and carries as zero-width scripts on the digit they annotate.
 *
 * Layout follows MathML 4 §3.6. A column is numbered from the stack's alignment point, so cell `i` of
 * a row sits in column `i - anchor - position`, where `anchor` counts the row's cells left of that
 * point and a positive `position` moves the row towards the tens digit.
 */

import { MATHML_NS } from './mathml.js';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface Cell {
  content: Element | null;
  borders: Partial<Record<Side, string>>;
  align?: string;
}

/** A row of 'digits', each in its own column. A `null` cell is an empty column. */
interface DigitRow {
  kind: 'digits';
  cells: (Element | null)[];
  anchor: number;
  position: number;
}

interface Carry {
  content: Element | null;
  location: string;
  crossout: string[];
}

/** Carries, borrows and crossouts for the next digit row. A `null` entry carries nothing. */
interface CarriesRow {
  kind: 'carries';
  carries: (Carry | null)[];
  anchor: number;
  position: number;
  scale: string;
}

/** A line, drawn on the next digit row's cells. A `length` of 0 spans the stack. */
interface LineRow {
  kind: 'line';
  length: number;
  anchor: number;
  position: number;
  border: string;
}

type StackRow = DigitRow | CarriesRow | LineRow;

interface Stack {
  document: Document;
  stackAlign: string;
  decimalPoint: string;
}

interface Layout {
  rows: Cell[][];
  /** Each digit row's table row. */
  rowOf: Map<DigitRow, number>;
  /** The table column of column 0. */
  origin: number;
}

const CROSSOUTS = new Set([
  'updiagonalstrike',
  'downdiagonalstrike',
  'verticalstrike',
  'horizontalstrike',
]);
const LINE_THICKNESS: Record<string, string> = {
  thin: '0.035em',
  medium: '0.07em',
  thick: '0.14em',
};
const CHAR_SPACING: Record<string, string> = { tight: '0em', medium: '0.1em', loose: '0.2em' };
const LENGTH = /^(\d+(\.\d*)?|\.\d+)(em|ex|px|pt|pc|in|cm|mm)$/;
const COLOR = /^(#[0-9a-f]{3,8}|[a-z]+)$/i;
const NUMBER = /^(\d+(\.\d*)?|\.\d+)$/;
const TOKENS = new Set(['mn', 'mo', 'mi', 'mtext']);
/** The stacking attributes, which an `mtable` does not take. */
const STACK_ATTRIBUTES = new Set(['stackalign', 'charalign', 'charspacing', 'longdivstyle']);

function create(
  document: Document,
  name: string,
  children: (Element | null)[] = [],
  attributes: Record<string, string> = {}
): Element {
  const element = document.createElementNS(MATHML_NS, name);
  for (const [attribute, value] of Object.entries(attributes)) {
    element.setAttribute(attribute, value);
  }
  for (const child of children) if (child) element.appendChild(child);
  return element;
}

function operator(stack: Stack, text: string): Element {
  const mo = create(stack.document, 'mo');
  mo.textContent = text;
  return mo;
}

/** An empty column's stand-in, with the width of a 0 as MathML gives empty columns. */
function zeroPhantom(stack: Stack): Element {
  const mn = create(stack.document, 'mn');
  mn.textContent = '0';
  return create(stack.document, 'mphantom', [mn]);
}

/** An attribute keyword, compared ASCII case-insensitively as MathML specifies. */
function keyword(element: Element, name: string): string | undefined {
  return element.getAttribute(name)?.trim().toLowerCase() || undefined;
}

function integer(element: Element, name: string): number {
  const value = Number.parseInt(element.getAttribute(name) ?? '', 10);
  return Number.isFinite(value) ? value : 0;
}

function isEmpty(element: Element): boolean {
  return (
    element.localName === 'none' ||
    (element.localName === 'mrow' && element.children.length === 0 && !element.textContent?.trim())
  );
}

/** The anchor of a row of `count` cells, `decimal` being where its decimal point falls. */
function anchorOf(count: number, stackAlign: string, decimal = count): number {
  switch (stackAlign) {
    case 'left':
      return 0;
    case 'center':
      return Math.floor(count / 2);
    case 'right':
      return count;
    default:
      return decimal;
  }
}

/**
 * Splits each `mn` into digits and keeps every other child as one digit, an `mstyle` passing its
 * children through with its style. The decimal point is the first cell holding the decimalpoint
 * character, or else implied right of the first number.
 */
function digitRow(children: Element[], position: number, stack: Stack): DigitRow {
  const cells: (Element | null)[] = [];
  let decimal: number | undefined;
  let numberEnd: number | undefined;

  const add = (child: Element, styles: Element[]) => {
    const styled = (content: Element) =>
      styles.reduceRight((inner, style) => {
        const outer = style.cloneNode(false) as Element;
        outer.appendChild(inner);
        return outer;
      }, content);

    if (child.localName === 'mstyle') {
      for (const grandchild of [...child.children]) add(grandchild, [...styles, child]);
    } else if (isEmpty(child)) {
      cells.push(null);
    } else if (child.localName === 'mn' && child.children.length === 0) {
      const digits = [...(child.textContent ?? '').trim()];
      for (const digit of digits) {
        if (digit === stack.decimalPoint) decimal ??= cells.length;
        const mn = child.cloneNode(false) as Element;
        mn.textContent = digit;
        cells.push(styled(mn));
      }
      if (digits.length) numberEnd ??= cells.length;
    } else {
      if (TOKENS.has(child.localName) && child.textContent?.trim() === stack.decimalPoint) {
        decimal ??= cells.length;
      }
      cells.push(styled(child));
    }
  };
  for (const child of children) add(child, []);

  return {
    kind: 'digits',
    cells,
    anchor: anchorOf(cells.length, stack.stackAlign, decimal ?? numberEnd),
    position,
  };
}

function crossouts(value: string | null): string[] {
  return (value ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter((notation) => CROSSOUTS.has(notation));
}

function contentOf(element: Element, stack: Stack): Element | null {
  const children = [...element.children].filter((child) => !isEmpty(child));
  if (children.length <= 1) return children[0] ?? null;
  return create(stack.document, 'mrow', children);
}

function carriesRow(element: Element, position: number, stack: Stack): CarriesRow {
  const location = keyword(element, 'location') ?? 'n';
  const crossout = crossouts(element.getAttribute('crossout'));
  const carries = [...element.children].map((child): Carry | null => {
    if (isEmpty(child)) return null;
    if (child.localName !== 'mscarry') return { content: child, location, crossout };
    return {
      content: contentOf(child, stack),
      location: keyword(child, 'location') ?? location,
      crossout: child.hasAttribute('crossout')
        ? crossouts(child.getAttribute('crossout'))
        : crossout,
    };
  });
  const scale = element.getAttribute('scriptsizemultiplier')?.trim() ?? '';
  return {
    kind: 'carries',
    carries,
    anchor: anchorOf(carries.length, stack.stackAlign),
    position,
    scale: NUMBER.test(scale) ? scale : '0.6',
  };
}

function lineBorder(element: Element): string {
  const thickness = keyword(element, 'mslinethickness') ?? 'medium';
  const width = LINE_THICKNESS[thickness] ?? (LENGTH.test(thickness) ? thickness : '0.07em');
  const color = element.getAttribute('mathcolor')?.trim() ?? '';
  return `${width} solid ${COLOR.test(color) ? color : 'currentColor'}`;
}

function lineRow(element: Element, position: number, stack: Stack): LineRow {
  const length = Math.max(0, integer(element, 'length'));
  return {
    kind: 'line',
    length,
    anchor: anchorOf(length, stack.stackAlign),
    position,
    border: lineBorder(element),
  };
}

/**
 * The rows of a stack's children, each group's position and shift applied. An `mrow` that stands
 * for a whole row is read as one, where the spec makes it a single digit: that would put a number
 * grouped in an `mrow`, a long division's result typically, in one column.
 */
function collectRows(
  children: Element[],
  position: number,
  shift: number,
  stack: Stack,
  rows: StackRow[]
): void {
  children.forEach((child, index) => {
    const at = position + index * shift + integer(child, 'position');
    switch (child.localName) {
      case 'msgroup':
        collectRows([...child.children], at, integer(child, 'shift'), stack, rows);
        break;
      case 'msline':
        rows.push(lineRow(child, at, stack));
        break;
      case 'mscarries':
        rows.push(carriesRow(child, at, stack));
        break;
      case 'msrow':
      case 'mrow':
        rows.push(digitRow([...child.children], at, stack));
        break;
      default:
        rows.push(digitRow([child], at, stack));
    }
  });
}

function firstColumn(row: StackRow): number {
  return -row.anchor - row.position;
}

function widthOf(row: StackRow): number {
  if (row.kind === 'digits') return row.cells.length;
  if (row.kind === 'carries') return row.carries.length;
  return row.length;
}

function lastColumn(row: StackRow): number {
  return firstColumn(row) + widthOf(row) - 1;
}

function placeCarry(base: Element, script: Element, location: string, stack: Stack): Element {
  const zeroWidth = (lspace?: string) =>
    create(stack.document, 'mpadded', [script], { width: '0', ...(lspace ? { lspace } : {}) });
  const element = (name: string, children: Element[]) => create(stack.document, name, children);
  switch (location) {
    case 's':
      return element('munder', [base, zeroWidth('-0.5width')]);
    case 'ne':
      return element('msup', [base, zeroWidth()]);
    case 'se':
      return element('msub', [base, zeroWidth()]);
    case 'nw':
      return element('mmultiscripts', [
        base,
        element('mprescripts', []),
        element('none', []),
        zeroWidth('-1width'),
      ]);
    case 'sw':
      return element('mmultiscripts', [
        base,
        element('mprescripts', []),
        zeroWidth('-1width'),
        element('none', []),
      ]);
    case 'w':
      script.setAttribute('scriptlevel', '+1');
      return element('mrow', [zeroWidth('-1width'), base]);
    case 'e':
      script.setAttribute('scriptlevel', '+1');
      return element('mrow', [base, zeroWidth()]);
    default:
      return element('mover', [base, zeroWidth('-0.5width')]);
  }
}

/**
 * Strikes through a digit without widening its column. MathJax pads a `menclose` on the sides its
 * notations draw over, by the padding plus, for a diagonal, the rule thickness; both are pinned here
 * and the horizontal part taken back, so the strike overhangs the neighbouring columns.
 */
function crossOut(base: Element, notations: string[], stack: Stack): Element {
  const menclose = create(stack.document, 'menclose', [base], {
    notation: notations.join(' '),
    'data-padding': '0.1em',
    'data-thickness': '0.067em',
  });
  const overhang = notations.some((notation) => notation.endsWith('diagonalstrike'))
    ? 0.167
    : notations.includes('horizontalstrike')
      ? 0.1
      : 0;
  if (!overhang) return menclose;
  return create(stack.document, 'mpadded', [menclose], {
    lspace: `-${overhang}em`,
    width: `-${2 * overhang}em`,
  });
}

function attachCarry(
  base: Element | null,
  carry: Carry,
  location: string,
  scale: string,
  stack: Stack
): Element | null {
  const crossed = base && carry.crossout.length ? crossOut(base, carry.crossout, stack) : base;
  if (!carry.content) return crossed;
  const script = create(stack.document, 'mstyle', [carry.content], {
    scriptsizemultiplier: scale,
  });
  return placeCarry(crossed ?? zeroPhantom(stack), script, location, stack);
}

function carryAt(row: CarriesRow, column: number): Carry | null {
  return row.carries[column - firstColumn(row)] ?? null;
}

/**
 * Attaches each carries row to the column below it: the nearest row to the digit, and each earlier
 * row above the carry of the row after it, as MathML stacks adjacent carries.
 */
function annotate(cell: Cell, column: number, carries: CarriesRow[], stack: Stack): void {
  let content = cell.content;
  carries.forEach((_, offset) => {
    const index = carries.length - 1 - offset;
    const row = carries[index];
    const carry = carryAt(row, column);
    const above = carries.slice(0, index).some((earlier) => carryAt(earlier, column));
    if (!carry && !above) return;
    const placed = carry ?? { content: zeroPhantom(stack), location: 'n', crossout: [] };
    const location = offset === 0 ? placed.location : 'n';
    content = attachCarry(content, placed, location, row.scale, stack);
  });
  cell.content = content;
}

function layout(rows: StackRow[], stack: Stack): Layout {
  const spanned = rows.filter((row) => widthOf(row) > 0);
  const first = Math.min(0, ...spanned.map(firstColumn));
  const last = Math.max(first, ...spanned.map(lastColumn));
  const width = last - first + 1;
  const origin = -first;
  const table: Cell[][] = [];
  const rowOf = new Map<DigitRow, number>();
  const emptyRow = (): Cell[] =>
    Array.from({ length: width }, () => ({ content: null, borders: {} }));
  const columnsOf = (line: LineRow) =>
    line.length === 0
      ? Array.from({ length: width }, (_, column) => column)
      : Array.from({ length: line.length }, (_, i) => origin + firstColumn(line) + i);

  let carries: CarriesRow[] = [];
  let lines: LineRow[] = [];
  const place = (row: DigitRow) => {
    const cells = emptyRow();
    row.cells.forEach((content, i) => {
      cells[origin + firstColumn(row) + i].content = content;
    });
    if (carries.length) {
      cells.forEach((cell, column) => {
        annotate(cell, column - origin, carries, stack);
      });
    }
    for (const line of lines) {
      for (const column of columnsOf(line)) cells[column].borders.top = line.border;
    }
    carries = [];
    lines = [];
    rowOf.set(row, table.length);
    table.push(cells);
  };

  for (const row of rows) {
    if (row.kind === 'digits') place(row);
    else if (row.kind === 'carries') carries.push(row);
    else lines.push(row);
  }
  // Carries end a stack only in error; they annotate an empty row.
  if (carries.length || !table.length) {
    place({ kind: 'digits', cells: [], anchor: 0, position: 0 });
  }
  const bottom = table[table.length - 1];
  for (const line of lines) {
    for (const column of columnsOf(line)) bottom[column].borders.bottom = line.border;
  }
  return { rows: table, rowOf, origin };
}

function toTable(source: Element, { rows }: Layout, stack: Stack): Element {
  const table = create(
    stack.document,
    'mtable',
    rows.map((cells) =>
      create(
        stack.document,
        'mtr',
        cells.map((cell) => {
          const style = Object.entries(cell.borders)
            .map(([side, border]) => `border-${side}:${border}`)
            .join(';');
          return create(stack.document, 'mtd', [cell.content], {
            ...(style ? { style } : {}),
            ...(cell.align ? { columnalign: cell.align } : {}),
          });
        })
      )
    )
  );
  for (const { name, value } of [...source.attributes]) {
    if (!STACK_ATTRIBUTES.has(name)) table.setAttribute(name, value);
  }
  const charSpacing = keyword(source, 'charspacing') ?? 'medium';
  const charAlign = keyword(source, 'charalign');
  table.setAttribute(
    'columnspacing',
    CHAR_SPACING[charSpacing] ?? (LENGTH.test(charSpacing) ? charSpacing : CHAR_SPACING.medium)
  );
  table.setAttribute(
    'columnalign',
    charAlign === 'left' || charAlign === 'center' ? charAlign : 'right'
  );
  table.setAttribute('rowspacing', '0');
  table.setAttribute('align', source.getAttribute('align') ?? 'baseline');
  return table;
}

function stackOf(element: Element): Stack {
  return {
    document: element.ownerDocument,
    stackAlign: keyword(element, 'stackalign') ?? 'decimalpoint',
    decimalPoint:
      element.closest('[decimalpoint]')?.getAttribute('decimalpoint')?.trim().charAt(0) || '.',
  };
}

function rewriteStack(element: Element): Element {
  const stack = stackOf(element);
  const rows: StackRow[] = [];
  collectRows([...element.children], 0, 0, stack, rows);
  return toTable(element, layout(rows, stack), stack);
}

/** Draws `border` on `side` of the cells of table row `row` from column `from` to `to`. */
function rule(table: Cell[][], row: number, from: number, to: number, side: Side, border: string) {
  for (let column = from; column <= to; column++) table[row][column].borders[side] = border;
}

/** The divisor and bracket of a US long division, the bracket raised to meet the vinculum. */
function longDivisionBracket(divisor: Element | null, stack: Stack): Element[] {
  const bracket = operator(stack, ')');
  bracket.setAttribute('minsize', '1.2em');
  return [
    create(stack.document, 'mrow', [
      divisor,
      create(stack.document, 'mspace', [], { width: '0.2em' }),
    ]),
    create(stack.document, 'mpadded', [bracket], {
      voffset: '0.1em',
      lspace: '-0.15em',
      depth: '-0.2em',
      height: '-0.2em',
    }),
  ];
}

/**
 * Lays out a long division in the notation `longdivstyle` names, MathML 4 §3.6.2. The first stack
 * row is the dividend. Where the notation stacks the result over the dividend it is a stack row;
 * elsewhere the divisor and result are single cells beside the dividend, or in a column beside the
 * stack.
 */
function rewriteLongDivision(element: Element): Element {
  const stack = stackOf(element);
  const [divisorElement, resultElement, ...children] = [...element.children];
  const divisor = divisorElement && !isEmpty(divisorElement) ? divisorElement : null;
  const result = resultElement && !isEmpty(resultElement) ? resultElement : null;
  const style = keyword(element, 'longdivstyle') ?? 'lefttop';
  const border = lineBorder(element);

  const rows: StackRow[] = [];
  collectRows(children, 0, 0, stack, rows);
  let dividend = rows.find((row): row is DigitRow => row.kind === 'digits');
  if (!dividend) {
    dividend = { kind: 'digits', cells: [], anchor: 0, position: 0 };
    rows.unshift(dividend);
  }
  const resultRows: StackRow[] = [];
  const prefix = (...cells: (Element | null)[]) => {
    dividend.cells.unshift(...cells);
    dividend.anchor += cells.length;
  };
  // Digits right of the dividend take their own columns, which the work below shares.
  const suffix = (...elements: (Element | null)[]) => {
    const children = elements.flatMap((element) =>
      !element ? [] : element.localName === 'mrow' ? [...element.children] : [element]
    );
    dividend.cells.push(...digitRow(children, 0, stack).cells);
  };

  switch (style) {
    case 'left/\\right':
      prefix(divisor, operator(stack, '/'));
      suffix(operator(stack, '\\'), result);
      break;
    case 'left)(right':
      prefix(divisor, operator(stack, ')'));
      suffix(operator(stack, '('), result);
      break;
    case ':right=right':
      suffix(operator(stack, ':'), divisor, operator(stack, '='), result);
      break;
    case 'righttop':
    case 'stackedleftlinetop':
    case 'lefttop':
      if (result) collectRows([result], 0, 0, stack, resultRows);
      rows.splice(rows.indexOf(dividend), 0, ...resultRows);
      if (style === 'righttop') suffix(divisor);
      else if (style === 'stackedleftlinetop') prefix(divisor);
      else prefix(...longDivisionBracket(divisor, stack));
      break;
  }

  const placed = layout(rows, stack);
  const table = placed.rows;
  const row = placed.rowOf.get(dividend) ?? 0;
  const column = (index: number) => placed.origin + firstColumn(dividend) + index;
  const lastDigit = Math.max(
    column(dividend.cells.length - 1),
    ...resultRows.map((resultRow) => placed.origin + lastColumn(resultRow))
  );

  switch (style) {
    case 'left/\\right':
    case 'left)(right':
    case ':right=right':
      break;
    case 'righttop': {
      const cell = table[row][column(dividend.cells.length - 1)];
      cell.borders.left = border;
      cell.borders.bottom = border;
      rule(table, row, column(0), column(dividend.cells.length - 1), 'top', border);
      break;
    }
    case 'stackedleftlinetop': {
      const cell = table[row][column(0)];
      cell.borders.right = border;
      cell.borders.bottom = border;
      rule(table, row, column(1), lastDigit, 'top', border);
      break;
    }
    case 'stackedrightright':
    case 'mediumstackedrightright':
    case 'shortstackedrightright':
    case 'stackedleftleft':
      besideStack(table, row, style, divisor, result, border, stack);
      break;
    default:
      // lefttop, and any notation this renderer does not handle.
      rule(table, row, column(1), lastDigit, 'top', border);
  }
  return toTable(element, placed, stack);
}

/** Puts the divisor over the result in a column beside the stack, ruled as `style` draws them. */
function besideStack(
  table: Cell[][],
  row: number,
  style: string,
  divisor: Element | null,
  result: Element | null,
  border: string,
  stack: Stack
): void {
  const left = style === 'stackedleftleft';
  const side: Side = left ? 'right' : 'left';
  const padded = (content: Element | null) =>
    content && create(stack.document, 'mpadded', [content], { lspace: '0.2em', width: '+0.4em' });
  if (table.length < row + 2) {
    table.push(table[0].map(() => ({ content: null, borders: {} })));
  }
  table.forEach((cells, index) => {
    const cell: Cell = { content: null, borders: {}, align: left ? 'right' : 'left' };
    if (index === row) {
      cell.content = padded(divisor);
      cell.borders = { [side]: border, bottom: border };
    } else if (index === row + 1) {
      cell.content = padded(result);
      if (style !== 'shortstackedrightright') cell.borders[side] = border;
    } else if (index > row + 1 && (style === 'stackedrightright' || left)) {
      cell.borders[side] = border;
    }
    if (left) cells.unshift(cell);
    else cells.push(cell);
  });
}

/**
 * Rewrites each `mstack` and `mlongdiv` in `root` as an `mtable`, leaving MathJax's output alone.
 */
export function rewriteElementaryMath(root: Element): void {
  for (const element of [...root.querySelectorAll('mstack, mlongdiv')]) {
    if (!element.closest('math') || element.closest('mjx-container')) continue;
    element.replaceWith(
      element.localName === 'mstack' ? rewriteStack(element) : rewriteLongDivision(element)
    );
  }
}
