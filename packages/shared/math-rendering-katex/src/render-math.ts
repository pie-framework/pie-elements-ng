/**
 * Math rendering using KaTeX
 *
 * Framework-agnostic implementation that works in any browser environment.
 * Handles both LaTeX (via data-latex attributes) and MathML elements.
 *
 * Note: KaTeX CSS is loaded automatically on first render.

 */

import katex from 'katex';
import { loadCss, isCssLoaded } from '@pie-element/shared-math-rendering';
import { mmlToLatex } from './mml-to-latex';
import { wrapMath, unWrapMath } from './normalization';

/**
 * Simple logger for development
 * Only logs in development mode to avoid console noise in production
 */
const log = (...args: unknown[]): void => {
  // Check for development mode (Vite sets import.meta.env.DEV, but in production builds it's undefined)
  const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
  if (isDev) {
    console.log('[pie-lib:math-rendering]', ...args);
  }
};

const DEFAULT_KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css';
const NEWLINE_BLOCK_REGEX = /\\embed\{newLine\}\[\]/g;
const NEWLINE_LATEX = '\\newline ';

/**
 * Fix a single math element by wrapping/unwrapping its content
 */
export const fixMathElement = (element: Element): void => {
  const el = element as HTMLElement;
  if (el.dataset.mathHandled) {
    return;
  }

  let property: 'innerText' | 'textContent' = 'innerText';

  if (el.textContent) {
    property = 'textContent';
  }

  if (el[property]) {
    el[property] = wrapMath(unWrapMath(el[property] as string).unwrapped);
    // Replace custom newline blocks with valid LaTeX
    el[property] = (el[property] as string).replace(NEWLINE_BLOCK_REGEX, NEWLINE_LATEX);
    el.dataset.mathHandled = 'true';
  }
};

/**
 * Fix all math elements in a container
 */
export const fixMathElements = (el: Document | Element = document): void => {
  const mathElements = el.querySelectorAll('[data-latex]');
  mathElements.forEach((item) => {
    fixMathElement(item);
  });
};

/**
 * Find and wrap LaTeX delimiters in text nodes
 * Processes \(...\) and \[...\] delimiters
 *
 * WARNING: This modifies the DOM. Only call it ONCE on initial HTML, not in reactive render loops.
 * Marks the element as processed to prevent re-processing.
 */
const wrapLatexInTextNodes = (element: Element): void => {
  // Skip if already processed
  if ((element as HTMLElement).dataset?.mathWrapped === 'true') {
    return;
  }
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  const nodesToReplace: Array<{ node: Node; content: string }> = [];

  let node: Node | null = walker.nextNode();
  while (node) {
    const text = node.textContent || '';
    const parent = node.parentElement;

    // Skip if parent already has data-latex attribute (already processed)
    // or if parent is inside a KaTeX rendered element
    if (
      parent &&
      !parent.hasAttribute('data-latex') &&
      !parent.closest('.katex') &&
      !parent.closest('[data-latex]')
    ) {
      // Check if text contains LaTeX delimiters
      if (text.includes('\\(') || text.includes('\\[') || text.includes('$')) {
        nodesToReplace.push({ node, content: text });
      }
    }
    node = walker.nextNode();
  }

  // Replace text nodes with elements containing data-latex attributes
  nodesToReplace.forEach(({ node, content }) => {
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    // Match \(...\) or \[...\] or $...$ (but not $$...$$)
    const latexRegex = /(\\\(.*?\\\)|\\\[.*?\\\]|\$(?!\$).*?\$(?!\$))/g;
    let match: RegExpExecArray | null = latexRegex.exec(content);

    while (match !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(content.substring(lastIndex, match.index)));
      }

      // Create span with data-latex attribute
      const span = document.createElement('span');
      span.setAttribute('data-latex', '');
      span.textContent = match[0];
      fragment.appendChild(span);

      lastIndex = match.index + match[0].length;
      match = latexRegex.exec(content);
    }

    // Add remaining text after last match
    if (lastIndex < content.length) {
      fragment.appendChild(document.createTextNode(content.substring(lastIndex)));
    }

    // Replace the text node with the fragment
    if (node.parentNode && fragment.childNodes.length > 0) {
      node.parentNode.replaceChild(fragment, node);
    }
  });

  // Mark as processed
  (element as HTMLElement).dataset.mathWrapped = 'true';
};

