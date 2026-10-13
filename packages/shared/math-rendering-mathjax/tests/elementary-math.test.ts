import { describe, expect, it } from 'vitest';
import { rewriteElementaryMath } from '../src/elementary-math.js';

const BORDER = '0.07em solid currentColor';

/** happy-dom ignores a self-closing tag in MathML, which a browser parses as an empty element. */
function expandEmptyTags(markup: string): string {
  return markup.replace(/<([a-z]+)([^<>]*?)\s*\/>/g, '<$1$2></$1>');
}

function rewrite(mathml: string): Element {
  const root = document.createElement('div');
  root.innerHTML = expandEmptyTags(
    `<math xmlns="http://www.w3.org/1998/Math/MathML">${mathml}</math>`
  );
  rewriteElementaryMath(root);
  return root;
}

/** The table's rows, one string per cell: its text, then `^` for a top border, `_` for a bottom. */
function grid(root: Element): string[][] {
  const table = root.querySelector('mtable');
  if (!table) throw new Error('no mtable');
  return [...table.querySelectorAll(':scope > mtr')].map((row) =>
    [...row.children].map((cell) => {
      const style = cell.getAttribute('style') ?? '';
      const marks = ['top', 'bottom', 'left', 'right']
        .filter((side) => style.includes(`border-${side}:`))
        .map((side) => ({ top: '^', bottom: '_', left: '<', right: '>' })[side])
        .join('');
      return `${(cell.textContent ?? '').replace(/\s+/g, '')}${marks}`;
    })
  );
}

