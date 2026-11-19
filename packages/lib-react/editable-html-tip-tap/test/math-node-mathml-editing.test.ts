// @vitest-environment happy-dom
import { generateHTML, generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { convertMathMlToLatex, MathNode, sanitizeMathMl } from '../src/extensions/math';

const PAGE_RENDERER_KEY = '@pie-lib/math-rendering';
const MATHML = '<math><mfrac><mn>4</mn><mn>18</mn></mfrac></math>';
const SAVED = '<span data-latex="" data-raw="\\frac{4}{18}">\\(\\frac{4}{18}\\)</span>';

const extensionsFor = (mathMlOptions?: object) => [StarterKit, MathNode.configure({ mathMlOptions })];

/** The nodes a field holding `html` has once the editor has loaded it. */
const load = (html: string, mathMlOptions?: object) =>
  generateJSON(html, extensionsFor(mathMlOptions)).content[0].content;

const save = (html: string, mathMlOptions?: object) =>
  generateHTML(generateJSON(html, extensionsFor(mathMlOptions)), extensionsFor(mathMlOptions));

const installConverter = () => {
  (window as any)[PAGE_RENDERER_KEY] = {
    renderMath: vi.fn(),
    mmlToLatex: () => '\\frac{4}{18}',
  };
};

describe('math node with mmlEditing', () => {
  afterEach(() => {
    delete (window as any)[PAGE_RENDERER_KEY];
  });

  it('reads a bare <math> as an editable math node', () => {
    installConverter();
    expect(save(`<p>${MATHML} inches</p>`, { mmlEditing: true })).toContain(SAVED);
  });

  it('reads <math> inside a data-type="mathml" span as an editable math node', () => {
    installConverter();
    expect(save(`<p><span data-type="mathml">${MATHML}</span> inches</p>`, { mmlEditing: true })).toContain(SAVED);
  });

  it('keeps a bare <math> as MathML when mmlEditing is off, rather than dropping its markup', () => {
    installConverter();

    for (const options of [{ mmlEditing: false }, undefined]) {
      const html = save(`<p>${MATHML} inches</p>`, options);

      expect(html).toContain(`<span data-type="mathml">${MATHML}</span>`);
      expect(html).not.toContain('data-latex');
    }
  });

  it('converts with the shared converter when the page installs none', () => {
    // The ESM page installs only renderMath, so this is the converter the demo and ESM hosts get.
    const nodes = load(`<p><span data-type="mathml">${MATHML}</span> inches</p>`, { mmlEditing: true });

    expect(nodes[0].type).toBe('math');
    expect(nodes[0].attrs.latex).toBe('\\frac{4}{18}');
    expect(nodes[0].attrs.html).toBeNull();
  });

  it('reads the fractions of a real multiple-choice label as editable math', () => {
    const label =
      '<p><math xmlns="http://www.w3.org/1998/Math/MathML"> <mrow> <mn>4</mn><mfrac> <mn>1</mn> <mn>2</mn> </mfrac> </mrow> </math> inches</p>';

    expect(save(label, { mmlEditing: true })).toContain('data-raw="4 \\frac{1}{2}"');
  });

  it('keeps MathML that cannot be read as LaTeX as it was', () => {
    const nodes = load('<p><span data-type="mathml"><math></math></span> inches</p>', { mmlEditing: true });

    expect(nodes[0].type).toBe('math');
    expect(nodes[0].attrs.latex).toBe('');
    expect(nodes[0].attrs.html).toBe('<math></math>');
  });

  it('still reads LaTeX spans when mmlEditing is on', () => {
    installConverter();
    expect(save(`<p>${SAVED}</p>`, { mmlEditing: true })).toContain(SAVED);
  });
});

describe('converting MathML to LaTeX', () => {
  const NS = 'xmlns="http://www.w3.org/1998/Math/MathML"';

  afterEach(() => {
    delete (window as any)[PAGE_RENDERER_KEY];
  });

  it('converts itself when the page installs no converter', () => {
    expect(convertMathMlToLatex(`<math ${NS}> <mrow> <mfrac> <mn>2</mn> <mn>9</mn> </mfrac> </mrow> </math>`)).toBe(
      '\\frac{2}{9}'
    );
    expect(
      convertMathMlToLatex(`<math ${NS}> <mrow> <mn>4</mn><mfrac> <mn>1</mn> <mn>2</mn> </mfrac> </mrow> </math>`)
    ).toBe('4 \\frac{1}{2}');
  });

  it('converts as the legacy renderer does', () => {
    const mml = `<math ${NS}>  <mn>2</mn>  <mi>x</mi>  <mtext>&#xA0;</mtext>  <mo>&#x2264;</mo>  <mn>4</mn>  <mi>y</mi>  <mtext>&#xA0;</mtext>  <mo>+</mo>  <mtext>&#xA0;</mtext>  <mn>8</mn> <msqrt>    <mi>h</mi>  </msqrt></math>`;

    expect(convertMathMlToLatex(mml)).toBe('2 x \\textrm{ } \\leq 4 y \\textrm{ } + \\textrm{ } 8 \\sqrt{h}');
  });

  it('keeps the exponents of a real multiple-choice label', () => {
    const mml = `<math ${NS}><mroot><msup><mi>x</mi><mn>2</mn></msup><mn>3</mn></mroot><mo>&#183;</mo><mroot><msup><mi>y</mi><mn>3</mn></msup><mn>4</mn></mroot></math>`;

    expect(convertMathMlToLatex(mml)).toBe('\\sqrt[3]{x^{2}} \\cdot \\sqrt[4]{y^{3}}');
  });

  it('keeps exponents that hold fractions, and exponents of exponents', () => {
    const mml = `<math ${NS}><mfrac><msup><mi>x</mi><mstyle displaystyle="true"><mfrac><mn>2</mn><mn>3</mn></mfrac></mstyle></msup><msup><mi>y</mi><mstyle displaystyle="true"><mfrac><mrow><mo>-</mo><mn>3</mn></mrow><mn>4</mn></mfrac></mstyle></msup></mfrac></math>`;

    expect(convertMathMlToLatex(mml)).toBe('\\frac{x^{\\frac{2}{3}}}{y^{\\frac{- 3}{4}}}');
    expect(convertMathMlToLatex(`<math ${NS}><msup><mi>e</mi><msup><mi>x</mi><mn>2</mn></msup></msup></math>`)).toBe(
      'e^{x^{2}}'
    );
  });

  it('parenthesizes the base of an exponent once', () => {
    const fenced = `<math ${NS}><msup><mrow><mo>(</mo><mi>a</mi><mo>+</mo><mi>b</mi><mo>)</mo></mrow><mn>2</mn></msup></math>`;
    const unfenced = `<math ${NS}><msup><mrow><mi>a</mi><mo>+</mo><mi>b</mi></mrow><mn>2</mn></msup></math>`;

    expect(convertMathMlToLatex(fenced)).toBe('\\left( a + b \\right)^{2}');
    expect(convertMathMlToLatex(unfenced)).toBe('\\left( a + b \\right)^{2}');
    expect(convertMathMlToLatex(`<math ${NS}><msup><msub><mi>x</mi><mn>1</mn></msub><mn>2</mn></msup></math>`)).toBe(
      'x_{1}^{2}'
    );
  });

  it('reads a no-break space next to an exponent as the legacy renderer does', () => {
    const mml = `<math ${NS}><msup><mi>x</mi><mn>2</mn></msup><mtext>&#xA0;</mtext><mo>+</mo><mn>1</mn></math>`;

    expect(convertMathMlToLatex(mml)).toBe('x^{2} \\textrm{ } + 1');
  });

  it('pairs the bars of an absolute value', () => {
    expect(convertMathMlToLatex(`<math ${NS}><mo>|</mo><mi>x</mi><mo>|</mo></math>`)).toBe('\\left|x \\right|');
    expect(
      convertMathMlToLatex(`<math ${NS}><mo>|</mo><mi>a</mi><mo>|</mo><mo>+</mo><mo>|</mo><mi>b</mi><mo>|</mo></math>`)
    ).toBe('\\left|a \\right|+ \\left|b \\right|');
  });

  it('escapes braces, and gives a fence without a partner an empty one', () => {
    expect(convertMathMlToLatex(`<math ${NS}><mrow><mo>{</mo><mn>1</mn><mo>,</mo><mn>2</mn><mo>}</mo></mrow></math>`)).toBe(
      '\\left\\{ 1 , 2 \\right\\}'
    );
    expect(convertMathMlToLatex(`<math ${NS}><mfrac><mrow><mo>(</mo><mi>a</mi></mrow><mrow><mi>b</mi><mo>)</mo></mrow></mfrac></math>`)).toBe(
      '\\frac{\\left( a\\right.}{\\left.b \\right)}'
    );
  });

  it('keeps arrows between what they join', () => {
    expect(convertMathMlToLatex(`<math ${NS}><mi>f</mi><mo>:</mo><mi>A</mi><mo>→</mo><mi>B</mi></math>`)).toBe(
      'f : A \\rightarrow B'
    );
    expect(
      convertMathMlToLatex(
        `<math ${NS}><munder><mo>lim</mo><mrow><mi>x</mi><mo>→</mo><mn>0</mn></mrow></munder><mi>x</mi></math>`
      )
    ).toBe('\\underset{x \\rightarrow 0}{\\lim} x');
    expect(convertMathMlToLatex(`<math ${NS}><mover><mi>v</mi><mo>→</mo></mover></math>`)).toBe('\\overrightarrow{v}');
  });

  it('reads matrices and cases as environments', () => {
    const cells = '<mtr><mtd><mn>1</mn></mtd><mtd><mn>2</mn></mtd></mtr><mtr><mtd><mn>3</mn></mtd><mtd><mn>4</mn></mtd></mtr>';

    expect(convertMathMlToLatex(`<math ${NS}><mrow><mo>[</mo><mtable>${cells}</mtable><mo>]</mo></mrow></math>`)).toBe(
      '\\left[ \\begin{matrix}1 & 2 \\\\ 3 & 4\\end{matrix} \\right]'
    );
    expect(
      convertMathMlToLatex(
        `<math ${NS}><mrow><mo>{</mo><mtable><mtr><mtd><mi>x</mi></mtd></mtr><mtr><mtd><mi>y</mi></mtd></mtr></mtable></mrow></math>`
      )
    ).toBe('\\left\\{ \\begin{matrix}x \\\\ y\\end{matrix}\\right.');
    expect(convertMathMlToLatex(`<math ${NS}><mfenced open="[" close="]"><mtable>${cells}</mtable></mfenced></math>`)).toBe(
      '\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}'
    );
  });

  it('writes degrees, binomial coefficients and prescripts as MathJax reads them', () => {
    expect(convertMathMlToLatex(`<math ${NS}><mn>90</mn><mo>°</mo></math>`)).toBe('90 ^{\\circ}');
    expect(convertMathMlToLatex(`<math ${NS}><msup><mn>90</mn><mo>°</mo></msup></math>`)).toBe('90^{\\circ}');
    expect(
      convertMathMlToLatex(
        `<math ${NS}><mrow><mo>(</mo><mfrac linethickness="0"><mi>n</mi><mi>k</mi></mfrac><mo>)</mo></mrow></math>`
      )
    ).toBe('\\left( {n \\atop k} \\right)');
    expect(
      convertMathMlToLatex(`<math ${NS}><mmultiscripts><mi>C</mi><mprescripts></mprescripts><mn>1</mn><mn>2</mn></mmultiscripts></math>`)
    ).toBe('{}_{1}^{2}C');
  });

  it('writes function names as commands, without the invisible operators', () => {
    expect(convertMathMlToLatex(`<math ${NS}><mi>sin</mi><mo>&#x2061;</mo><mi>x</mi></math>`)).toBe('\\sin x');
    expect(convertMathMlToLatex(`<math ${NS}><msub><mi>log</mi><mn>2</mn></msub><mi>x</mi></math>`)).toBe('\\log_{2} x');
    expect(convertMathMlToLatex(`<math ${NS}><mi>x</mi><mo>&#x2063;</mo><mi>y</mi></math>`)).toBe('x y');
    expect(convertMathMlToLatex(`<math ${NS}><mtext>sin</mtext></math>`)).toBe('\\text{sin}');
  });

  it('prefers the converter the page installed', () => {
    (window as any)[PAGE_RENDERER_KEY] = { renderMath: vi.fn(), mmlToLatex: () => 'from-page' };

    expect(convertMathMlToLatex('<math><mn>1</mn></math>')).toBe('from-page');
  });

  it('gives no LaTeX for MathML it cannot read', () => {
    expect(convertMathMlToLatex('<math></math>')).toBeNull();
    expect(convertMathMlToLatex('not mathml')).toBeNull();
  });
});

describe('MathML shown in the page', () => {
  it('keeps MathML and drops what could run', () => {
    const html = sanitizeMathMl(
      '<math><mn onclick="x()">1</mn><img src="x" onerror="x()"><mi href="javascript:x()">y</mi><script>x()</script></math>'
    );

    expect(html).toContain('<mn>1</mn>');
    expect(html).toContain('<mi>y</mi>');
    expect(html).not.toMatch(/onclick|onerror|javascript:|<img|<script/);
  });
});