/**
 * Render math in a DOM element or HTML string
 *
 * This function finds all elements with data-latex attributes and renders them using KaTeX.
 * It also handles MathML elements by converting them to LaTeX first.
 * Additionally, it automatically wraps LaTeX delimiters found in text nodes.
 *
 * @param el - DOM element, HTML string, or undefined (defaults to document.body)
 * @returns If el is a string, returns the rendered HTML. Otherwise, renders in place.
 */
const renderMath = (el?: Element | string): string | undefined => {
  if (typeof window === 'undefined') {
    return;
  }

  const isString = typeof el === 'string';
  let executeOn: Element = isString
    ? (() => {
        const div = document.createElement('div');
        div.innerHTML = el;
        return div;
      })()
    : el || document.body;

  if (!isCssLoaded(DEFAULT_KATEX_CSS_URL)) {
    loadCss(DEFAULT_KATEX_CSS_URL).catch(() => {
      // CSS loading failure shouldn't prevent math rendering
    });
  }

  // Wrap LaTeX delimiters in text nodes (only runs once per element)
  wrapLatexInTextNodes(executeOn);

  // Fix math elements (processes existing [data-latex] attributes only)
  fixMathElements(executeOn);

  // Find all elements with data-latex attribute
  const mathElements = executeOn.querySelectorAll('[data-latex]');

  mathElements.forEach((element) => {
    const latex = element.textContent || '';
    const renderedKey = (element as HTMLElement).dataset.katexRendered;
    if (renderedKey === latex) {
      return;
    }
    const trimmed = latex.trim();
    const isDisplay =
      trimmed.startsWith('\\[') || trimmed.startsWith('$$') || element.tagName === 'DIV';
    const { unwrapped } = unWrapMath(latex);
    try {
      katex.render(unwrapped, element as HTMLElement, {
        displayMode: isDisplay,
        throwOnError: false,
        trust: true,
        output: 'html',
      });
      (element as HTMLElement).dataset.katexRendered = latex;
    } catch (e) {
      log('KaTeX error:', e);
      element.textContent = latex; // Fallback: show the raw LaTeX
    }
  });

  // Also process MathML if present
  const mmlElements = executeOn.querySelectorAll('math');
  mmlElements.forEach((element) => {
    try {
      const mathml = element.outerHTML;
      const latex = mmlToLatex(mathml);
      const container = document.createElement('span');
      element.parentNode?.replaceChild(container, element);
      katex.render(latex, container, {
        displayMode: element.getAttribute('display') === 'block',
        throwOnError: false,
        trust: true,
      });
    } catch (e) {
      log('MathML conversion error:', e);
    }
  });

  if (isString) {
    return executeOn.innerHTML;
  }
};

/**
 * Preprocesses HTML to add data-latex attributes to LaTeX delimiters.
 * This should be called BEFORE passing HTML to renderMath.
 *
 * Use this for legacy content that doesn't have data-latex attributes.
 * New content from TipTap/MathQuill should already have these attributes.
 *
 * @param html - HTML string with LaTeX delimiters like \(...\) or $...$
 * @returns HTML with <span data-latex=""> wrapped around LaTeX
 */
export const preprocessMathHtml = (html: string): string => {
  if (!html) return html;

  // Match \(...\) or \[...\] or $...$ (but not $$...$$)
  const latexRegex = /(\\$$.*?\\$$|\\$.*?\\$|\$(?!\$).*?\$(?!\$))/g;

  return html.replace(latexRegex, (match) => {
    // Don't wrap if already inside a data-latex span
    return `<span data-latex="">${match}</span>`;
  });
};

export { renderMath };
