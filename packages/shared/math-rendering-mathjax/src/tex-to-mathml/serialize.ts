/**
 * Serializes MathJax's internal MathML as MathML Core, which browsers render without MathJax.
 * Output is compact and drops `data-*` attributes. What Core leaves out and TeX produces is
 * rewritten in Core terms: `menclose` as styled rows, a radical or a long-division bracket; table
 * alignment, spacing and rules as cell styles; and `mathvariant` letters and digits as their
 * Mathematical Alphanumeric Symbols, since Core renders only `normal`.
 */
import type { MmlNode, TextNode } from '@mathjax/src/js/core/MmlTree/MmlNode.js';
import { SerializedMmlVisitor } from '@mathjax/src/js/core/MmlTree/SerializedMmlVisitor.js';
import type { PropertyList } from '@mathjax/src/js/core/Tree/Node.js';

/** MathJax's rule thickness. */
const RULE = '0.067em';

/** The style each `menclose` notation draws with, on a row around the content. */
const NOTATION_STYLES: Record<string, string[]> = {
  box: [`border:${RULE} solid`, 'padding:0.2em'],
  roundedbox: [`border:${RULE} solid`, 'border-radius:0.4em', 'padding:0.2em'],
  circle: [`border:${RULE} solid`, 'border-radius:50%', 'padding:0.2em'],
  top: [`border-top:${RULE} solid`, 'padding-top:0.2em'],
  bottom: [`border-bottom:${RULE} solid`, 'padding-bottom:0.2em'],
  left: [`border-left:${RULE} solid`, 'padding-left:0.2em'],
  right: [`border-right:${RULE} solid`, 'padding-right:0.2em'],
  actuarial: [`border-top:${RULE} solid`, `border-right:${RULE} solid`, 'padding:0.2em'],
  madruwb: [`border-bottom:${RULE} solid`, `border-right:${RULE} solid`, 'padding:0.2em'],
};

/** The direction of the line each strike notation draws across the content. */
const STRIKES: Record<string, string> = {
  updiagonalstrike: 'to top right',
  downdiagonalstrike: 'to bottom right',
  verticalstrike: 'to right',
  horizontalstrike: 'to bottom',
};

const strike = (direction: string) => {
  const [from, to] = [`calc(50% - ${RULE} / 2)`, `calc(50% + ${RULE} / 2)`];
  return `linear-gradient(${direction},transparent ${from},currentColor ${from},currentColor ${to},transparent ${to})`;
};

/**
 * Where each `mathvariant` starts in the Mathematical Alphanumeric Symbols block, for A, a and 0,
 * and the letters encoded earlier in Letterlike Symbols instead.
 */
