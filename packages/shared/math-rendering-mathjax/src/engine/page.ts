/**
 * The MathJax engine of the npm build: the page's `window.MathJax`, loaded from a script URL when
 * the page has none. The browser ESM build replaces this module with `./bundled.ts`; both export
 * the same names.
 */
import type { MathJaxGlobal } from '../adapter.js';
import { mathjax3Version } from '../unsupported-page.js';

export function engineMathJax(): MathJaxGlobal | undefined {
  return (window as { MathJax?: MathJaxGlobal }).MathJax;
}

/** Installs `config` as `window.MathJax` and loads the MathJax script, which reads it. */
export function loadMathJax(config: MathJaxGlobal, srcUrl: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    (window as { MathJax?: MathJaxGlobal }).MathJax = config;
    const script = document.createElement('script');
    script.src = srcUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load MathJax'));
    document.head.appendChild(script);
  });
}

/**
 * Every element bundles its own copy of this module, so the load in flight is kept on the page:
 * a second MathJax startup on one page throws "State ASSISTIVEMML already exists".
 */
export const loadingRegistry: object = globalThis;

/** The CHTML stylesheet id of the MathJax this adapter loads, in place of `MJX-CHTML-styles`. */
export const OWN_STYLESHEET_ID = 'PIE-MJX-CHTML-styles';

/** Output stylesheets of another MathJax. MathJax 4's menu and explorer sheets are not among them. */
export const FOREIGN_OUTPUT_STYLESHEETS = ['MJX-CHTML-styles', 'MJX-SVG-styles'];

/** The page's MathJax is this engine, so a MathJax 3 there is one this adapter must run beside. */
export const conflictingMathjax3Version = mathjax3Version;
