/**
 * MathJax math renderer adapter
 *
 * Wraps the upstream PIE MathJax implementation (~2.7MB bundle)
 * Provides full-featured math rendering with accessibility support.
 */

import type { MathRenderer } from '@pie-element/shared-math-rendering-core';
import type { MathjaxOptions } from './types';

interface MathJaxTexConfig {
  inlineMath?: [string, string][];
  displayMath?: [string, string][];
  processEscapes?: boolean;
  packages?: string[];
  macros?: Record<string, string>;
}

interface MathJaxConfig {
  tex?: MathJaxTexConfig;
  options?: {
    enableMenu?: boolean;
    enableExplorer?: boolean;
  };
  startup?: {
    ready?: () => void;
    defaultReady?: () => void;
  };
  chtml?: {
    fontURL?: string;
  };
}

interface MathJaxInstance {
  version?: string;
  tex?: MathJaxTexConfig;
  options?: {
    enableMenu?: boolean;
    enableExplorer?: boolean;
  };
  startup: {
    ready?: () => void;
    defaultReady: () => void;
  };
  typesetPromise?: (elements?: Element[]) => Promise<void>;
}

declare global {
  interface Window {
    MathJax?: MathJaxInstance;
  }
}

const DEFAULT_MATHJAX_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js';

let mathjaxLoading: Promise<void> | null = null;

function ensureMathjaxLoaded(options: MathjaxOptions): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.MathJax?.version) {
    return Promise.resolve();
  }

  if (mathjaxLoading) {
    return mathjaxLoading;
  }

  mathjaxLoading = new Promise((resolve, reject) => {
    const { useSingleDollar = false, accessibility = true, loadFonts = true, srcUrl } = options;

    const config: MathJaxConfig = {
      tex: {
        packages: ['base', 'ams', 'autoload'],
        macros: {
          parallelogram: '\\lower.2em{\\Huge\\unicode{x25B1}}',
          overarc: '\\overparen',
          napprox: '\\not\\approx',
          longdiv: '\\enclose{longdiv}',
        },
      },
      options: {
        enableMenu: accessibility,
        enableExplorer: accessibility,
      },
      startup: {
        ready: () => {
          if (window.MathJax?.startup.defaultReady) {
            window.MathJax.startup.defaultReady();
            resolve();
          }
        },
        defaultReady: () => {},
      },
    };

    if (useSingleDollar && config.tex) {
      config.tex.inlineMath = [
        ['$', '$'],
        ['\\(', '\\)'],
      ];
      config.tex.processEscapes = true;
    }

    if (!loadFonts) {
      config.chtml = { fontURL: '' };
    }

    window.MathJax = config as MathJaxInstance;

    const script = document.createElement('script');
    script.src = srcUrl || DEFAULT_MATHJAX_SRC;
    script.async = true;
    script.onload = () => {
      setTimeout(resolve, 100);
    };
    script.onerror = () => {
      reject(new Error('Failed to load MathJax'));
    };
    document.head.appendChild(script);
  });

  return mathjaxLoading;
}

/**
 * Create a MathJax-based math renderer
 *
 * This is the full-featured renderer used by upstream PIE (~2.7MB).
 * Provides best accessibility and compatibility, but larger bundle size.
 *
 * @param options - MathJax configuration options
 * @returns Math renderer function
 *
 * @example
 * ```typescript
 * const renderer = createMathjaxRenderer({
 *   accessibility: true,
 *   useSingleDollar: false
 * });
 *
 * renderer(document.body);
 * ```
 */
export function createMathjaxRenderer(options: MathjaxOptions = {}): MathRenderer {
  return async (element: HTMLElement): Promise<void> => {
    await ensureMathjaxLoaded(options);

    if (!window.MathJax?.typesetPromise) {
      console.warn('[mathjax-renderer] MathJax not loaded or missing typesetPromise.');
      return;
    }

    await window.MathJax.typesetPromise([element]);
  };
}

/**
 * Get CSS URLs required by MathJax renderer
 *
 * @returns Array of CSS URLs needed for MathJax rendering (empty - MathJax handles its own CSS)
 */
export function getMathjaxCssUrls(): string[] {
  // MathJax loads its own fonts and styles dynamically
  return [];
}
