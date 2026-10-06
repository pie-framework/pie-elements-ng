import {
  conflictingMathjax3Version,
  engineMathJax,
  FOREIGN_OUTPUT_STYLESHEETS,
  loadingRegistry,
  loadMathJax,
  OWN_STYLESHEET_ID,
} from './engine/page.js';
import { rewriteElementaryMath } from './elementary-math.js';
import { injectExplorerStyles } from './explorer-styles.js';
import { unprefixMathml } from './mathml.js';
import type { MathjaxOptions } from './types.js';
import { reportUnsupportedPage } from './unsupported-page.js';

export type MathJaxMacro = string | [string, number];

export interface MathItem {
  typesetRoot?: Element | null;
  state?: () => number;
  clear?: () => void;
}

/** The parts of MathJax's `startup.document` this adapter uses. */
export interface MathDocument {
  math?: Iterable<MathItem> & { remove?: (...items: MathItem[]) => unknown };
  outputJax?: { chtmlStyles?: Element | null };
  addStyles?: (styles: Record<string, Record<string, string>>) => void;
  addRenderAction?: (
    id: string,
    priority: number,
    renderDoc: (document: MathDocument) => boolean,
    renderMath: (math: MathItem, document: MathDocument) => boolean
  ) => void;
}

/**
 * `window.MathJax` in each state this adapter meets: a configuration object before a MathJax
 * script runs, the MathJax global afterwards, or a global without the component startup
 * (MathJax 2, or the MathJax 3 that the legacy @pie-lib/math-rendering renderer bundles).
 */