describe('rewriteElementaryMath', () => {
  it('stacks numbers by their decimal point and draws lines as cell borders', () => {
    const root = rewrite(
      '<mstack><mn>424</mn><msrow><mo>+</mo><mn>33</mn></msrow><msline/></mstack>'
    );
    expect(root.querySelector('mstack')).toBeNull();
    expect(grid(root)).toEqual([
      ['4', '2', '4'],
      ['+_', '3_', '3_'],
    ]);
    const cell = root.querySelector('mtr:last-child > mtd');
    expect(cell?.getAttribute('style')).toBe(`border-bottom:${BORDER}`);
  });

  it('gives an empty mrow its own column', () => {
    expect(
      grid(
        rewrite('<mstack><mn>424</mn><msrow><mo>+</mo><mrow/><mn>33</mn></msrow><msline/></mstack>')
      )
    ).toEqual([
      ['', '4', '2', '4'],
      ['+_', '_', '3_', '3_'],
    ]);
  });

  it('draws a line followed by a row as that row’s top border', () => {
    expect(
      grid(
        rewrite(
          '<mstack><mn>123</mn><msrow><mn>456</mn><mo>+</mo></msrow><msline/><mn>579</mn></mstack>'
        )
      )
    ).toEqual([
      ['1', '2', '3', ''],
      ['4', '5', '6', '+'],
      ['5^', '7^', '9^', '^'],
    ]);
  });

  it('aligns the production decimal subtraction, an mtext decimal point and none placeholders', () => {
    const root = rewrite(
      '<mstack charalign="center" stackalign="right"><msrow><mn>18</mn><mtext>.</mtext><mn>156</mn></msrow><msrow><mo>-</mo><none></none><mn>9</mn><mtext>.</mtext><mn>428</mn></msrow><msline></msline><msrow></msrow></mstack>'
    );
    expect(grid(root)).toEqual([
      ['', '1', '8', '.', '1', '5', '6'],
      ['-', '', '9', '.', '4', '2', '8'],
      ['^', '^', '^', '^', '^', '^', '^'],
    ]);
    const table = root.querySelector('mtable');
    expect(table?.getAttribute('columnalign')).toBe('center');
    expect(table?.hasAttribute('stackalign')).toBe(false);
  });

  it('aligns the production multiplication with a trailing empty row', () => {
    expect(
      grid(
        rewrite(
          '<mstack charalign="center" stackalign="right"><msrow><mn>2</mn><mo>,</mo><mn>139</mn></msrow><msrow><none/><mo>&#215;</mo><none/><none/><mn>4</mn></msrow><msline/><msrow/></mstack>'
        )
      )
    ).toEqual([
      ['2', ',', '1', '3', '9'],
      ['', '×', '', '', '4'],
      ['^', '^', '^', '^', '^'],
    ]);
  });

  it('places carries over the digit they annotate, with their crossouts', () => {
    const root = rewrite(
      `<mstack>
        <mscarries crossout="updiagonalstrike">
          <mn>2</mn><mn>12</mn><mscarry crossout="none"><mrow/></mscarry>
        </mscarries>
        <mn>2,327</mn>
        <msrow><mo>-</mo><mn> 1,156</mn></msrow>
        <msline/>
        <mn>1,171</mn>
      </mstack>`
    );
    expect(grid(root)).toEqual([
      ['', '2', ',', '32', '212', '7'],
      ['-', '1', ',', '1', '5', '6'],
      ['^', '1^', ',^', '1^', '7^', '1^'],
    ]);
    const crossed = [...root.querySelectorAll('menclose')];
    expect(crossed.map((element) => element.textContent)).toEqual(['3', '2']);
    expect(crossed[0].getAttribute('notation')).toBe('updiagonalstrike');
    expect(crossed[0].parentElement?.getAttribute('width')).toBe('-0.334em');
    const carry = root.querySelector('mover > mpadded:last-child');
    expect(carry?.getAttribute('width')).toBe('0');
    expect(carry?.firstElementChild?.getAttribute('scriptsizemultiplier')).toBe('0.6');
  });

  it('places carries by location, and a crossout without a carry', () => {
    const root = rewrite(
      `<mstack>
        <mscarries location="nw">
          <mrow/>
          <mscarry crossout="updiagonalstrike" location="n"><mn>2</mn></mscarry>
          <mn>1</mn>
          <mrow/>
        </mscarries>
        <mn>2,327</mn>
        <msrow><mo>-</mo><mn> 1,156</mn></msrow>
      </mstack>`
    );
    const row = root.querySelector('mtr');
    expect(row?.children[3].querySelector('mover > mpadded > menclose')?.textContent).toBe('3');
    expect(row?.children[4].querySelector('mmultiscripts > mprescripts')).not.toBeNull();
  });

  it('shifts each row of a group, and stacks a long multiplication', () => {
    expect(
      grid(
        rewrite(
          `<mstack>
            <msgroup><mn>123</mn><msrow><mo>×</mo><mn>321</mn></msrow></msgroup>
            <msline/>
            <msgroup shift="1"><mn>123</mn><mn>246</mn><mn>369</mn></msgroup>
            <msline/>
          </mstack>`
        )
      )
    ).toEqual([
      ['', '', '1', '2', '3'],
      ['', '×', '3', '2', '1'],
      ['^', '^', '1^', '2^', '3^'],
      ['', '2', '4', '6', ''],
      ['3_', '6_', '9_', '_', '_'],
    ]);
  });

  it('stacks adjacent carries rows over one digit', () => {
    const root = rewrite(
      `<mstack>
        <mscarries><mn>1</mn><mn>1</mn><mrow/></mscarries>
        <mscarries><mn>1</mn><mn>2</mn><mrow/></mscarries>
        <mn>1,234</mn>
      </mstack>`
    );
    expect(grid(root)).toEqual([['1', ',', '211', '321', '4']]);
    expect(root.querySelector('mtd:nth-child(3) > mover > mover')).not.toBeNull();
  });

  it('places a line of a given length as a number of that many digits', () => {
    expect(
      grid(rewrite('<mstack stackalign="right"><msline length="1"/><mn> 0.3333 </mn></mstack>'))
    ).toEqual([['0', '.', '3', '3', '3', '3^']]);
    expect(
      grid(rewrite('<mstack stackalign="right"><mn> 0.142857 </mn><msline length="6"/></mstack>'))
    ).toEqual([['0', '.', '1_', '4_', '2_', '8_', '5_', '7_']]);
  });

  it('lays out a long division with the result over the dividend', () => {
    const root = rewrite(
      `<mlongdiv longdivstyle="lefttop">
        <mn> 3 </mn>
        <mn> 435.3</mn>
        <mn> 1306</mn>
        <msgroup position="2" shift="-1">
          <msgroup><mn> 12</mn><msline length="2"/></msgroup>
          <msgroup><mn> 10</mn><mn> 9</mn><msline length="2"/></msgroup>
          <msgroup><mn> 16</mn><mn> 15</mn><msline length="2"/><mn> 1.0</mn></msgroup>
          <msgroup position="-1"><mn> 9</mn><msline length="3"/><mn> 1</mn></msgroup>
        </msgroup>
      </mlongdiv>`
    );
    expect(grid(root)).toEqual([
      ['', '', '', '4', '3', '5', '.', '3'],
      ['3', ')^', '1^', '3^', '0^', '6^', '^', '^'],
      ['', '', '1', '2', '', '', '', ''],
      ['', '', '^', '1^', '0', '', '', ''],
      ['', '', '', '', '9', '', '', ''],
      ['', '', '', '^', '1^', '6', '', ''],
      ['', '', '', '', '1', '5', '', ''],
      ['', '', '', '', '^', '1^', '.', '0'],
      ['', '', '', '', '', '', '', '9'],
      ['', '', '', '', '', '^', '^', '1^'],
    ]);
  });

  it('lays out the production polynomial division by digit, the result in an mrow', () => {
    const root = rewrite(
      '<mlongdiv charalign="center" charspacing="0px" stackalign="left"><mrow><mi>x</mi><mo>+</mo><mn>1</mn></mrow><mrow></mrow><msgroup><msrow><mn>8</mn><mrow><msup><mi>x</mi><mn>4</mn></msup><mo>+</mo><mn>5</mn></mrow></msrow></msgroup></mlongdiv>'
    );
    expect(grid(root)).toEqual([['x+1', ')^', '8^', 'x4+5^']]);
    expect(root.querySelector('mtable')?.getAttribute('columnspacing')).toBe('0px');
  });

  it('flattens a result mrow so its digits align with the dividend', () => {
    const root = rewrite(
      '<mlongdiv stackalign="left"><mn>4</mn><mrow><mn>2</mn><mn>1</mn></mrow><mn>84</mn></mlongdiv>'
    );
    expect(grid(root)).toEqual([
      ['', '', '2', '1'],
      ['4', ')^', '8^', '4^'],
    ]);
  });

  it('puts the divisor and result beside a French long division', () => {
    const root = rewrite(
      '<mlongdiv longdivstyle="stackedrightright"><mn>3</mn><mn>12</mn><mn>36</mn><mn>3</mn><mn>6</mn></mlongdiv>'
    );
    expect(grid(root)).toEqual([
      ['3', '6', '3_<'],
      ['', '3', '12<'],
      ['', '6', '<'],
    ]);
  });

  it('writes an inline long division in a single row', () => {
    expect(
      grid(
        rewrite('<mlongdiv longdivstyle=":right=right"><mn>3</mn><mn>12</mn><mn>36</mn></mlongdiv>')
      )
    ).toEqual([['3', '6', ':', '3', '=', '1', '2']]);
  });

  it('reads the decimal point the enclosing mstyle sets', () => {
    expect(
      grid(rewrite('<mstyle decimalpoint=","><mstack><mn>1,5</mn><mn>12,25</mn></mstack></mstyle>'))
    ).toEqual([
      ['', '1', ',', '5', ''],
      ['1', '2', ',', '2', '5'],
    ]);
  });

  it('leaves MathJax output alone', () => {
    const root = document.createElement('div');
    root.innerHTML =
      '<mjx-container><math xmlns="http://www.w3.org/1998/Math/MathML"><mstack><mn>1</mn></mstack></math></mjx-container>';
    rewriteElementaryMath(root);
    expect(root.querySelector('mstack')).not.toBeNull();
  });
});
