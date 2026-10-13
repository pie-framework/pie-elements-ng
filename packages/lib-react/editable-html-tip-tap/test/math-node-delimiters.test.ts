// @vitest-environment happy-dom
import { generateHTML, generateJSON } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@pie-lib/math-toolbar', () => ({ MathPreview: () => null, MathToolbar: () => null }));

import { MathNode } from '../src/extensions/math';

const extensions = [StarterKit, MathNode];
const PAGE_RENDERER_KEY = '@pie-lib/math-rendering';
const SAVED = '<span data-latex="" data-raw="x^2">\\(x^2\\)</span>';

/** The markup a field holding `span` saves after the editor loads it. */
const save = (span: string) =>
  generateHTML(generateJSON(`<p>Node ${span} end</p>`, extensions), extensions);

const SPANS = [
  ['`data-raw` and delimited text', '<span data-latex="" data-raw="x^2">\\(x^2\\)</span>'],
  ['`data-raw` and bare text', '<span data-latex="" data-raw="x^2">x^2</span>'],
  ['bare text and no `data-raw`', '<span data-latex="">x^2</span>'],
  ['delimited text and no `data-raw`', '<span data-latex="">\\(x^2\\)</span>'],
  ['delimited `data-raw`', '<span data-latex="" data-raw="\\(x^2\\)">\\(x^2\\)</span>'],
  ['dollar delimiters and no `data-raw`', '<span data-latex="">$x^2$</span>'],
  ['display delimiters and no `data-raw`', '<span data-latex="">\\[x^2\\]</span>'],
];

describe('math node delimiters', () => {
  afterEach(() => {
    delete (window as any)[PAGE_RENDERER_KEY];
  });

  it.each(SPANS)('saves a span with %s as bare TeX in one pair of \\(…\\)', (_, span) => {
    expect(save(span)).toContain(SAVED);
  });

  // `@pie-lib/math-rendering`'s `wrapMath`, which wraps whatever it is given.
  it.each(SPANS)('saves a span with %s in one pair under the legacy wrapMath', (_, span) => {
    (window as any)[PAGE_RENDERER_KEY] = {
      renderMath: vi.fn(),
      wrapMath: (latex: string) => `\\(${latex}\\)`,
    };
    expect(save(span)).toContain(SAVED);
  });

  it('keeps TeX that has no delimiters as it was authored', () => {
    expect(save('<span data-latex="" data-raw="\\displaystyle\\sum_{i=1}^n i">x</span>')).toContain(
      '<span data-latex="" data-raw="\\displaystyle\\sum_{i=1}^n i">\\(\\displaystyle\\sum_{i=1}^n i\\)</span>'
    );
  });
});