export interface MathJaxGlobal {
  version?: string;
  loader?: {
    load?: string[];
    failed?: (error: Error) => void;
    'output/svg'?: { ready?: (name: string) => string };
  };
  startup?: {
    typeset?: boolean;
    ready?: () => void;
    defaultReady?: () => void;
    promise?: Promise<unknown>;
    document?: MathDocument;
  };
  tex?: {
    inlineMath?: [string, string][];
    processEscapes?: boolean;
    macros?: Record<string, MathJaxMacro>;
  };
  options?: {
    enableMenu?: boolean;
    menuOptions?: { settings?: Record<string, boolean> };
    a11y?: { inTabOrder?: boolean };
  };
  output?: { displayOverflow?: string };
  chtml?: { fontURL?: string };
  typesetPromise?: (elements?: Element[]) => Promise<void>;
  typesetClear?: (elements?: Element[]) => void;
  /** The component build's module tree. */
  _?: {
    output?: {
      chtml_ts?: { CHTML?: { STYLESHEETID?: string } };
      svg_ts?: { SVG?: { STYLESHEETID?: string } };
    };
    ui?: { menu?: { Menu?: { Menu?: { MENU_STORAGE?: string } } } };
  };
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

// Where the load in flight is kept is the engine's: on the page for the page's MathJax, in the
// module for a bundled one.
const MATHJAX_LOADING: unique symbol = Symbol.for(
  '@pie-element/shared-math-rendering-mathjax/loading'
);

type LoadingRegistry = { [MATHJAX_LOADING]?: Promise<void> };

/**
 * MathJax 3 and 4 both replace any `<style id="MJX-CHTML-styles">` in `<head>` with their own, so
 * whichever engine renders second deletes the other's styles; the same holds for SVG output's
 * `MJX-SVG-styles`. The MathJax this adapter uses takes its own ids instead: the engine's for
 * CHTML, and this one for the SVG output the page's MathJax loads from its menu.
 */
const SHARED_STYLESHEET_ID = 'MJX-CHTML-styles';
const OWN_SVG_STYLESHEET_ID = 'PIE-MJX-SVG-styles';

/**
 * MathJax 3 and 4 both save a student's menu settings under `MathJax-Menu-Settings` in
 * localStorage, and read them back on the next load, so settings MathJax 3 saved change MathJax 4's
 * output: a stored SVG renderer switches it to SVG, a stored `assistiveMml: false` removes its
 * hidden MathML. The MathJax this adapter loads uses its own key instead.
 */
const OWN_MENU_STORAGE = 'PIE-MathJax-Menu-Settings';

/**
 * MathJax breaks displayed math to the width its container has at typeset, and does not break it
 * again: math typeset while hidden is not broken, and math the page later narrows, on zoom for one,
 * is not broken to the new width. Displayed math that does not fit scrolls in its own container,
 * under the rule MathJax's `displayOverflow: 'scroll'` applies to all of it.
 */
const LINEBREAK_FALLBACK_STYLES = {
  'mjx-container[overflow="linebreak"][display]': {
    overflow: 'auto clip',
    'min-width': 'initial !important',
  },
};

/** MathJax's STATE.INSERTED: the item's output is in the document. */
const STATE_INSERTED = 200;

/** After MathJax's own `update` action, at STATE.INSERTED. */
const STRIP_LATEX_PRIORITY = STATE_INSERTED + 1;

/**
 * MathJax 4 records each node's TeX source in `data-latex` and `data-latex-item`, and carries them
 * into its output. The legacy MathJax 3 renderer rewrites the text of every `[data-latex]` element
 * on the page as TeX source, so they are removed from the output. Removing them in a TeX filter
 * breaks MathJax 4's own parsing.
 */
function stripLatexAttributes(root: Element): void {
  const containers = [
    ...(root.matches('mjx-container') ? [root] : []),
    ...root.querySelectorAll('mjx-container'),
  ];
  for (const container of containers) {
    for (const node of [
      container,
      ...container.querySelectorAll('[data-latex],[data-latex-item]'),
    ]) {
      node.removeAttribute('data-latex');
      node.removeAttribute('data-latex-item');
    }
  }
}

/** `latex` without the pair of legacy delimiters around all of it, if it has one. */
export function stripLegacyDelimiters(latex: string): string {
  for (const [open, close] of LEGACY_DELIMITERS) {
    if (latex.startsWith(open) && latex.endsWith(close)) {
      return latex.substring(open.length, latex.length - close.length);
    }
  }
  return latex;
}

function unwrapLegacyDelimiters(content: string): string {
  const latex = content.includes('\\displaystyle')
    ? content.replace('\\displaystyle', '').trim()
    : content;
  return stripLegacyDelimiters(latex);
}

/** MathJax's default `ignoreHtmlClass` and `processHtmlClass`, which this adapter keeps. */
const IGNORE_CLASS = 'mathjax_ignore';
const PROCESS_CLASS = 'mathjax_process';

/**
 * Whether typesetting `root` skips `element`. As in MathJax's own traversal, the nearest of the
 * two classes on `element` or an ancestor up to `root` decides, and the process class wins.
 */
function isIgnored(element: Element, root: Element): boolean {
  const scope = element.closest(`.${IGNORE_CLASS}, .${PROCESS_CLASS}`);
  return scope !== null && root.contains(scope) && !scope.classList.contains(PROCESS_CLASS);
}

/**
 * Rewrites the LaTeX of each `[data-latex]` element as inline math and marks it handled, as the
 * legacy renderer does, so authored math spans typeset whatever delimiters they were saved with.
 * MathJax 4 sets `data-latex` on the nodes of its own output too; those are left alone, as are
 * elements MathJax will not typeset.
 */
function wrapLatexElements(root: Element): void {
  for (const element of root.querySelectorAll<HTMLElement>('[data-latex]')) {
    if (element.dataset.mathHandled || element.closest('mjx-container')) continue;
    if (isIgnored(element, root)) continue;
    const latex = element.textContent;
    if (!latex) continue;
    element.textContent = `\\(${unwrapLegacyDelimiters(latex)}\\)`.replace(
      NEWLINE_BLOCK,
      '\\newline '
    );
    element.dataset.mathHandled = 'true';
  }
}

/**
 * Sets `displaystyle="true"` on each authored `<math>`, as the legacy renderer does, so MathML
 * fractions, sums and limits keep display size in running text. MathJax's own output is left alone.
 */
function useDisplayStyle(root: Element): void {
  for (const math of root.querySelectorAll('math')) {
    if (!math.closest('mjx-container')) math.setAttribute('displaystyle', 'true');
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
        // The menu loads SVG output when a student picks it as the renderer.
        'output/svg': {
          ready: (name) => {
            const mathJax = engineMathJax();
            if (isMathjax4(mathJax)) useOwnStylesheetIds(mathJax);
            return name;
          },
        },
      },
      startup: {
        // Typeset only the elements the renderer is given, never the host page.
        typeset: false,
        ready: () => {
          const mathJax = engineMathJax();
          const startup = mathJax?.startup;
          const isolate = isMathjax4(mathJax);
          if (isolate) {
            useOwnStylesheetIds(mathJax);
            useOwnMenuStorage(mathJax);
          }
          startup?.defaultReady?.();
          if (isolate) {
            isolateOutput(startup?.document);
            startup?.document?.addStyles?.(LINEBREAK_FALLBACK_STYLES);
          }
          Promise.resolve(startup?.promise).then(() => resolve(), reject);
        },
      },
      tex: { macros: { ...LEGACY_MACROS } },
      output: { displayOverflow: 'linebreak' },
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
        // The explorer, which attaches once a student turns on speech or braille, takes its tab
        // order from here; the menu setting does not reach it.
        a11y: { inTabOrder: false },
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

    loadMathJax(config, srcUrl || DEFAULT_MATHJAX_SRC).catch(reject);
  });
}