const VARIANTS: Record<string, { upper: number; lower: number; digit?: number; holes?: string }> = {
  bold: { upper: 0x1d400, lower: 0x1d41a, digit: 0x1d7ce },
  italic: { upper: 0x1d434, lower: 0x1d44e, holes: 'hℎ' },
  'bold-italic': { upper: 0x1d468, lower: 0x1d482 },
  script: {
    upper: 0x1d49c,
    lower: 0x1d4b6,
    holes: 'BℬEℰFℱHℋIℐLℒMℳRℛeℯgℊoℴ',
  },
  'bold-script': { upper: 0x1d4d0, lower: 0x1d4ea },
  fraktur: { upper: 0x1d504, lower: 0x1d51e, holes: 'CℭHℌIℑRℜZℨ' },
  'double-struck': {
    upper: 0x1d538,
    lower: 0x1d552,
    digit: 0x1d7d8,
    holes: 'CℂHℍNℕPℙQℚRℝZℤ',
  },
  'bold-fraktur': { upper: 0x1d56c, lower: 0x1d586 },
  'sans-serif': { upper: 0x1d5a0, lower: 0x1d5ba, digit: 0x1d7e2 },
  'bold-sans-serif': { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  'sans-serif-italic': { upper: 0x1d608, lower: 0x1d622 },
  'sans-serif-bold-italic': { upper: 0x1d63c, lower: 0x1d656 },
  monospace: { upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
};

/** `text` in `variant`'s letters and digits, or null when a character of it has none. */
function inVariant(text: string, variant: string): string | null {
  const table = VARIANTS[variant];
  if (!table) return null;
  let out = '';
  for (const c of text) {
    const hole = table.holes?.indexOf(c) ?? -1;
    if (hole >= 0 && hole % 2 === 0) {
      out += table.holes?.[hole + 1];
    } else if (c >= 'A' && c <= 'Z') {
      out += String.fromCodePoint(table.upper + c.charCodeAt(0) - 65);
    } else if (c >= 'a' && c <= 'z') {
      out += String.fromCodePoint(table.lower + c.charCodeAt(0) - 97);
    } else if (c >= '0' && c <= '9' && table.digit !== undefined) {
      out += String.fromCodePoint(table.digit + c.charCodeAt(0) - 48);
    } else {
      return null;
    }
  }
  return out;
}

/** The table attributes cell styles carry, which Core renders none of. */
const TABLE_LAYOUT = [
  'columnalign',
  'rowalign',
  'columnlines',
  'rowlines',
  'columnspacing',
  'rowspacing',
  'frame',
  'framespacing',
];

const list = (value: unknown): string[] =>
  String(value ?? '')
    .trim()
    .split(/\s+/);
/** The `i`th entry of a MathML attribute list, whose last entry repeats. */
const nth = (values: string[], i: number) => values[Math.min(i, values.length - 1)];
const half = (length: string) => (/^(0[a-z]*)?$/.test(length) ? '0' : `calc(${length} / 2)`);
const isLine = (value: string | undefined) => value === 'solid' || value === 'dashed';

interface Extra {
  omit?: readonly string[];
  style?: string[];
}

export class MathmlCoreVisitor extends SerializedMmlVisitor {
  /** The variant characters of the token being serialized are written in. */
  private variant: string | null = null;

  visitInferredMrowNode(node: MmlNode, _space: string): string {
    return node.childNodes.map((child) => this.visitNode(child, '')).join('');
  }

  visitTextNode(node: TextNode, _space: string): string {
    const text = node.getText();
    return this.quoteHTML((this.variant && inVariant(text, this.variant)) ?? text);
  }

  visitDefault(node: MmlNode, _space: string): string {
    if (!node.isToken) return this.element(node, this.getAttributes(node), this.children(node));
    const variant = String(this.getAttributeList(node).mathvariant ?? '');
    const text = node.childNodes.map((child) => (child as TextNode).getText?.() ?? '').join('');
    const mapped = variant in VARIANTS && inVariant(text, variant) !== null;
    this.variant = mapped ? variant : null;
    try {
      const attributes = this.attributes(node, { omit: mapped ? ['mathvariant'] : [] });
      return this.element(node, attributes, this.children(node));
    } finally {
      this.variant = null;
    }
  }

  visitMencloseNode(node: MmlNode, _space: string): string {
    const notations = new Set(list(node.attributes.get('notation')));
    let content = this.children(node);
    if (notations.delete('radical')) content = `<msqrt>${content}</msqrt>`;
    if (notations.delete('longdiv')) {
      content =
        `<mrow><mo stretchy="true" lspace="0" rspace="0">)</mo>` +
        `<mrow style="border-top:${RULE} solid;padding:0.2em 0.1em 0">${content}</mrow></mrow>`;
    }
    const style = [...notations].flatMap((notation) => NOTATION_STYLES[notation] ?? []);
    const strikes = [...notations].filter((n) => n in STRIKES).map((n) => strike(STRIKES[n]));
    if (strikes.length) style.push(`background-image:${strikes.join(',')}`);
    return `<mrow${this.attributes(node, { omit: ['notation'], style })}>${content}</mrow>`;
  }

  visitMtableNode(node: MmlNode, _space: string): string {
    const table = node.attributes;
    const align = list(table.get('columnalign'));
    const columnLines = list(table.get('columnlines'));
    const rowLines = list(table.get('rowlines'));
    const columnSpacing = list(table.get('columnspacing'));
    const rowSpacing = list(table.get('rowspacing'));
    const frame = String(table.get('frame'));
    const rows = node.childNodes;
    const body = rows.map((row, r) => {
      // A labelled row's label leads; Core has no label column, so it trails the row instead.
      const cells = row.isKind('mlabeledtr')
        ? [...row.childNodes.slice(1), row.childNodes[0]]
        : row.childNodes;
      const rowAlign = row.attributes.getExplicit('columnalign');
      const cellsMml = cells.map((cell, c) => {
        const cellAlign =
          cell.attributes.getExplicit('columnalign') ??
          (rowAlign === undefined ? nth(align, c) : nth(list(rowAlign), c));
        const padding = [
          r > 0 ? half(nth(rowSpacing, r - 1)) : '0',
          c < cells.length - 1 ? half(nth(columnSpacing, c)) : '0',
          r < rows.length - 1 ? half(nth(rowSpacing, r)) : '0',
          c > 0 ? half(nth(columnSpacing, c - 1)) : '0',
        ];
        const style = [
          `padding:${padding.every((side) => side === '0') ? '0' : padding.join(' ')}`,
        ];
        if (cellAlign === 'left' || cellAlign === 'right') style.push(`text-align:${cellAlign}`);
        const columnLine = nth(columnLines, c);
        if (c < cells.length - 1 && isLine(columnLine)) {
          style.push(`border-right:${RULE} ${columnLine}`);
        }
        const rowLine = nth(rowLines, r);
        if (r < rows.length - 1 && isLine(rowLine)) style.push(`border-bottom:${RULE} ${rowLine}`);
        const attributes = this.attributes(cell, { omit: ['columnalign', 'rowalign'], style });
        return `<mtd${attributes}>${this.children(cell)}</mtd>`;
      });
      const attributes = this.attributes(row, { omit: ['columnalign', 'rowalign'] });
      return `<mtr${attributes}>${cellsMml.join('')}</mtr>`;
    });
    const style: string[] = [];
    if (isLine(frame)) {
      const [horizontal, vertical = horizontal] = list(table.get('framespacing'));
      style.push(`border:${RULE} ${frame}`, `padding:${vertical} ${horizontal}`);
    }
    return `<mtable${this.attributes(node, { omit: TABLE_LAYOUT, style })}>${body.join('')}</mtable>`;
  }

  protected getAttributes(node: MmlNode): string {
    return this.attributes(node, {});
  }

  private attributes(node: MmlNode, { omit = [], style = [] }: Extra): string {
    const attributes: PropertyList = this.getAttributeList(node);
    const declared = attributes.style === undefined ? [] : [String(attributes.style)];
    const styles = [...declared, ...style].filter(Boolean);
    const out: string[] = [];
    for (const [name, value] of Object.entries(attributes)) {
      if (value === undefined || name === 'style' || name.startsWith('data-')) continue;
      // Ids MathJax gives equation labels repeat from one expression to the next.
      if (name === 'id' && String(value).startsWith('mjx-')) continue;
      if (omit.includes(name)) continue;
      out.push(`${name}="${this.quoteHTML(String(value))}"`);
    }
    if (styles.length) out.push(`style="${this.quoteHTML(styles.join(';'))}"`);
    return out.length ? ` ${out.join(' ')}` : '';
  }

  private children(node: MmlNode): string {
    return this.childNodeMml(node, '', '');
  }

  private element(node: MmlNode, attributes: string, children: string): string {
    const kind = this.getKind(node);
    return `<${kind}${attributes}>${children}</${kind}>`;
  }
}
