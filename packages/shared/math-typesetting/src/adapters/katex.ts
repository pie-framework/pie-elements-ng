/**
 * KaTeX math renderer adapter
 *
 * Provides KaTeX-based math rendering with lazy loading
 */

import type { MathRenderer, KatexOptions } from '../types';
import { loadCss } from '../utils/css-loader';
import { fixMathElements } from '../utils/normalization';
import { mmlToLatex } from '../utils/mml-to-latex';

const KATEX_CSS_URL = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
const KATEX_CSS_INTEGRITY =
  'sha384-GvrOXuhMATgEsSwCs4smul74iXGOixntILdUW9XmUC6+HX0sLNAK3q71HotJqlAn';

/**
 * Create a KaTeX-based math renderer
 *
 * This is the default renderer for PIE elements.
 * KaTeX is lazy-loaded on first use for better performance.
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
  } = options;

  let katex: any = null;
  let cssLoaded = false;

  return async (element: HTMLElement): Promise<void> => {
    // Lazy-load KaTeX on first use
    if (!katex) {
      katex = await import('katex');
    }

    // Load CSS once if requested
    if (shouldLoadCss && !cssLoaded) {
      await loadCss(KATEX_CSS_URL, {
        integrity: KATEX_CSS_INTEGRITY,
        crossOrigin: 'anonymous',
      });
      cssLoaded = true;
    }

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
  return [KATEX_CSS_URL];
}

// Default export for convenience
export default createKatexRenderer;
