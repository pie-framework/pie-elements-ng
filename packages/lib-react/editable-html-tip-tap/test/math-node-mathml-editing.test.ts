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
