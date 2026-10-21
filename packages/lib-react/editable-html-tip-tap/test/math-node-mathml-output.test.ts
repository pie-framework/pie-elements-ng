// @vitest-environment happy-dom
import { generateHTML, generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { MathNode } from '../src/extensions/math';

const LATEX_SPAN = (latex: string) => `<span data-latex="" data-raw="${latex}">\\(${latex}\\)</span>`;

// What `latexToMml` gives for `x^{2}+\sqrt{y}`: MathJax's MathML without its `data-latex` attributes.
const EXPONENT_CLEAN =
  '<math xmlns="http://www.w3.org/1998/Math/MathML"><msup><mi>x</mi><mrow data-mjx-texclass="ORD"><mn>2</mn></mrow></msup><mo>+</mo><msqrt><mi>y</mi></msqrt></math>';

// The same, as the editor saves it: with the LaTeX it was made from on the root.
const EXPONENT_MATHML = EXPONENT_CLEAN.replace('<math', '<math data-pie-latex="x^{2}+\\sqrt{y}"');

const extensionsFor = (mathMlOptions?: object) => [StarterKit, MathNode.configure({ mathMlOptions })];

const save = (html: string, mathMlOptions?: object) =>
  generateHTML(generateJSON(html, extensionsFor(mathMlOptions)), extensionsFor(mathMlOptions));

const fakeTex2mml = (mathMl?: string) =>
  vi.fn((tex: string, options?: { display?: boolean }) =>
    (
      mathMl ??
      `<math xmlns="http://www.w3.org/1998/Math/MathML"${options?.display ? ' display="block"' : ''} data-latex="${tex}"><mi>x</mi></math>`
    )
  );

const startMathJax = (tex2mml = fakeTex2mml()) => {
  (window as any).MathJax = { tex2mml, startup: { document: {} } };
  return tex2mml;
};

describe('math node with mmlOutput', () => {
  afterEach(() => {
    delete (window as any).MathJax;
  });

  it('saves math as MathML', () => {
    startMathJax();
    const html = save(`<p>${LATEX_SPAN('x')}</p>`, { mmlOutput: true });

    expect(html).toContain('<span data-type="mathml"><math');
    expect(html).toContain('data-pie-latex="x"');
    expect(html).not.toContain('data-raw');
    // `data-latex` marks a LaTeX span, and the renderers rewrite the text of every element that has it.
    expect(html).not.toContain('data-latex=');
  });

  it('saves math as LaTeX when mmlOutput is off or not set', () => {
    startMathJax();

    for (const options of [{ mmlOutput: false }, undefined]) {
      expect(save(`<p>${LATEX_SPAN('x')}</p>`, options)).toContain(LATEX_SPAN('x'));
    }
  });

  it('keeps the LaTeX while MathJax has not started', () => {
    expect(save(`<p>${LATEX_SPAN('x')}</p>`, { mmlOutput: true })).toContain(LATEX_SPAN('x'));
  });

  it('keeps the LaTeX when MathJax cannot read it', () => {
    startMathJax(fakeTex2mml('<math><merror><mtext>Undefined control sequence</mtext></merror></math>'));

    expect(save(`<p>${LATEX_SPAN('\\bad')}</p>`, { mmlOutput: true })).toContain(LATEX_SPAN('\\bad'));
  });

  it('drops the invisible operator MathJax adds after a function name', () => {
    startMathJax(
      fakeTex2mml(
        '<math><mi>log</mi><mo data-mjx-texclass="NONE">&#x2061;</mo><mn>8</mn></math>'
      )
    );

    const html = save(`<p>${LATEX_SPAN('\\log 8')}</p>`, { mmlOutput: true });

    expect(html).toContain('<mi>log</mi><mn>8</mn>');
    expect(html).not.toContain('&#x2061;');
  });

  it('saves display math as display MathML', () => {
    const tex2mml = startMathJax();
    const display = '<math display="block" data-latex="\\frac{a}{b}"><mfrac><mi>a</mi><mi>b</mi></mfrac></math>';

    save(`<p>${display}</p>`, { mmlEditing: true, mmlOutput: true });

    expect(tex2mml).toHaveBeenCalledWith('\\frac{a}{b}', { display: true });
  });

  it('asks for inline math for inline LaTeX', () => {
    const tex2mml = startMathJax();

    save(`<p>${LATEX_SPAN('x')}</p>`, { mmlOutput: true });

    expect(tex2mml).toHaveBeenCalledWith('x', { display: false });
  });
});

describe('math node reading back MathML it saved', () => {
  afterEach(() => {
    delete (window as any).MathJax;
  });

  it('reads the LaTeX saved with the MathML, where converting the MathML would lose the exponent', () => {
    // Without it, the converter reads this back as `x2 + \sqrt{y}`.
    const html = save(`<p><span data-type="mathml">${EXPONENT_MATHML}</span></p>`, { mmlEditing: true });

    expect(html).toContain('data-raw="x^{2}+\\sqrt{y}"');
  });

  it('reads the data-latex of a MathML made elsewhere by MathJax 4, which holds the same', () => {
    const foreign = `<math xmlns="http://www.w3.org/1998/Math/MathML" data-latex="x^{2}+\\sqrt{y}"><msup data-latex="x^{2}"><mi data-latex="x">x</mi><mn data-latex="2">2</mn></msup></math>`;

    const html = save(`<p><span data-type="mathml">${foreign}</span></p>`, { mmlEditing: true });

    expect(html).toContain('data-raw="x^{2}+\\sqrt{y}"');
  });

  it('saves the same MathML again when both options are on', () => {
    const tex2mml = startMathJax(fakeTex2mml(EXPONENT_CLEAN));
    const options = { mmlEditing: true, mmlOutput: true };

    const saved = save(`<p><span data-type="mathml">${EXPONENT_MATHML}</span></p>`, options);
    const savedAgain = save(saved, options);

    expect(saved).toContain('data-pie-latex="x^{2}+\\sqrt{y}"');
    expect(saved).not.toContain('data-latex=');
    expect(savedAgain).toBe(saved);
    expect(tex2mml).toHaveBeenCalledWith('x^{2}+\\sqrt{y}', { display: false });
  });
});

describe('math node saving LaTeX that needs care in an attribute', () => {
  afterEach(() => {
    delete (window as any).MathJax;
  });

  const OPTIONS = { mmlEditing: true, mmlOutput: true };

  /** The LaTeX of the first math node of `html`, once the editor has loaded it. */
  const latexOf = (html: string) =>
    generateJSON(html, extensionsFor(OPTIONS)).content[0].content[0].attrs.latex;

  it.each([
    ['a quote, an ampersand and angle brackets', 'a<b & c>d "q"'],
    ['dollar signs a replacement string would expand', '\\$5 and $& and $1'],
  ])('reads back %s exactly', (_label, latex) => {
    startMathJax(fakeTex2mml('<math xmlns="http://www.w3.org/1998/Math/MathML"><mi>x</mi></math>'));
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'math', attrs: { latex, wrapper: null, html: null } }] },
      ],
    };

    const saved = generateHTML(doc, extensionsFor(OPTIONS));

    expect(saved).toContain('<span data-type="mathml"><math data-pie-latex="');
    expect(latexOf(saved)).toBe(latex);
    expect(save(saved, OPTIONS)).toBe(saved);
  });
});

describe('math node holding MathML that stays MathML', () => {
  it('saves it with its markup, which an attribute-only render used to drop', () => {
    const html = save('<p><span data-type="mathml"><math><mn>1</mn></math></span> x</p>');

    expect(html).toContain('<span data-type="mathml"><math><mn>1</mn></math></span>');
    expect(html).not.toContain('dangerouslysetinnerhtml');
  });

  it('keeps MathML that cannot be read as LaTeX when mmlEditing is on', () => {
    const html = save('<p><span data-type="mathml"><math></math></span> x</p>', { mmlEditing: true });

    expect(html).toContain('<span data-type="mathml"><math></math></span>');
  });
});
