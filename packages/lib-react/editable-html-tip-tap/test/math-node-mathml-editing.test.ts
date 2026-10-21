// @vitest-environment happy-dom
import { generateHTML, generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { MathNode } from '../src/extensions/math';

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
