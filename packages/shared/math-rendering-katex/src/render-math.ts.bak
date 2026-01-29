/**
 * Math rendering using KaTeX
 *
 * Framework-agnostic implementation that works in any browser environment.
 * Handles both LaTeX (via data-latex attributes) and MathML elements.
 */

import katex from 'katex';
import 'katex/dist/katex.css';
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
 * Render math in a DOM element or HTML string
 *
 * This function finds all elements with data-latex attributes and renders them using KaTeX.
 * It also handles MathML elements by converting them to LaTeX first.
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

  // Fix math elements
  fixMathElements(executeOn);

  // Find all elements with data-latex attribute
  const mathElements = executeOn.querySelectorAll('[data-latex]');

  mathElements.forEach((element) => {
    const latex = element.textContent || '';
    try {
      katex.render(latex, element as HTMLElement, {
        displayMode: element.tagName === 'DIV',
        throwOnError: false,
        trust: true,
      });
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

export { renderMath };
