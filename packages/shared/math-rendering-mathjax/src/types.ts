/**
 * Options for MathJax renderer
 */
export interface MathjaxOptions {
  /**
   * Treat `$...$` as inline math. The renderer behind `renderMath` enables it when the page sets
   * the legacy opt-in, `window['@pie-lib/math-rendering@2'] = { opts: { useSingleDollar: true } }`.
   * @default false
   */
  useSingleDollar?: boolean;

  /**
   * Add hidden MathML for screen readers and the MathJax context menu
   * @default true
   */
  accessibility?: boolean;

  /**
   * Load MathJax fonts automatically
   * @default true
   */
  loadFonts?: boolean;

  /**
   * Override the MathJax script URL, which defaults to `mathjax@4.1.3/tex-mml-chtml.js` under the
   * asset root. The browser ESM build bundles its MathJax and ignores it.
   */
  srcUrl?: string;

  /**
   * The npm root MathJax's files load from: a URL under which `<package>@<version>/<path>` serves
   * that file of the package, such as `https://cdn.jsdelivr.net/npm`. Defaults to the page's
   * `window['@pie-lib/math-rendering@2'].opts.assetRoot`, then to the npm root of the URL this
   * module loaded from. With none, the browser ESM build renders without web fonts and speech, and
   * the npm build loads no MathJax unless `srcUrl` names one.
   */
  assetRoot?: string;

  /**
   * The URL of individual files, by npm path: `{ '@mathjax/mathjax-newcm-font@4.1.3/chtml/woff2/
   * mjx-ncm-n.woff2': url }`. A listed file loads from its URL, others from the asset root and
   * `speechPath`. Defaults to the page's `opts.assetUrls`. A bundle gives each file a
   * `new URL('./…', import.meta.url)` here, which its host's bundler emits. Read by the browser ESM
   * build, for its fonts, speech worker and mathmaps; the npm build's MathJax loads its files
   * itself and ignores it.
   */
  assetUrls?: Readonly<Record<string, string>>;

  /**
   * The directory of the speech worker, `speech-worker.js`, and its rule files, `mathmaps/`.
   * Defaults to the page's `opts.speechPath`, then to `mathjax@4.1.3/sre` under the asset root.
   */
  speechPath?: string;

  /**
   * The speech locales the MathJax menu lists, by locale id, with a menu label for each when given
   * as an object. A locale SRE does not ship needs a speech worker built with it. Defaults to the
   * page's `opts.speechLocales`, then to every locale SRE ships.
   */
  speechLocales?: readonly string[] | Readonly<Record<string, string>>;
}

/**
 * Shared renderer contract used by players.
 */
export type MathRenderer = (element: HTMLElement) => void | Promise<void>;

export interface MathRenderingAPI {
  renderMath: MathRenderer;
  wrapMath?: (latex: string, wrapType?: string | null) => string;
  unWrapMath?: (wrapped: string) => string;
  mmlToLatex?: (mathml: string) => string;
}