/** `srcUrl` may name another MathJax; only a 4.x build is known to take the isolating changes. */
function isMathjax4(mathJax: MathJaxGlobal | undefined): boolean {
  return Boolean(mathJax?.version?.startsWith('4.'));
}

/** Gives each output the MathJax build holds its own stylesheet id. */
function useOwnStylesheetIds(mathJax: MathJaxGlobal | undefined): void {
  const output = mathJax?._?.output;
  const chtml = output?.chtml_ts?.CHTML;
  if (chtml) chtml.STYLESHEETID = OWN_STYLESHEET_ID;
  const svg = output?.svg_ts?.SVG;
  if (svg) svg.STYLESHEETID = OWN_SVG_STYLESHEET_ID;
}

/**
 * Stores the menu settings of the MathJax this adapter loaded under their own key, and drops a
 * stored `assistiveMml` so the configuration decides hidden MathML on every load.
 */
function useOwnMenuStorage(mathJax: MathJaxGlobal | undefined): void {
  const menu = mathJax?._?.ui?.menu?.Menu?.Menu;
  if (!menu) return;
  menu.MENU_STORAGE = OWN_MENU_STORAGE;
  try {
    const stored = localStorage.getItem(OWN_MENU_STORAGE);
    if (!stored) return;
    const { assistiveMml, ...settings } = JSON.parse(stored);
    if (assistiveMml === undefined) return;
    if (Object.keys(settings).length) {
      localStorage.setItem(OWN_MENU_STORAGE, JSON.stringify(settings));
    } else {
      localStorage.removeItem(OWN_MENU_STORAGE);
    }
  } catch {
    // Storage is unavailable or holds something unreadable; MathJax handles either itself.
  }
}

/**
 * Keeps the output of the MathJax this adapter loaded out of reach of another MathJax: strips
 * `data-latex` from every render, rerenders from the menu and explorer included, renames a
 * stylesheet inserted before the id changed, and reports another MathJax's output stylesheet.
 */
function isolateOutput(mathDocument: MathDocument | undefined): void {
  if (!mathDocument) return;

  const stripped = new WeakSet<Element>();
  const strip = (math: MathItem) => {
    const root = math.typesetRoot;
    if (!root || stripped.has(root)) return;
    stripLatexAttributes(root);
    stripped.add(root);
  };
  mathDocument.addRenderAction?.(
    'pie-strip-latex',
    STRIP_LATEX_PRIORITY,
    (doc) => {
      for (const math of doc.math ?? []) strip(math);
      return false;
    },
    (math) => {
      const root = math.typesetRoot;
      if (root) stripLatexAttributes(root);
      return false;
    }
  );

  const sheet = mathDocument.outputJax?.chtmlStyles;
  if (sheet?.id === SHARED_STYLESHEET_ID) sheet.id = OWN_STYLESHEET_ID;

  watchForForeignStylesheets();
}

function isForeignStylesheet(node: Node): boolean {
  return node instanceof HTMLStyleElement && FOREIGN_OUTPUT_STYLESHEETS.includes(node.id);
}

