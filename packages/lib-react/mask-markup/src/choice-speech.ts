// What a screen reader hears for an answer choice: its text, an image by its alt text, and math by the
// speech the math renderer names math in a control with (`speakMathml`), so "c squared" where the
// choice shows c². Announcements and tile names use it alike, so they say what the tile itself says.

import { latexToMml, speakMathml } from '@pie-element/shared-math-rendering-mathjax';

/** The TeX MathJax typesets in delivery, with its default delimiters: \(…\), \[…\] and $$…$$. */
const TEX = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$/g;
const HAS_TEX = /\\\(|\\\[|\$\$/;

/** Elements whose end separates the words either side of it. */
const BREAKS = new Set(['br', 'p', 'div', 'li', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

export interface ChoiceSpeech {
  /** The words, with math spoken; math that cannot be spoken yet is left as its TeX, without delimiters. */
  text: string;
  /** False while some of the math has no speech yet: the math renderer converts TeX only once it has started. */
  complete: boolean;
}

const parse = (html: string) => new DOMParser().parseFromString(`<!doctype html><body>${html}`, 'text/html').body;

/** The speech of `latex`, or undefined until the math renderer can convert it. */
const speakLatex = (latex: string, display: boolean): string | undefined => {
  const mathMl = latexToMml(latex, { display });
  const math = mathMl ? parse(mathMl).querySelector('math') : null;

  return (math && speakMathml(math)) || undefined;
};

const speakNode = (node: Node, state: { complete: boolean }): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent ?? '').replace(TEX, (_source, inline?: string, display?: string, dollars?: string) => {
      const latex = (inline ?? display ?? dollars ?? '').trim();
      const speech = speakLatex(latex, inline === undefined);

      if (speech === undefined) {
        state.complete = false;
        return latex;
      }

      return ` ${speech} `;
    });
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as Element;
  const name = element.localName;

  if (name === 'script' || name === 'style') {
    return '';
  }

  if (name === 'img') {
    return ` ${element.getAttribute('alt') ?? ''} `;
  }

  if (name === 'math') {
    return ` ${speakMathml(element)} `;
  }

  if (name === 'mjx-container') {
    const math = element.querySelector('math');

    return ` ${element.getAttribute('aria-label') ?? (math ? speakMathml(math) : '')} `;
  }

  // What the legacy renderer marks as LaTeX holds it with or without delimiters.
  if (element.hasAttribute('data-latex')) {
    const raw = element.getAttribute('data-raw') || element.textContent || '';

    return speakNode(element.ownerDocument.createTextNode(HAS_TEX.test(raw) ? raw : `\\(${raw}\\)`), state);
  }

  if (element.classList.contains('mathjax_ignore')) {
    return element.textContent ?? '';
  }

  const words = Array.from(element.childNodes, (child) => speakNode(child, state)).join('');

  return BREAKS.has(name) ? ` ${words} ` : words;
};

// Every tile and blank works its name out on each render, so finished speech is kept, by the HTML it was
// made from. Unfinished speech is not kept: it changes once the math renderer has started.
const spoken = new Map<string, ChoiceSpeech>();
const MAX_SPOKEN = 500;

/** How a screen reader should hear the choice whose authored HTML is `html`. */
export const speakChoice = (html?: string): ChoiceSpeech => {
  if (!html) {
    return { text: '', complete: true };
  }

  // Outside a browser there is no math renderer either; the tags go and any TeX counts as unspoken.
  if (typeof DOMParser === 'undefined') {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    return { text, complete: !HAS_TEX.test(html) };
  }

  const known = spoken.get(html);

  if (known) {
    return known;
  }

  const state = { complete: true };
  // Math and images are spoken with a space either side, which a full stop or comma after them does not need.
  const text = speakNode(parse(html), state)
    .replace(/\s+/g, ' ')
    .replace(/ ([.,;:!?])/g, '$1')
    .trim();
  const speech = { text, complete: state.complete };

  if (speech.complete) {
    if (spoken.size >= MAX_SPOKEN) {
      spoken.clear();
    }

    spoken.set(html, speech);
  }

  return speech;
};
