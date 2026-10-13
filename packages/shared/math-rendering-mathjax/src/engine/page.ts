/**
 * The MathJax engine of the npm build: the page's `window.MathJax`, loaded from a script URL when
 * the page has none. The browser ESM build replaces this module with `./bundled.ts`; both export
 * the same names.
 */
import type { MathJaxGlobal } from '../adapter.js';
import { MATHJAX_VERSION, type MathjaxAssets, reportNoAssetRoot } from '../assets.js';
import { mathjax3Version } from '../unsupported-page.js';

export function engineMathJax(): MathJaxGlobal | undefined {
  return (window as { MathJax?: MathJaxGlobal }).MathJax;
}

/**
 * Points the component build's font and speech paths at the asset root. MathJax names a font's
 * version in its path only on jsDelivr, so the paths are set per font.
 */
function assetConfig(config: MathJaxGlobal, { root, speechPath }: MathjaxAssets): void {
  if (root) {
    config.loader = {
      ...config.loader,
      paths: {
        fonts: `${root}/@mathjax`,
        'mathjax-newcm': `${root}/@mathjax/mathjax-newcm-font@${MATHJAX_VERSION}`,
        'mathjax-mhchem-extension': `${root}/@mathjax/mathjax-mhchem-font-extension@${MATHJAX_VERSION}`,
      },
    };
  }
  if (speechPath) {
    config.options = {
      ...config.options,
      worker: { path: speechPath, maps: `${speechPath}/mathmaps` },
    };
  }
}

/**
 * Installs `config` as `window.MathJax` and loads the MathJax script, which reads it: `srcUrl`, or
 * the component build under the asset root. Resolves to false when there is neither, and no
 * MathJax loads.
 */
export function loadMathJax(
  config: MathJaxGlobal,
  assets: MathjaxAssets & { srcUrl?: string }
): Promise<boolean> {
  const src =
    assets.srcUrl ||
    (assets.root ? `${assets.root}/mathjax@${MATHJAX_VERSION}/tex-mml-chtml.js` : undefined);
  if (!src) {
    reportNoAssetRoot('untypeset');
    return Promise.resolve(false);
  }
  assetConfig(config, assets);
  return new Promise<boolean>((resolve, reject) => {
    (window as { MathJax?: MathJaxGlobal }).MathJax = config;
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
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
