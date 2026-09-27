import type { MathjaxOptions } from './types.js';

type MathJaxMacro = string | [string, number];

/**
 * `window.MathJax` in each state this adapter meets: a configuration object before a MathJax
 * script runs, the MathJax global afterwards, or a global without the component startup
 * (MathJax 2, or the MathJax 3 that the legacy @pie-lib/math-rendering renderer bundles).
 */
interface MathJaxGlobal {
  version?: string;
  loader?: { load?: string[]; failed?: (error: Error) => void };
  startup?: {
    typeset?: boolean;
    ready?: () => void;
    defaultReady?: () => void;
    promise?: Promise<unknown>;
  };
  tex?: {
    inlineMath?: [string, string][];
    processEscapes?: boolean;
    macros?: Record<string, MathJaxMacro>;
  };
  options?: {
    enableMenu?: boolean;
    menuOptions?: { settings?: Record<string, boolean> };
  };
  chtml?: { fontURL?: string };
  typesetPromise?: (elements?: Element[]) => Promise<void>;
}

/** TeX and MathML input, as the legacy renderer reads. `srcUrl` overrides it. */
const DEFAULT_MATHJAX_SRC = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-mml-chtml.js';

/** The macros the legacy renderer defines, which authored content relies on. */
const LEGACY_MACROS: Record<string, MathJaxMacro> = {
  parallelogram: '\\lower.2em{\\Huge\\unicode{x25B1}}',
  overarc: '\\overparen',
  napprox: '\\not\\approx',
  longdiv: '\\enclose{longdiv}',
  abs: ['\\left|#1\\right|', 1],
};

const SINGLE_DOLLAR_WARNING =
  '[math-rendering] using $ is not advisable, please use $$..$$ or \\(...\\)';

/**
 * Text MathJax's TeX input typesets with the delimiters configured here: \(…\), \[…\], $$…$$,
 * \$ escapes, environments and references, plus $…$ when single dollars are on.
 */