function reportForeignStylesheet(sheet: HTMLStyleElement): void {
  reportUnsupportedPage(
    'foreign-output-stylesheet',
    `another MathJax added <style id="${sheet.id}"> to <head>`
  );
}

function watchForForeignStylesheets(): void {
  const head = document.head;
  const existing = [...head.children].find(isForeignStylesheet);
  if (existing) {
    reportForeignStylesheet(existing as HTMLStyleElement);
    return;
  }
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      const added = [...record.addedNodes].find(isForeignStylesheet);
      if (added) {
        reportForeignStylesheet(added as HTMLStyleElement);
        observer.disconnect();
        return;
      }
    }
  });
  observer.observe(head, { childList: true });
}

/**
 * Removes from MathJax's list the math whose output has left the page. MathJax keeps every item it
 * typesets until it is cleared, and a menu setting change rerenders them all. Math still on the
 * page stays listed, so menu changes keep reaching it. Output MathJax has not inserted yet, in a
 * typeset or rerender waiting on a font file, is detached too, so only inserted items qualify.
 * Each is cleared and removed as MathJax's own `clearMathItemsWithin` does.
 */
function clearRemovedMath(mathDocument: MathDocument | undefined): void {
  const list = mathDocument?.math;
  if (!list?.remove) return;
  const removed = [...list].filter(
    (item) => (item.state?.() ?? 0) >= STATE_INSERTED && item.typesetRoot?.isConnected === false
  );
  if (removed.length === 0) return;
  for (const item of [...removed].reverse()) item.clear?.();
  list.remove(...removed);
}

/** Resolves once the MathJax the page configured itself has started. */
function awaitPageMathjax(config: MathJaxGlobal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const startupConfig = config.startup ?? {};
    config.startup = startupConfig;
    const pageReady = startupConfig.ready;
    startupConfig.ready = () => {
      const startup = engineMathJax()?.startup;
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
  const existing = engineMathJax();
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
    if (typeof engineMathJax()?.typesetPromise !== 'function') {
      console.warn(
        '[mathjax-renderer] MathJax on this page has no typesetPromise; math stays untypeset.'
      );
    }
  });
}

function ensureMathjax(options: MathjaxOptions): Promise<void> {
  const registry = loadingRegistry as LoadingRegistry;
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
 * MathJax loads once per page, on the first render, from `srcUrl` or MathJax 4.1.3 on jsDelivr.
 * A MathJax the page already has, or is loading, is used instead. A render waits on the load only
 * when its element holds math.
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

    const mathjax3 = conflictingMathjax3Version();
    if (mathjax3)
      reportUnsupportedPage('mathjax-3-global', `window.MathJax is MathJax ${mathjax3}`);
    wrapLatexElements(element);
    unprefixMathml(element);
    useDisplayStyle(element);
    rewriteElementaryMath(element);
    // Whether any content on the page holds math is unknown up front, so the first render starts
    // the load and later math is typeset without waiting on the download.
    const loading = ensureMathjax(options);
    if (!containsMath(element, useSingleDollar)) {
      // A failed load rejects the renders that hold math.
      loading.catch(() => {});
      return;
    }

    await loading;
    const mathJax = engineMathJax();
    // A copy of the adapter from an earlier release may have resolved before startup finished.
    await mathJax?.startup?.promise;
    if (typeof mathJax?.typesetPromise !== 'function') return;

    injectExplorerStyles();
    clearRemovedMath(mathJax.startup?.document);
    try {
      await mathJax.typesetPromise([element]);
    } catch (error) {
      // MathJax keeps the math that failed listed and typesets it again with every later element.
      // MathJax 4.1.3 then fails it again when the failure was a font file, rejecting the typeset
      // of unrelated math (fixed upstream in mathjax/MathJax-src#1545).
      mathJax.typesetClear?.([element]);
      throw error;
    }
    // Also covers a MathJax 4 the page loaded itself, which has no render action from this adapter.
    stripLatexAttributes(element);
  };
}

/**
 * Get CSS URLs for MathJax
 * MathJax v4 injects its own styles, so no external CSS needed
 */
export function getMathjaxCssUrls(): string[] {
  return [];
}
