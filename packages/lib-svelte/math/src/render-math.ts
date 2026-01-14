/**
 * MathJax 4 Rendering
 * Modern implementation using MathJax 4.1.0
 */

import { unWrapMath, wrapMath } from './normalization';

export interface MathRenderOptions {
  useSingleDollar?: boolean;
}

const NEWLINE_BLOCK_REGEX = /\\embed\{newLine\}\[\]/g;
const NEWLINE_LATEX = '\\newline ';

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

/**
 * Initialize MathJax 4
 */
function initializeMathJax(opts?: MathRenderOptions): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // Check if already initialized
  if (window.MathJax?.version) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    // Configure MathJax before loading
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
        enableMenu: true,
        enableExplorer: true,
      },
      startup: {
        ready: () => {
          if (window.MathJax?.startup.defaultReady) {
            window.MathJax.startup.defaultReady();
            resolve();
          }
        },
        defaultReady: () => {}, // Placeholder, will be set by MathJax
      },
    };

    // Add single dollar support if requested
    if (opts?.useSingleDollar && config.tex) {
      console.warn('[math-rendering] using $ is not advisable, please use $$..$$ or \\(...\\)');
      config.tex.inlineMath = [
        ['$', '$'],
        ['\\(', '\\)'],
      ];
      config.tex.processEscapes = true;
    }

    window.MathJax = config as MathJaxInstance;

    // Load MathJax from CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-chtml.js';
    script.async = true;
    script.onload = () => {
      // MathJax 4 calls startup.ready automatically
      setTimeout(resolve, 100);
    };
    script.onerror = () => {
      reject(new Error('Failed to load MathJax'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Fix a single math element by wrapping/unwrapping math delimiters
 */
export function fixMathElement(element: HTMLElement): void {
  if (element.dataset.mathHandled) {
    return;
  }

  const property: 'textContent' | 'innerText' = element.textContent ? 'textContent' : 'innerText';
  const content = element[property];

  if (content) {
    const unwrapped = unWrapMath(content).unwrapped;
    const wrapped = wrapMath(unwrapped);
    // Replace custom embedded elements with valid LaTeX
    const fixed = wrapped.replace(NEWLINE_BLOCK_REGEX, NEWLINE_LATEX);
    element[property] = fixed;
    element.dataset.mathHandled = 'true';
  }
}

/**
 * Fix all math elements with data-latex attribute
 */
export function fixMathElements(el: Document | Element = document): void {
  const mathElements = el.querySelectorAll('[data-latex]');
  for (const item of mathElements) {
    fixMathElement(item as HTMLElement);
  }
}

/**
 * Render math in an element or elements using MathJax 4
 */
export default async function renderMath(
  el?: Element | Element[] | string,
  renderOpts?: MathRenderOptions
): Promise<string | undefined> {
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize MathJax if needed
  await initializeMathJax(renderOpts);

  if (!window.MathJax) {
    console.error('MathJax not loaded');
    return;
  }

  const isString = typeof el === 'string';
  let executeOn: Element | Document = document.body;

  if (isString) {
    const div = document.createElement('div');
    div.innerHTML = el;
    executeOn = div;
  }

  fixMathElements(executeOn);

  if (isString) {
    // For string input, typeset and return MathML
    await window.MathJax.typesetPromise?.([executeOn]);
    return executeOn.innerHTML;
  }

  if (!el) {
    console.warn('renderMath: el is undefined');
    return;
  }

  // Typeset the element(s)
  if (el instanceof Element) {
    await window.MathJax.typesetPromise?.([el]);
  } else if (Array.isArray(el)) {
    await window.MathJax.typesetPromise?.(el);
  }
}
