import { speakMathml } from './math-speech.js';

export interface MathNameOptions {
  /**
   * Speaks one MathML `<math>` element. Defaults to the built-in English speaker; a host passes its
   * own to use SRE, another locale or ClearSpeak's full rule set. Returning nothing falls back to
   * the element's text.
   */
  speak?: (math: Element) => string | undefined;
}

const BLOCKS = new Set([
  'address',
  'article',
  'aside',
  'blockquote',
  'br',
  'dd',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figure',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'hr',
  'li',
  'ol',
  'p',
  'pre',
  'section',
  'table',
  'td',
  'th',
  'tr',
  'ul',
]);

const collapse = (value: string) => value.replace(/\s+/g, ' ').trim();

function isHidden(element: Element): boolean {
  return (
    element.getAttribute('aria-hidden') === 'true' ||
    (element as HTMLElement).hidden === true ||
    (element as HTMLElement).style?.display === 'none'
  );
}

/**
 * The hidden MathML MathJax leaves in a typeset `mjx-container`, which is where it keeps what
 * assistive technology reads; the visible glyphs are `aria-hidden`.
 */
function mathIn(element: Element): Element | null {
  return element.localName === 'math' ? element : element.querySelector('math');
}

/**
 * The accessible name of `content`'s children read as a browser would, except that math is spoken
 * from its MathML. Chrome leaves MathML out of the name of a button and of anything else that names
 * from its content, so a control holding only math has no name.
 */
function nameOf(
  node: Node,
  speak: (math: Element) => string | undefined,
  found: { math: boolean }
): string {
  if (node.nodeType === 3) return node.textContent ?? '';
  if (!(node instanceof Element) || isHidden(node)) return '';

  const math =
    node.localName === 'mjx-container' || node.localName === 'math' ? mathIn(node) : null;
  if (math) {
    const spoken = collapse(speak(math) ?? math.textContent ?? '');
    if (spoken) found.math = true;
    return ` ${spoken} `;
  }
  if (node.localName === 'mjx-container') return ' ';

  const label = node.getAttribute('aria-label')?.trim();
  if (label) return ` ${label} `;
  if (node.localName === 'img') return ` ${node.getAttribute('alt') ?? ''} `;

  const inner = [...node.childNodes].map((child) => nameOf(child, speak, found)).join('');
  return BLOCKS.has(node.localName) ? ` ${inner} ` : inner;
}

/**
 * The accessible name of a control from its rendered content, or undefined when the content holds
 * no math, which leaves the name to the browser. Plain text and math keep their order, so a
 * choice of `(9.7 + √25)` followed by `feet` reads as one phrase.
 *
 * Shaped as a `ContentNamer` for `useDraggableControl`, and usable for any control that names
 * itself from its content: the result goes in `aria-label`. Math is read from the hidden MathML
 * that MathJax adds to each `mjx-container`, so call this after the content is typeset.
 */
export function mathContentName(
  content: Element,
  options: MathNameOptions = {}
): string | undefined {
  const speak = options.speak ?? speakMathml;
  const found = { math: false };
  const name = collapse(
    [...content.childNodes].map((child) => nameOf(child, speak, found)).join('')
  );
  return found.math && name ? name : undefined;
}