const TEX_MARKERS = /\\\(|\\\[|\$\$|\\\$|\\begin\{|\\(?:eq)?ref\{/;
const TEX_MARKERS_WITH_SINGLE_DOLLAR = /\\\(|\\\[|\$|\\begin\{|\\(?:eq)?ref\{/;

const NEWLINE_BLOCK = /\\embed\{newLine\}\[\]/g;

const LEGACY_DELIMITERS: [string, string][] = [
  ['$$', '$$'],
  ['$', '$'],
  ['\\[', '\\]'],
  ['\\(', '\\)'],
];

// Every element bundles its own copy of this module, so the load in flight is kept on the page
// rather than in the module: a second MathJax startup on one page throws "State ASSISTIVEMML
// already exists".
const MATHJAX_LOADING: unique symbol = Symbol.for(
  '@pie-element/shared-math-rendering-mathjax/loading'
);

type LoadingRegistry = { [MATHJAX_LOADING]?: Promise<void> };

function pageMathJax(): MathJaxGlobal | undefined {
  return (window as { MathJax?: MathJaxGlobal }).MathJax;
}

function unwrapLegacyDelimiters(content: string): string {
  const latex = content.includes('\\displaystyle')
    ? content.replace('\\displaystyle', '').trim()
    : content;
  for (const [open, close] of LEGACY_DELIMITERS) {
    if (latex.startsWith(open) && latex.endsWith(close)) {
      return latex.substring(open.length, latex.length - close.length);
    }
  }
  return latex;
}

/**
 * Rewrites the LaTeX of each `[data-latex]` element as inline math and marks it handled, as the
 * legacy renderer does, so authored math spans typeset whatever delimiters they were saved with.
 * MathJax 4 sets `data-latex` on the nodes of its own output too; those are left alone.
 */
function wrapLatexElements(root: Element): void {
  for (const element of root.querySelectorAll<HTMLElement>('[data-latex]')) {
    if (element.dataset.mathHandled || element.closest('mjx-container')) continue;
    const latex = element.textContent;
    if (!latex) continue;
    element.textContent = `\\(${unwrapLegacyDelimiters(latex)}\\)`.replace(
      NEWLINE_BLOCK,
      '\\newline '
    );
    element.dataset.mathHandled = 'true';
  }
}

function containsMath(root: Element, useSingleDollar: boolean): boolean {
  for (const math of root.querySelectorAll('math')) {
    if (!math.closest('mjx-assistive-mml')) return true;
  }
  const markers = useSingleDollar ? TEX_MARKERS_WITH_SINGLE_DOLLAR : TEX_MARKERS;
  return markers.test(root.textContent ?? '');
}

function injectMathjax(options: MathjaxOptions): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const { useSingleDollar = false, accessibility = true, loadFonts = true, srcUrl } = options;

    const config: MathJaxGlobal = {
      loader: {
        load: accessibility ? ['a11y/assistive-mml'] : [],
        failed: (error) => reject(error),
      },
      startup: {
        // Typeset only the elements the renderer is given, never the host page.
        typeset: false,
        ready: () => {
          const startup = pageMathJax()?.startup;
          startup?.defaultReady?.();
          Promise.resolve(startup?.promise).then(() => resolve(), reject);
        },
      },
      tex: { macros: { ...LEGACY_MACROS } },
      options: {
        enableMenu: accessibility,
        // The menu settings decide MathJax 4's accessibility output. These reproduce the legacy
        // renderer's: hidden MathML for screen readers, math outside the tab order, and no
        // generated speech. The legacy renderer configures SRE speech, but it treats MathJax's
        // first enrichment retry as a failure and turns enrichment off for the page. With
        // enrichment off MathJax starts no speech web worker, which a CSP can block; a blocked
        // worker or speech-rule fetch stalls typesetting for the rest of the page.
        menuOptions: {
          settings: { assistiveMml: accessibility, enrich: false, inTabOrder: false },
        },
      },
    };

    if (useSingleDollar && config.tex) {
      console.warn(SINGLE_DOLLAR_WARNING);
      config.tex.inlineMath = [
        ['$', '$'],
        ['\\(', '\\)'],
      ];
      config.tex.processEscapes = true;
    }

    if (!loadFonts) {
      config.chtml = { fontURL: '' };
    }

    (window as { MathJax?: MathJaxGlobal }).MathJax = config;

    const script = document.createElement('script');
    script.src = srcUrl || DEFAULT_MATHJAX_SRC;
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load MathJax'));
    document.head.appendChild(script);
  });
}

/** Resolves once the MathJax the page configured itself has started. */
function awaitPageMathjax(config: MathJaxGlobal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const startupConfig = config.startup ?? {};
    config.startup = startupConfig;
    const pageReady = startupConfig.ready;
    startupConfig.ready = () => {
      const startup = pageMathJax()?.startup;
      if (pageReady) {
        pageReady.call(startupConfig);
      } else {
        startup?.defaultReady?.();
      }
      Promise.resolve(startup?.promise).then(() => resolve(), reject);
    };
  });
}

function whenMathjaxStarted(options: MathjaxOptions): Promise<void> {
  const existing = pageMathJax();
  if (!existing) return injectMathjax(options);
  // A configuration object: the page loads MathJax itself.
  if (!existing.version) return awaitPageMathjax(existing);
  // A MathJax 3 or 4 build is on the page: use it once its startup completes.
  if (existing.startup?.promise) {
    return Promise.resolve(existing.startup.promise).then(() => undefined);
  }
  // A MathJax global without the component startup (MathJax 2, or the legacy renderer's
  // bundled MathJax 3) cannot typeset for this adapter, and loading MathJax would replace it.
  return Promise.resolve();
}

function startMathjax(options: MathjaxOptions): Promise<void> {
  return whenMathjaxStarted(options).then(() => {
    if (typeof pageMathJax()?.typesetPromise !== 'function') {
      console.warn(
        '[mathjax-renderer] MathJax on this page has no typesetPromise; math stays untypeset.'
      );
    }
  });
}

function ensureMathjax(options: MathjaxOptions): Promise<void> {
  const registry = globalThis as LoadingRegistry;
  let loading = registry[MATHJAX_LOADING];
  if (!loading) {
    loading = startMathjax(options);
    registry[MATHJAX_LOADING] = loading;
  }
  return loading;
}

/**
 * Create a MathJax renderer function.
 *
 * MathJax loads once per page, the first time an element holds math, from `srcUrl` or MathJax
 * 4.1.3 on jsDelivr. A MathJax the page already has, or is loading, is used instead.
 *
 * @param options - Renderer options
 * @returns Renderer function that typesets math in an element
 */
export function createMathjaxRenderer(
  options: MathjaxOptions = {}
): (element: HTMLElement) => Promise<void> {
  const useSingleDollar = options.useSingleDollar ?? false;

  return async (element: HTMLElement) => {
    if (typeof window === 'undefined') return;

    wrapLatexElements(element);
    if (!containsMath(element, useSingleDollar)) return;

    await ensureMathjax(options);
    const mathJax = pageMathJax();
    // A copy of the adapter from an earlier release may have resolved before startup finished.
    await mathJax?.startup?.promise;
    if (typeof mathJax?.typesetPromise !== 'function') return;

    await mathJax.typesetPromise([element]);
  };
}

/**
 * Get CSS URLs for MathJax
 * MathJax v4 injects its own styles, so no external CSS needed
 */
export function getMathjaxCssUrls(): string[] {
  return [];
}
