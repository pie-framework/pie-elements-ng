/**
 * KaTeX math renderer adapter
 *
 * Provides KaTeX-based math rendering with automatic LaTeX delimiter detection
 */

import type { MathRenderer } from '@pie-element/shared-math-rendering';
import { loadCss, fixMathElements, mmlToLatex } from '@pie-element/shared-math-rendering';
import katex from 'katex';
import type { KatexOptions } from './types';

const DEFAULT_KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex/dist/katex.min.css';

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
    const latexRegex = /(\\$$.*?\\$$|\\$.*?\\$|\\$(?!\\$).*?\\$(?!\\$))/g;
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
 * Create a KaTeX-based math renderer
 *
 * This is a fast, lightweight renderer (~100KB) for PIE elements.
 * KaTeX is a direct dependency of this package.
 *
 * @param options - KaTeX configuration options
 * @returns Math renderer function
 *
 * @example
 * ```typescript
 * const renderer = createKatexRenderer({
 *   loadCss: true,
 *   trust: true
 * });
 *
 * await renderer(document.body);
 * ```
 */
export function createKatexRenderer(options: KatexOptions = {}): MathRenderer {
  const {
    // Note: useSingleDollar is not currently used but reserved for future enhancement
    // useSingleDollar = true,
    throwOnError = false,
    trust = true,
    loadCss: shouldLoadCss = true,
    cssUrl = DEFAULT_KATEX_CSS_URL,
    cssIntegrity,
  } = options;

  let cssLoaded = false;

  return async (element: HTMLElement): Promise<void> => {
    // Load CSS once if requested
    if (shouldLoadCss && !cssLoaded) {
      await loadCss(cssUrl, {
        integrity: cssIntegrity,
        crossOrigin: 'anonymous',
      });
      cssLoaded = true;
    }

    // Wrap LaTeX delimiters in text nodes (only runs once per element)
    wrapLatexInTextNodes(element);

    // Normalize math elements
    fixMathElements(element);

    // Render LaTeX elements
    const latexElements = element.querySelectorAll('[data-latex]');
    latexElements.forEach((el) => {
      const latex = el.textContent || '';
      try {
        katex.render(latex, el as HTMLElement, {
          displayMode: el.tagName === 'DIV',
          throwOnError,
          trust,
        });
      } catch (e) {
        console.warn('[katex-renderer] Error rendering LaTeX:', e);
        el.textContent = latex; // Fallback to raw LaTeX
      }
    });

    // Convert and render MathML elements
    const mathmlElements = element.querySelectorAll('math');
    mathmlElements.forEach((el) => {
      try {
        const mathml = el.outerHTML;
        const latex = mmlToLatex(mathml);
        const container = document.createElement('span');
        el.parentNode?.replaceChild(container, el);
        katex.render(latex, container, {
          displayMode: el.getAttribute('display') === 'block',
          throwOnError,
          trust,
        });
      } catch (e) {
        console.warn('[katex-renderer] Error converting MathML:', e);
      }
    });
  };
}

/**
 * Get CSS URLs required by KaTeX renderer
 *
 * @returns Array of CSS URLs needed for KaTeX rendering
 */
export function getKatexCssUrls(): string[] {
  return [DEFAULT_KATEX_CSS_URL];
}
