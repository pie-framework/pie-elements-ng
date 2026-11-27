// What a screen reader hears for an answer choice: its text, an image by its alt text, and math by the
// speech the math renderer names math in a control with (`speakMathml`), so "c squared" where the
// choice shows c². Announcements and tile names use it alike, so they say what the tile itself says.

import { latexToMml, speakMathml } from '@pie-element/shared-math-rendering-mathjax';

/** The TeX MathJax finds in text, and what tells that a text has some. */
interface Dialect {
  /**
   * Its groups, in order: the TeX of \(…\), of \[…\], of $$…$$, then, where the dialect has them, of
   * $…$ and the character a \$ or \\ escape stands for.
   */
  tex: RegExp;
  groups: number;
  hasTex: RegExp;
}

/** MathJax's default delimiters, which delivery typesets with: \(…\), \[…\] and $$…$$. */
const DEFAULT_TEX: Dialect = {
  tex: /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$/g,
  groups: 3,
  hasTex: /\\\(|\\\[|\$\$/,
};

/**
 * Those and $…$, as MathJax typesets them on a page that opts in to single dollars: $$ opens display
 * math before $ opens inline math, and an escaped \$ or \\ is that character, so it opens nothing.
 */
const SINGLE_DOLLAR_TEX: Dialect = {
  tex: /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\$((?:\\[\s\S]|[^\\$])+?)\$|\\([\\$])/g,
  groups: 5,
  hasTex: /\\\(|\\\[|\$/,
};

// The legacy renderer's page options, which the math renderer and pie-players read the opt-in from.
const PAGE_OPTIONS_KEY = '@pie-lib/math-rendering@2';

/** Whether the page has the math renderer typeset $…$ too. Read on each call, as the renderer reads it then. */
const pageUsesSingleDollar = (): boolean => {
  const page = globalThis as { [PAGE_OPTIONS_KEY]?: { opts?: { useSingleDollar?: unknown } } };

  return Boolean(page[PAGE_OPTIONS_KEY]?.opts?.useSingleDollar);
};

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

interface SpeechState {
  complete: boolean;
  dialect: Dialect;
}

const speakNode = (node: Node, state: SpeechState): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    const { tex, groups } = state.dialect;

    return (node.textContent ?? '').replace(tex, (_source, ...rest) => {
      // After its groups, a replacer is passed the offset and the whole string.
      const [inline, display, dollars, single, escaped] = rest.slice(0, groups) as (string | undefined)[];

      if (escaped !== undefined) {
        return escaped;
      }

      const latex = (inline ?? display ?? dollars ?? single ?? '').trim();
      const speech = speakLatex(latex, display !== undefined || dollars !== undefined);

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

    return speakNode(
      element.ownerDocument.createTextNode(state.dialect.hasTex.test(raw) ? raw : `\\(${raw}\\)`),
      state,
    );
  }

  if (element.classList.contains('mathjax_ignore')) {
    return element.textContent ?? '';
  }

  const words = Array.from(element.childNodes, (child) => speakNode(child, state)).join('');

  return BREAKS.has(name) ? ` ${words} ` : words;
};

// Every tile and blank works its name out on each render, so finished speech is kept, by the HTML it was
// made from and whether $…$ was math. Unfinished speech is not kept: it changes once the math renderer
// has started.
const spoken = new Map<string, ChoiceSpeech>();
const MAX_SPOKEN = 500;

/** How a screen reader should hear the choice whose authored HTML is `html`. */
export const speakChoice = (html?: string): ChoiceSpeech => {
  if (!html) {
    return { text: '', complete: true };
  }

  const singleDollar = pageUsesSingleDollar();
  const dialect = singleDollar ? SINGLE_DOLLAR_TEX : DEFAULT_TEX;

  // Outside a browser there is no math renderer either; the tags go and any TeX counts as unspoken.
  if (typeof DOMParser === 'undefined') {
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    return { text, complete: !dialect.hasTex.test(html) };
  }

  const key = `${singleDollar ? '$' : '-'}${html}`;
  const known = spoken.get(key);

  if (known) {
    return known;
  }

  const state: SpeechState = { complete: true, dialect };
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

    spoken.set(key, speech);
  }

  return speech;
};
