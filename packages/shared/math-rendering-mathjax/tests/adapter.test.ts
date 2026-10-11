import { afterEach, beforeEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import packageJson from '../package.json';
import { createMathjaxRenderer } from '../src/adapter.js';
import {
  ASSETS_DOCS_URL,
  MATHJAX_VERSION,
  NO_ASSET_ROOT_EVENT,
  npmRoot,
  resolveAssets,
} from '../src/assets.js';
import { mmlToLatex, renderMath, wrapMath } from '../src/render-math.js';
import { MATHJAX_CONFLICT_EVENT, UNSUPPORTED_PAGE_DOCS_URL } from '../src/unsupported-page.js';

const MATHJAX_LOADING = Symbol.for('@pie-element/shared-math-rendering-mathjax/loading');
const UNSUPPORTED_PAGE = Symbol.for('@pie-element/shared-math-rendering-mathjax/unsupported-page');
const NO_ASSETS_WARNED = Symbol.for('@pie-element/shared-math-rendering-mathjax/no-assets');
/** The asset root every test page sets, unless the test is about asset roots. */
const ASSET_ROOT = 'https://assets.test/npm';
const PINNED_SRC = `${ASSET_ROOT}/mathjax@4.1.3/tex-mml-chtml.js`;
const SPEECH_PATH = `${ASSET_ROOT}/mathjax@4.1.3/sre`;
const SINGLE_DOLLAR_WARNING =
  '[math-rendering] using $ is not advisable, please use $$..$$ or \\(...\\)';

type TypesetPromise = (elements?: Element[]) => Promise<void>;

/** MathJax's STATE values for an item typeset but not yet inserted, and one inserted. */
const TYPESET = 150;
const INSERTED = 200;

interface MockMathItem {
  typesetRoot: Element | null;
  state?: () => number;
  clear?: () => void;
}

function mathItem(typesetRoot: Element | null, state: number) {
  return { typesetRoot, state: () => state, clear: vi.fn() };
}

/** MathJax's MathList: the document's items, in order, with `remove`. */
function mathList() {
  const list = Object.assign([] as MockMathItem[], {
    remove: (...items: MockMathItem[]) => {
      for (const item of items) list.splice(list.indexOf(item), 1);
    },
  });
  return list;
}

const page = window as any;

function interceptScripts(): HTMLScriptElement[] {
  const scripts: HTMLScriptElement[] = [];
  vi.spyOn(document.head, 'appendChild').mockImplementation((node) => {
    if (node instanceof HTMLScriptElement) scripts.push(node);
    return node;
  });
  return scripts;
}

/**
 * Does what the MathJax script does once its components load: the configuration on
 * window.MathJax becomes MathJax.config and startup.ready runs. defaultReady defines the
 * typesetting methods and creates the document; the startup promise resolves when
 * `finishStartup` is called.
 */
function runMathjaxScript(
  typesetPromise = vi.fn<TypesetPromise>(async () => {}),
  {
    version = '4.1.3',
    chtmlStyles = null as HTMLStyleElement | null,
    svg = false,
    locales = undefined as Map<string, string> | undefined,
  } = {}
) {
  const config = page.MathJax ?? {};
  let finishStartup!: () => void;
  const promise = new Promise<void>((resolve) => {
    finishStartup = resolve;
  });
  const CHTML = { STYLESHEETID: 'MJX-CHTML-styles' };
  const SVG = { STYLESHEETID: 'MJX-SVG-styles' };
  const Menu = { MENU_STORAGE: 'MathJax-Menu-Settings' };
  const mathDocument = {
    math: mathList(),
    outputJax: { chtmlStyles },
    addRenderAction: vi.fn(),
    addStyles: vi.fn(),
  };
  const mathJax: any = {
    version,
    config,
    _: {
      ...(locales && { a11y: { sre_ts: { locales } } }),
      output: { chtml_ts: { CHTML }, ...(svg && { svg_ts: { SVG } }) },
      ui: { menu: { Menu: { Menu } } },
    },
    startup: {
      promise,
      defaultReady: vi.fn(() => {
        mathJax.stylesheetIdAtStartup = CHTML.STYLESHEETID;
        mathJax.svgStylesheetIdAtStartup = SVG.STYLESHEETID;
        // The menu, created with the document, reads the settings stored under its key.
        mathJax.menuSettingsAtStartup = localStorage.getItem(Menu.MENU_STORAGE);
        mathJax.localesAtStartup = locales && [...locales];
        mathJax.typesetPromise = typesetPromise;
        mathJax.typesetClear = vi.fn();
        mathJax.startup.document = mathDocument;
      }),
    },
  };
  page.MathJax = mathJax;
  if (config.startup?.ready) {
    config.startup.ready();
  } else {
    mathJax.startup.defaultReady();
  }
  return { mathJax, typesetPromise, finishStartup, CHTML, SVG, Menu, mathDocument };
}

/** The arguments the adapter registered render action `id` with. */
function renderAction(
  mathDocument: ReturnType<typeof runMathjaxScript>['mathDocument'],
  id: string
) {
  const call = mathDocument.addRenderAction.mock.calls.find(([name]) => name === id);
  if (!call) throw new Error(`No render action ${id}`);
  return call;
}

/** Output as MathJax 4 produces it: every node records its TeX source. */
const TYPESET_OUTPUT =
  '<mjx-container data-latex="x^2"><mjx-math data-latex="x^2">' +
  '<mjx-msup data-latex="x^2" data-latex-item="x^2"><mjx-mi data-latex="x">x</mjx-mi></mjx-msup>' +
  '</mjx-math><mjx-assistive-mml><math data-latex="x^2"><msup data-latex="x^2"><mi>x</mi></msup>' +
  '</math></mjx-assistive-mml></mjx-container>';

const typesetAs = (html: string) =>
  vi.fn<TypesetPromise>(async (elements = []) => {
    for (const element of elements) element.innerHTML = html;
  });

function conflictEvents() {
  const events: CustomEvent[] = [];
  const listener = (event: Event) => events.push(event as CustomEvent);
  window.addEventListener(MATHJAX_CONFLICT_EVENT, listener);
  onTestFinished(() => window.removeEventListener(MATHJAX_CONFLICT_EVENT, listener));
  return events;
}

function elementWith(html: string): HTMLElement {
  const element = document.createElement('div');
  element.innerHTML = html;
  document.body.append(element);
  return element;
}

/** An element printed by a `<pie-print>`; the legacy print player sets the import flag. */
function printedElementWith(
  html: string,
  player: { mathRenderingModuleUrlImported?: boolean } = {}
): HTMLElement {
  const printPlayer = Object.assign(document.createElement('pie-print'), player);
  const element = document.createElement('div');
  element.innerHTML = html;
  printPlayer.append(element);
  document.body.append(printPlayer);
  return element;
}

/** Node's own `localStorage`, which has no backing file here, shadows happy-dom's. */
function stubLocalStorage() {
  const items = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  });
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  stubLocalStorage();
  page['@pie-lib/math-rendering@2'] = { opts: { assetRoot: ASSET_ROOT } };
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  delete page.MathJax;
  delete page['@pie-lib/math-rendering'];
  delete page['@pie-lib/math-rendering@2'];
  delete page.renderMath;
  delete (globalThis as any)[MATHJAX_LOADING];
  delete (globalThis as any)[UNSUPPORTED_PAGE];
  delete (globalThis as any)[NO_ASSETS_WARNED];
  for (const style of document.head.querySelectorAll('style')) style.remove();
  vi.unstubAllGlobals();
});

describe('MathJax version', () => {
  it('is one version across the script the npm build loads and the engine the browser build bundles', () => {
    const { devDependencies } = packageJson;
    const version = devDependencies.mathjax;

    expect(devDependencies['@mathjax/src']).toBe(version);
    expect(devDependencies['@mathjax/mathjax-newcm-font']).toBe(version);
    expect(devDependencies['@mathjax/mathjax-mhchem-font-extension']).toBe(version);
    expect(MATHJAX_VERSION).toBe(version);
  });

  it('is the version of every package the manifest lists for asset roots to serve', () => {
    const { devDependencies, pie } = packageJson;
    const assetPackages = Object.entries(pie.assetPackages);

    expect(assetPackages.map(([name]) => name).sort()).toEqual([
      '@mathjax/mathjax-mhchem-font-extension',
      '@mathjax/mathjax-newcm-font',
      'mathjax',
    ]);
    for (const [name, version] of assetPackages) {
      expect(version).toBe(MATHJAX_VERSION);
      expect(devDependencies[name as keyof typeof devDependencies]).toBe(version);
    }
  });
});

describe('npmRoot', () => {
  it('is the URL before the package segment, scope included', () => {
    expect(
      npmRoot(
        'https://cdn.jsdelivr.net/npm/@pie-element/categorize@14.0.1/dist/browser/delivery/index.js'
      )
    ).toBe('https://cdn.jsdelivr.net/npm');
    expect(npmRoot('https://raw.esm.sh/@pie-element/categorize@14.0.1/dist/browser/index.js')).toBe(
      'https://raw.esm.sh'
    );
    expect(npmRoot('https://proxy.test/npm/mathjax@4.1.3/tex-mml-chtml.js?v=1')).toBe(
      'https://proxy.test/npm'
    );
  });

  it('is undefined without a package segment, under node_modules, or without an origin', () => {
    expect(npmRoot('https://app.test/assets/index-Ab12.js')).toBeUndefined();
    expect(
      npmRoot('https://app.test/node_modules/.pnpm/mathjax@4.1.3/node_modules/x/index.js')
    ).toBeUndefined();
    expect(npmRoot('file:///repo/@pie-element/categorize@14.0.1/index.js')).toBeUndefined();
    expect(npmRoot('not a url')).toBeUndefined();
    expect(npmRoot(undefined)).toBeUndefined();
  });
});

describe('resolveAssets', () => {
  afterEach(() => {
    delete (globalThis as any)['@pie-lib/math-rendering@2'];
  });

  it('lists the URLs the options give, over the page, made absolute against the page', () => {
    (globalThis as any)['@pie-lib/math-rendering@2'] = {
      opts: { assetUrls: { 'mathjax@4.1.3/sre/speech-worker.js': 'https://page.test/w.js' } },
    };
    const path = '@mathjax/mathjax-newcm-font@4.1.3/chtml/woff2/mjx-ncm-n.woff2';

    expect(resolveAssets({}).urls).toEqual(
      new Map([['mathjax@4.1.3/sre/speech-worker.js', 'https://page.test/w.js']])
    );
    expect(resolveAssets({ assetUrls: { [path]: '/static/n-3c.woff2' } }).urls).toEqual(
      new Map([[path, new URL('/static/n-3c.woff2', document.baseURI).href]])
    );
  });
});

describe('assets', () => {
  it('load from the root the options set, over the page option', async () => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer({ assetRoot: 'https://mirror.test/npm/' })(
      elementWith('\\(x\\)')
    );

    expect(scripts.map((script) => script.src)).toEqual([
      'https://mirror.test/npm/mathjax@4.1.3/tex-mml-chtml.js',
    ]);
    expect(page.MathJax.loader.paths['mathjax-newcm']).toBe(
      'https://mirror.test/npm/@mathjax/mathjax-newcm-font@4.1.3'
    );
    expect(page.MathJax.options.worker.path).toBe('https://mirror.test/npm/mathjax@4.1.3/sre');
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('resolve a relative root against the page', async () => {
    const scripts = interceptScripts();
    page['@pie-lib/math-rendering@2'] = { opts: { assetRoot: '/static/npm' } };

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));

    expect(scripts[0].src).toBe(
      new URL('/static/npm/mathjax@4.1.3/tex-mml-chtml.js', document.baseURI).href
    );
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('take speech from speechPath', async () => {
    interceptScripts();
    page['@pie-lib/math-rendering@2'] = {
      opts: { assetRoot: ASSET_ROOT, speechPath: 'https://speech.test/sre/' },
    };

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));

    expect(page.MathJax.options.worker).toEqual({
      path: 'https://speech.test/sre',
      maps: 'https://speech.test/sre/mathmaps',
    });
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('leave the paths of a srcUrl build without a root to that build', async () => {
    const scripts = interceptScripts();
    delete page['@pie-lib/math-rendering@2'];

    const rendering = createMathjaxRenderer({ srcUrl: 'https://example.test/tex-mml-chtml.js' })(
      elementWith('\\(x\\)')
    );

    expect(scripts.map((script) => script.src)).toEqual(['https://example.test/tex-mml-chtml.js']);
    expect(page.MathJax.loader.paths).toBeUndefined();
    expect(page.MathJax.options.worker).toBeUndefined();
    runMathjaxScript().finishStartup();
    await rendering;
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('without a root or srcUrl load no MathJax, and report it once per page', async () => {
    const scripts = interceptScripts();
    delete page['@pie-lib/math-rendering@2'];
    const target = elementWith('\\(x\\)');
    const reports: unknown[] = [];
    const record = (event: Event) => reports.push((event as CustomEvent).detail);
    window.addEventListener(NO_ASSET_ROOT_EVENT, record);

    await createMathjaxRenderer()(target);
    vi.resetModules();
    const { createMathjaxRenderer: fromOtherBundle } = await import('../src/adapter.js');
    delete (globalThis as any)[MATHJAX_LOADING];
    await fromOtherBundle()(elementWith('\\(y\\)'));

    expect(scripts).toEqual([]);
    expect(page.MathJax).toBeUndefined();
    expect(target.textContent).toBe('\\(x\\)');
    window.removeEventListener(NO_ASSET_ROOT_EVENT, record);
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining(ASSETS_DOCS_URL));
    expect(reports).toEqual([
      {
        effect: 'untypeset',
        message: expect.stringContaining('math stays untypeset'),
        docsUrl: ASSETS_DOCS_URL,
      },
    ]);
  });

  it('list only the speech locales the page names, braille codes kept', async () => {
    interceptScripts();
    page['@pie-lib/math-rendering@2'] = {
      opts: { assetRoot: ASSET_ROOT, speechLocales: { en: 'English', xx: 'Example' } },
    };
    const locales = new Map([
      ['de', 'German'],
      ['en', 'English'],
      ['euro', 'Euro'],
      ['nemeth', 'Nemeth'],
    ]);

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, finishStartup } = runMathjaxScript(undefined, { locales });
    finishStartup();
    await rendering;

    expect(mathJax.localesAtStartup).toEqual([
      ['en', 'English'],
      ['euro', 'Euro'],
      ['nemeth', 'Nemeth'],
      ['xx', 'Example'],
    ]);
    expect(page.MathJax.config.options.sre).toBeUndefined();
  });

  it('start speech in the first listed locale when English is not listed', async () => {
    interceptScripts();
    page['@pie-lib/math-rendering@2'] = {
      opts: { assetRoot: ASSET_ROOT, speechLocales: ['nemeth', 'de'] },
    };

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));

    expect(page.MathJax.options.sre).toEqual({ locale: 'de' });
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('drop a stored speech locale the menu does not list', async () => {
    interceptScripts();
    page['@pie-lib/math-rendering@2'] = { opts: { assetRoot: ASSET_ROOT, speechLocales: ['en'] } };
    localStorage.setItem(
      'PIE-MathJax-Menu-Settings',
      JSON.stringify({ locale: 'de', zoom: 'Click' })
    );

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(JSON.parse(mathJax.menuSettingsAtStartup)).toEqual({ zoom: 'Click' });
  });

  it('keep a stored speech locale the menu lists', async () => {
    interceptScripts();
    page['@pie-lib/math-rendering@2'] = { opts: { assetRoot: ASSET_ROOT, speechLocales: ['de'] } };
    localStorage.setItem('PIE-MathJax-Menu-Settings', JSON.stringify({ locale: 'de' }));

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(JSON.parse(mathJax.menuSettingsAtStartup)).toEqual({ locale: 'de' });
  });
});

describe('createMathjaxRenderer', () => {
  it('loads the pinned MathJax build with the legacy macros and hidden MathML only', async () => {
    const scripts = interceptScripts();
    const target = elementWith('\\(x^2 + 1\\)');

    const rendering = createMathjaxRenderer()(target);

    expect(scripts).toHaveLength(1);
    expect(scripts[0].src).toBe(PINNED_SRC);
    expect(scripts[0].async).toBe(true);
    const config = page.MathJax;
    expect(config.startup.typeset).toBe(false);
    expect(config.loader.load).toEqual(['a11y/assistive-mml']);
    expect(config.tex).toEqual({
      macros: {
        parallelogram: '\\lower.2em{\\Huge\\unicode{x25B1}}',
        overarc: '\\overparen',
        napprox: '\\not\\approx',
        longdiv: '\\enclose{longdiv}',
        abs: ['\\left|#1\\right|', 1],
      },
    });
    expect(config.output).toEqual({ displayOverflow: 'linebreak' });
    expect(config.options).toEqual({
      enableMenu: true,
      menuOptions: { settings: { assistiveMml: true, enrich: false, inTabOrder: false } },
      a11y: { inTabOrder: false },
      worker: { path: SPEECH_PATH, maps: `${SPEECH_PATH}/mathmaps` },
    });
    expect(config.loader.paths).toEqual({
      fonts: `${ASSET_ROOT}/@mathjax`,
      'mathjax-newcm': `${ASSET_ROOT}/@mathjax/mathjax-newcm-font@4.1.3`,
      'mathjax-mhchem-extension': `${ASSET_ROOT}/@mathjax/mathjax-mhchem-font-extension@4.1.3`,
    });

    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('puts math in the tab order when the page sets opts.inTabOrder to true', async () => {
    interceptScripts();
    page['@pie-lib/math-rendering@2'] = { opts: { assetRoot: ASSET_ROOT, inTabOrder: true } };

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));

    expect(page.MathJax.options.menuOptions.settings.inTabOrder).toBe(true);
    expect(page.MathJax.options.a11y).toEqual({ inTabOrder: true });
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('keeps math out of the tab order for an opts.inTabOrder other than true', async () => {
    interceptScripts();
    page['@pie-lib/math-rendering@2'] = { opts: { assetRoot: ASSET_ROOT, inTabOrder: 'true' } };

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));

    expect(page.MathJax.options.menuOptions.settings.inTabOrder).toBe(false);
    expect(page.MathJax.options.a11y).toEqual({ inTabOrder: false });
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('loads MathJax from srcUrl when one is given', async () => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer({
      srcUrl: 'https://example.test/mathjax/tex-mml-chtml.js',
    })(elementWith('\\(x\\)'));

    expect(scripts.map((script) => script.src)).toEqual([
      'https://example.test/mathjax/tex-mml-chtml.js',
    ]);
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('typesets the element once MathJax startup completes', async () => {
    interceptScripts();
    const target = elementWith('\\(x^2 + 1\\)');
    let settled = false;

    const rendering = createMathjaxRenderer()(target).then(() => {
      settled = true;
    });
    const { mathJax, typesetPromise, finishStartup } = runMathjaxScript();
    await Promise.resolve();
    await Promise.resolve();

    expect(mathJax.startup.defaultReady).toHaveBeenCalledTimes(1);
    expect(typesetPromise).not.toHaveBeenCalled();
    expect(settled).toBe(false);

    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('starts one MathJax load per page however many copies of the adapter render', async () => {
    const scripts = interceptScripts();
    // Each element bundles the adapter, so a page holds one module instance per element.
    vi.resetModules();
    const { createMathjaxRenderer: fromOtherBundle } = await import('../src/adapter.js');
    expect(fromOtherBundle).not.toBe(createMathjaxRenderer);

    const first = elementWith('\\(a\\)');
    const second = elementWith('\\(b\\)');
    const rendering = Promise.all([createMathjaxRenderer()(first), fromOtherBundle()(second)]);

    expect(scripts).toHaveLength(1);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[first]], [[second]]]);
  });

  it('starts the load on the first render and does not wait on it for content without math', async () => {
    const scripts = interceptScripts();
    const renderer = createMathjaxRenderer();

    await renderer(
      elementWith(
        '<p>A pen costs $5 and a book costs $10.</p><label><input type="radio"> Yes</label>'
      )
    );
    await renderer(
      elementWith(
        '<mjx-container><mjx-assistive-mml><math><mi>x</mi></math></mjx-assistive-mml></mjx-container>'
      )
    );

    expect(scripts).toHaveLength(1);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    const later = elementWith('\\(x\\)');
    await renderer(later);

    expect(scripts).toHaveLength(1);
    expect(typesetPromise.mock.calls).toEqual([[[later]]]);
  });

  it('leaves a failed load unobserved by renders without math', async () => {
    const scripts = interceptScripts();
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    await createMathjaxRenderer()(elementWith('<p>No math</p>'));
    scripts[0].onerror?.(new Event('error'));
    await new Promise((resolve) => setTimeout(resolve, 0));

    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it.each([
    ['inline TeX', '\\(x\\)'],
    ['display TeX', '\\[x\\]'],
    ['double dollars', '$$x$$'],
    ['an escaped dollar', 'costs \\$5'],
    ['an environment', '\\begin{matrix}1\\end{matrix}'],
    ['MathML', '<math><mi>x</mi></math>'],
    ['a data-latex span', '<span data-latex="">x^3</span>'],
  ])('waits on the load and typesets %s', async (_label, html) => {
    interceptScripts();
    const target = elementWith(html);

    const rendering = createMathjaxRenderer()(target);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('wraps data-latex content in inline delimiters as the legacy renderer does', async () => {
    interceptScripts();
    const target = elementWith(
      [
        '<span data-latex="" data-raw="x^3">x^3</span>',
        '<span data-latex="">$y$</span>',
        '<span data-latex="">\\displaystyle \\[z\\]</span>',
        '<span data-latex="">a\\embed{newLine}[]b</span>',
        '<span data-latex="" data-math-handled="true">\\(w\\)</span>',
      ].join('')
    );

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript().finishStartup();
    await rendering;

    expect([...target.querySelectorAll('[data-latex]')].map((span) => span.textContent)).toEqual([
      '\\(x^3\\)',
      '\\(y\\)',
      '\\(z\\)',
      '\\(a\\newline b\\)',
      '\\(w\\)',
    ]);
    expect(target.querySelectorAll('[data-math-handled="true"]')).toHaveLength(5);
  });

  it('typesets authored MathML in display style as the legacy renderer does', async () => {
    interceptScripts();
    const target = elementWith(
      [
        '<math><mfrac><mn>5</mn><mn>6</mn></mfrac></math>',
        '<math displaystyle="false"><mn>1</mn></math>',
        '<mjx-container><mjx-assistive-mml><math><mi>x</mi></math></mjx-assistive-mml></mjx-container>',
      ].join('')
    );
    let displayStyles: (string | null)[] = [];
    const typesetPromise = vi.fn<TypesetPromise>(async () => {
      displayStyles = [...target.querySelectorAll('math')].map((math) =>
        math.getAttribute('displaystyle')
      );
    });

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript(typesetPromise).finishStartup();
    await rendering;

    expect(displayStyles).toEqual(['true', 'true', null]);
  });

  it('typesets prefixed MathML, elementary math included, as MathML', async () => {
    interceptScripts();
    const target = elementWith(
      '<mml:math xmlns="http://www.w3.org/1998/Math/MathML"><mml:mlongdiv><mml:mn>4</mml:mn><mml:mn>21</mml:mn><mml:mn>84</mml:mn></mml:mlongdiv></mml:math>'
    );
    let typeset = '';
    const typesetPromise = vi.fn<TypesetPromise>(async () => {
      typeset = target.innerHTML;
    });

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript(typesetPromise).finishStartup();
    await rendering;

    expect(typeset).toMatch(/^<math [^>]*displaystyle="true"[^>]*><mtable /);
    expect(typeset).not.toContain('mml:');
  });

  it('leaves the data-latex nodes of typeset output alone on a later render', async () => {
    interceptScripts();
    const typeset =
      '<mjx-container><mjx-math><mjx-mi data-latex="x">x</mjx-mi></mjx-math></mjx-container>';
    const target = elementWith(`${typeset} \\(y\\)`);

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript().finishStartup();
    await rendering;

    expect(target.querySelector('mjx-mi')?.textContent).toBe('x');
    expect(target.querySelectorAll('[data-math-handled]')).toHaveLength(0);
  });

  it('leaves the data-latex content MathJax skips for its ignore class', async () => {
    interceptScripts();
    const target = elementWith(
      [
        '<div class="mathjax_ignore"><span data-latex="">a</span>',
        '<div class="mathjax_process"><span data-latex="">b</span></div></div>',
        '<span class="mathjax_ignore" data-latex="">c</span>',
        '<span class="mathjax_ignore mathjax_process" data-latex="">d</span>',
      ].join('')
    );

    const rendering = createMathjaxRenderer()(target);
    runMathjaxScript().finishStartup();
    await rendering;

    expect([...target.querySelectorAll('[data-latex]')].map((span) => span.textContent)).toEqual([
      'a',
      '\\(b\\)',
      'c',
      '\\(d\\)',
    ]);
  });

  it('decides from the classes from the rendered element down, as MathJax does', async () => {
    interceptScripts();
    // A node view inside an editor typesets itself, and MathJax ignores classes above its root.
    const editor = elementWith('<div><span data-latex="">x</span></div>');
    editor.className = 'mathjax_ignore';
    const nodeView = editor.firstElementChild as HTMLElement;
    const ignoredRoot = elementWith('<span data-latex="">y</span>');
    ignoredRoot.className = 'mathjax_ignore';

    const render = createMathjaxRenderer();
    const rendering = Promise.all([render(nodeView), render(ignoredRoot)]);
    runMathjaxScript().finishStartup();
    await rendering;

    expect(nodeView.textContent).toBe('\\(x\\)');
    expect(ignoredRoot.textContent).toBe('y');
  });

  it('enables single-dollar delimiters when asked, with the legacy warning', async () => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer({ useSingleDollar: true })(elementWith('costs $5'));

    expect(scripts).toHaveLength(1);
    expect(page.MathJax.tex.inlineMath).toEqual([
      ['$', '$'],
      ['\\(', '\\)'],
    ]);
    expect(page.MathJax.tex.processEscapes).toBe(true);
    expect(console.warn).toHaveBeenCalledWith(SINGLE_DOLLAR_WARNING);
    runMathjaxScript().finishStartup();
    await rendering;
  });

  it('uses a MathJax the page already started', async () => {
    const scripts = interceptScripts();
    const typesetPromise = vi.fn<TypesetPromise>(async () => {});
    const hostMathJax = {
      version: '3.2.2',
      startup: { promise: Promise.resolve() },
      typesetPromise,
    };
    page.MathJax = hostMathJax;
    const target = elementWith('\\(x\\)');

    await createMathjaxRenderer()(target);

    expect(scripts).toHaveLength(0);
    expect(page.MathJax).toBe(hostMathJax);
    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('waits for the MathJax the page configured and loads no copy of its own', async () => {
    const scripts = interceptScripts();
    const hostConfig = { tex: { inlineMath: [['$', '$']] }, startup: { typeset: false } };
    page.MathJax = hostConfig;
    const target = elementWith('\\(x\\)');
    let settled = false;

    const rendering = createMathjaxRenderer()(target).then(() => {
      settled = true;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(settled).toBe(false);
    expect(scripts).toHaveLength(0);
    expect(page.MathJax).toBe(hostConfig);
    expect(hostConfig.tex).toEqual({ inlineMath: [['$', '$']] });
    expect(hostConfig.startup.typeset).toBe(false);

    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('runs the startup.ready of the page configuration once', async () => {
    interceptScripts();
    const hostReady = vi.fn(() => page.MathJax.startup.defaultReady());
    page.MathJax = { startup: { ready: hostReady } };
    const target = elementWith('\\(x\\)');

    const rendering = createMathjaxRenderer()(target);
    await new Promise((resolve) => setTimeout(resolve, 0));
    const { mathJax, typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(hostReady).toHaveBeenCalledTimes(1);
    expect(mathJax.startup.defaultReady).toHaveBeenCalledTimes(1);
    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('leaves math untypeset beside a MathJax global without component startup', async () => {
    const scripts = interceptScripts();
    // The global the legacy renderer's bundled MathJax 3 leaves on the page.
    const legacyGlobal = { version: '3.2.2', _: {}, config: {} };
    page.MathJax = legacyGlobal;
    const renderer = createMathjaxRenderer();

    await renderer(elementWith('\\(x\\)'));
    await renderer(elementWith('\\(y\\)'));

    expect(scripts).toHaveLength(0);
    expect(page.MathJax).toBe(legacyGlobal);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it('gives the MathJax 4 it loads its own stylesheet id before startup', async () => {
    interceptScripts();
    const earlySheet = document.createElement('style');
    earlySheet.id = 'MJX-CHTML-styles';

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, CHTML, finishStartup } = runMathjaxScript(undefined, {
      chtmlStyles: earlySheet,
    });
    finishStartup();
    await rendering;

    expect(mathJax.stylesheetIdAtStartup).toBe('PIE-MJX-CHTML-styles');
    expect(CHTML.STYLESHEETID).toBe('PIE-MJX-CHTML-styles');
    expect(earlySheet.id).toBe('PIE-MJX-CHTML-styles');
  });

  it('scrolls displayed math that MathJax did not break to fit', async () => {
    interceptScripts();

    const rendering = createMathjaxRenderer()(elementWith('\\[x\\]'));
    const { mathDocument, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(mathDocument.addStyles).toHaveBeenCalledWith({
      'mjx-container[overflow="linebreak"][display]': {
        overflow: 'auto clip',
        'min-width': 'initial !important',
      },
    });
  });

  it('leaves the stylesheet id of a srcUrl build that is not MathJax 4', async () => {
    interceptScripts();

    const rendering = createMathjaxRenderer({ srcUrl: 'https://example.test/tex-chtml.js' })(
      elementWith('\\(x\\)')
    );
    const { CHTML, mathDocument, finishStartup } = runMathjaxScript(undefined, {
      version: '3.2.2',
    });
    finishStartup();
    await rendering;

    expect(CHTML.STYLESHEETID).toBe('MJX-CHTML-styles');
    expect(mathDocument.addRenderAction).not.toHaveBeenCalled();
    expect(mathDocument.addStyles).not.toHaveBeenCalled();
  });

  it('leaves the stylesheet id of a MathJax 4 the page loaded', async () => {
    interceptScripts();
    const CHTML = { STYLESHEETID: 'MJX-CHTML-styles' };
    page.MathJax = {
      version: '4.1.3',
      _: { output: { chtml_ts: { CHTML } } },
      startup: { promise: Promise.resolve() },
      typesetPromise: typesetAs(TYPESET_OUTPUT),
    };
    const target = elementWith('\\(x^2\\)');

    await createMathjaxRenderer()(target);

    expect(CHTML.STYLESHEETID).toBe('MJX-CHTML-styles');
    expect(target.querySelectorAll('[data-latex], [data-latex-item]')).toHaveLength(0);
  });

  it('gives SVG output the MathJax 4 it loads later its own stylesheet id', async () => {
    interceptScripts();

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;
    const SVG = { STYLESHEETID: 'MJX-SVG-styles' };
    mathJax._.output.svg_ts = { SVG };

    expect(mathJax.config.loader['output/svg'].ready('output/svg')).toBe('output/svg');
    expect(SVG.STYLESHEETID).toBe('PIE-MJX-SVG-styles');
  });

  it("gives a MathJax 4 SVG build's output its own stylesheet id before startup", async () => {
    interceptScripts();

    const rendering = createMathjaxRenderer({ srcUrl: 'https://example.test/tex-svg.js' })(
      elementWith('\\(x\\)')
    );
    const { mathJax, SVG, finishStartup } = runMathjaxScript(undefined, { svg: true });
    finishStartup();
    await rendering;

    expect(mathJax.svgStylesheetIdAtStartup).toBe('PIE-MJX-SVG-styles');
    expect(SVG.STYLESHEETID).toBe('PIE-MJX-SVG-styles');
  });

  it('leaves the SVG stylesheet id of a srcUrl build that is not MathJax 4', async () => {
    interceptScripts();

    const rendering = createMathjaxRenderer({ srcUrl: 'https://example.test/tex-svg.js' })(
      elementWith('\\(x\\)')
    );
    const { mathJax, SVG, finishStartup } = runMathjaxScript(undefined, {
      version: '3.2.2',
      svg: true,
    });
    finishStartup();
    await rendering;
    mathJax.config.loader['output/svg'].ready('output/svg');

    expect(SVG.STYLESHEETID).toBe('MJX-SVG-styles');
  });

  it('gives the MathJax 4 it loads its own menu settings key before startup', async () => {
    interceptScripts();
    localStorage.setItem('MathJax-Menu-Settings', '{"assistiveMml":false}');

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, Menu, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(mathJax.menuSettingsAtStartup).toBeNull();
    expect(Menu.MENU_STORAGE).toBe('PIE-MathJax-Menu-Settings');
    expect(localStorage.getItem('MathJax-Menu-Settings')).toBe('{"assistiveMml":false}');
  });

  it.each([
    ['{"assistiveMml":false,"zoom":"Click"}', '{"zoom":"Click"}'],
    ['{"assistiveMml":true}', null],
    ['{"zoom":"Click"}', '{"zoom":"Click"}'],
    ['not json', 'not json'],
  ])('drops a stored assistiveMml from %s before startup', async (settings, remaining) => {
    interceptScripts();
    localStorage.setItem('PIE-MathJax-Menu-Settings', settings);

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathJax, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(mathJax.menuSettingsAtStartup).toBe(remaining);
  });

  it('leaves the menu settings key of a srcUrl build that is not MathJax 4', async () => {
    interceptScripts();
    localStorage.setItem('PIE-MathJax-Menu-Settings', '{"assistiveMml":false}');

    const rendering = createMathjaxRenderer({ srcUrl: 'https://example.test/tex-chtml.js' })(
      elementWith('\\(x\\)')
    );
    const { Menu, finishStartup } = runMathjaxScript(undefined, { version: '3.2.2' });
    finishStartup();
    await rendering;

    expect(Menu.MENU_STORAGE).toBe('MathJax-Menu-Settings');
    expect(localStorage.getItem('PIE-MathJax-Menu-Settings')).toBe('{"assistiveMml":false}');
  });

  it('strips data-latex from its output and keeps it on authored spans', async () => {
    interceptScripts();
    const target = elementWith('\\(x^2\\)');

    const rendering = createMathjaxRenderer()(target);
    const { finishStartup } = runMathjaxScript(
      typesetAs(`<span data-latex="" data-math-handled="true">${TYPESET_OUTPUT}</span>`)
    );
    finishStartup();
    await rendering;

    expect(
      target.querySelectorAll('mjx-container [data-latex], mjx-container [data-latex-item]')
    ).toHaveLength(0);
    expect(target.querySelector('mjx-container')?.hasAttribute('data-latex')).toBe(false);
    expect(target.querySelector('span')?.hasAttribute('data-latex')).toBe(true);
    expect(target.querySelector('mjx-mi')?.textContent).toBe('x');
  });

  it('strips data-latex from the output of MathJax rerenders', async () => {
    interceptScripts();
    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathDocument, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    const [, priority, renderDoc, renderMathItem] = renderAction(mathDocument, 'pie-strip-latex');
    // After MathJax inserts its output, at STATE.INSERTED.
    expect(priority).toBeGreaterThan(200);

    const rerendered = elementWith(TYPESET_OUTPUT).firstElementChild as Element;
    mathDocument.math.push({ typesetRoot: rerendered });
    expect(renderDoc(mathDocument)).toBe(false);
    expect(rerendered.outerHTML).not.toContain('data-latex');

    const toggled = elementWith(TYPESET_OUTPUT).firstElementChild as Element;
    expect(renderMathItem({ typesetRoot: toggled }, mathDocument)).toBe(false);
    expect(toggled.outerHTML).not.toContain('data-latex');
  });

  it('names the math in a control on every MathJax render, rerenders included', async () => {
    interceptScripts();
    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    const { mathDocument, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    const [, priority, renderDoc, renderMathItem] = renderAction(mathDocument, 'pie-name-math');
    // Once the output is in the document.
    expect(priority).toBeGreaterThan(200);

    const output =
      '<mjx-container><mjx-assistive-mml><math><mi>x</mi></math></mjx-assistive-mml></mjx-container>';
    const inControl = () =>
      elementWith(`<button>${output}</button>`).querySelector('mjx-container') as Element;
    const rerendered = inControl();
    const inProse = elementWith(output).firstElementChild as Element;
    mathDocument.math.push({ typesetRoot: rerendered }, { typesetRoot: inProse });
    expect(renderDoc(mathDocument)).toBe(false);
    expect(rerendered.getAttribute('aria-label')).toBe('x');
    expect(inProse.hasAttribute('aria-label')).toBe(false);

    const toggled = inControl();
    expect(renderMathItem({ typesetRoot: toggled }, mathDocument)).toBe(false);
    expect(toggled.getAttribute('aria-label')).toBe('x');
  });

  it('removes the math whose output has left the page before each typeset', async () => {
    interceptScripts();
    const render = createMathjaxRenderer();
    const first = render(elementWith('\\(x\\)'));
    const { mathJax, mathDocument, typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await first;

    const removed = mathItem(document.createElement('mjx-container'), INSERTED);
    const onPage = mathItem(elementWith(TYPESET_OUTPUT).firstElementChild, INSERTED);
    // Output MathJax made in a typeset or rerender still waiting on a font file.
    const pending = mathItem(document.createElement('mjx-container'), TYPESET);
    const failed = mathItem(null, TYPESET - 1);
    mathDocument.math.push(removed, onPage, pending, failed);
    const listed: MockMathItem[][] = [];
    typesetPromise.mockImplementation(async () => {
      listed.push([...mathDocument.math]);
    });

    await render(elementWith('\\(y\\)'));

    expect(listed).toEqual([[onPage, pending, failed]]);
    expect(removed.clear).toHaveBeenCalledTimes(1);
    for (const item of [onPage, pending, failed]) expect(item.clear).not.toHaveBeenCalled();
    expect(mathJax.typesetClear).not.toHaveBeenCalled();
  });

  it('clears the math of an element whose typeset fails and rejects the render', async () => {
    interceptScripts();
    const failure = new Error("dynamic file 'double-struck' failed to load");
    const target = elementWith('\\(\\mathbb{R}\\)');

    const rendering = createMathjaxRenderer()(target);
    const { mathJax, finishStartup } = runMathjaxScript(
      vi.fn<TypesetPromise>(async () => {
        throw failure;
      })
    );
    finishStartup();

    await expect(rendering).rejects.toBe(failure);
    expect(mathJax.typesetClear.mock.calls).toEqual([[[target]]]);
  });

  it('reports a MathJax 3 on window once per page', async () => {
    interceptScripts();
    const events = conflictEvents();
    page.MathJax = {
      version: '3.2.2',
      startup: { promise: Promise.resolve() },
      typesetPromise: vi.fn<TypesetPromise>(async () => {}),
    };
    vi.resetModules();
    const { createMathjaxRenderer: fromOtherBundle } = await import('../src/adapter.js');

    await createMathjaxRenderer()(elementWith('\\(x\\)'));
    await fromOtherBundle()(elementWith('\\(y\\)'));

    expect(console.error).toHaveBeenCalledTimes(1);
    const [message] = vi.mocked(console.error).mock.calls[0];
    expect(message).toContain('mathjax-3-global');
    expect(message).toContain('MathJax 3.2.2');
    expect(message).toContain(UNSUPPORTED_PAGE_DOCS_URL);
    expect(events.map((event) => event.detail)).toEqual([
      { condition: 'mathjax-3-global', message, docsUrl: UNSUPPORTED_PAGE_DOCS_URL },
    ]);
  });

  it.each(['MJX-CHTML-styles', 'MJX-SVG-styles'])(
    "reports another MathJax's output stylesheet %s in the head",
    async (id) => {
      interceptScripts();
      const events = conflictEvents();
      const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
      runMathjaxScript().finishStartup();
      await rendering;

      const ownMenuStyles = document.createElement('style');
      ownMenuStyles.id = 'MJX-Menu-styles';
      document.head.prepend(ownMenuStyles);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(console.error).not.toHaveBeenCalled();

      const foreign = document.createElement('style');
      foreign.id = id;
      document.head.prepend(foreign);
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(console.error).toHaveBeenCalledTimes(1);
      expect(vi.mocked(console.error).mock.calls[0][0]).toContain('foreign-output-stylesheet');
      expect(events.map((event) => event.detail.condition)).toEqual(['foreign-output-stylesheet']);
    }
  );

  it('rejects when the MathJax script fails to load', async () => {
    const scripts = interceptScripts();

    const rendering = createMathjaxRenderer()(elementWith('\\(x\\)'));
    scripts[0].onerror?.(new Event('error'));

    await expect(rendering).rejects.toThrow('Failed to load MathJax');
  });
});

describe('renderMath', () => {
  it('leaves single dollars as text unless the page opts in', async () => {
    const scripts = interceptScripts();
    vi.resetModules();
    const { renderMath: render } = await import('../src/render-math.js');

    await render(elementWith('A pen costs $5 and a book costs $10.'));
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();

    expect(scripts).toHaveLength(1);
    expect(page.MathJax.config.tex.inlineMath).toBeUndefined();
    expect(typesetPromise).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('treats single dollars as math when the page sets the legacy opt-in', async () => {
    const scripts = interceptScripts();
    page['@pie-lib/math-rendering@2'] = { opts: { assetRoot: ASSET_ROOT, useSingleDollar: true } };
    vi.resetModules();
    const { renderMath: render } = await import('../src/render-math.js');
    const target = elementWith('$x^2$');

    const rendering = render(target);
    await Promise.resolve();

    expect(scripts).toHaveLength(1);
    expect(page.MathJax.tex.inlineMath).toEqual([
      ['$', '$'],
      ['\\(', '\\)'],
    ]);
    expect(console.warn).toHaveBeenCalledWith(SINGLE_DOLLAR_WARNING);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;
    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('delegates element rendering to the player math renderer when available', async () => {
    const target = elementWith('\\(x^2 + 1\\) <span data-latex="">x^3</span>');
    const playerRenderMath = vi.fn(async (element: HTMLElement) => {
      expect(element.querySelector('[data-latex]')?.textContent).toBe('x^3');
      expect(element.querySelector('[data-math-handled]')).toBeNull();
      element.innerHTML = '<span data-player-rendered>x squared plus 1</span>';
    });
    page['@pie-lib/math-rendering'] = { renderMath: playerRenderMath };
    const scripts = interceptScripts();

    await renderMath(target);

    expect(playerRenderMath).toHaveBeenCalledWith(target);
    expect(scripts).toHaveLength(0);
    expect(target.querySelector('[data-player-rendered]')).not.toBeNull();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("reports nothing when it delegates to the legacy renderer's MathJax 3", async () => {
    const events = conflictEvents();
    // The legacy renderer sets window.MathJax.version when it loads.
    page.MathJax = { version: '3.2.2', _: {}, config: {} };
    const playerRenderMath = vi.fn();
    page['@pie-lib/math-rendering'] = { renderMath: playerRenderMath };

    await renderMath(elementWith('\\(y\\)'));
    await renderMath(elementWith('\\(z\\)'));

    expect(playerRenderMath).toHaveBeenCalledTimes(2);
    expect(console.error).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it("delegates to the legacy print player's renderer inside <pie-print>", async () => {
    const events = conflictEvents();
    page.MathJax = { version: '3.2.2', _: {}, config: {} };
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\) <span data-latex="">x^3</span>', {
      mathRenderingModuleUrlImported: true,
    });

    await renderMath(target);

    expect(printRenderMath).toHaveBeenCalledWith(target);
    expect(target.querySelector('[data-math-handled]')).toBeNull();
    expect(scripts).toHaveLength(0);
    expect(console.error).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it('finds the print player across a shadow root', async () => {
    const printPlayer = document.createElement('pie-print');
    const host = document.createElement('div');
    printPlayer.append(host);
    document.body.append(printPlayer);
    const target = document.createElement('div');
    target.innerHTML = '\\(x\\)';
    host.attachShadow({ mode: 'open' }).append(target);
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;

    await renderMath(target);

    expect(printRenderMath).toHaveBeenCalledWith(target);
  });

  it("waits for the legacy print player's renderer while the player imports it", async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\)', { mathRenderingModuleUrlImported: true });

    const rendering = renderMath(target);
    await vi.advanceTimersByTimeAsync(200);
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;
    await vi.advanceTimersByTimeAsync(50);
    await rendering;

    expect(printRenderMath).toHaveBeenCalledWith(target);
    expect(scripts).toHaveLength(0);
  });

  it("renders with its own MathJax when the print player's renderer does not arrive", async () => {
    vi.useFakeTimers();
    onTestFinished(() => {
      vi.useRealTimers();
    });
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\)', { mathRenderingModuleUrlImported: true });

    const rendering = renderMath(target);
    await vi.advanceTimersByTimeAsync(9_900);
    expect(scripts).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(200);
    expect(scripts).toHaveLength(1);
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('renders with its own MathJax at once in a <pie-print> that imports no renderer', async () => {
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\)');

    const rendering = renderMath(target);
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('ignores window.renderMath outside <pie-print>', async () => {
    const scripts = interceptScripts();
    const printRenderMath = vi.fn();
    page.renderMath = printRenderMath;
    const target = elementWith('\\(x\\)');

    const rendering = renderMath(target);
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    const { finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(printRenderMath).not.toHaveBeenCalled();
  });

  it('delegates string rendering to the player math renderer and returns rendered HTML', async () => {
    const playerRenderMath = vi.fn(async (element: HTMLElement) => {
      expect(element.innerHTML).toBe('\\(x^2 + 1\\)');
      element.innerHTML = '<span data-player-rendered>x squared plus 1</span>';
    });
    page['@pie-lib/math-rendering'] = { renderMath: playerRenderMath };
    const scripts = interceptScripts();

    const rendered = await renderMath('\\(x^2 + 1\\)');

    expect(playerRenderMath).toHaveBeenCalledTimes(1);
    expect(scripts).toHaveLength(0);
    expect(rendered).toBe('<span data-player-rendered="">x squared plus 1</span>');
  });

  it("renders with its own MathJax when the page's renderer is this renderMath", async () => {
    page['@pie-lib/math-rendering'] = { renderMath, wrapMath, mmlToLatex };
    const scripts = interceptScripts();
    const target = elementWith('\\(x\\)');

    const rendering = renderMath(target);
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
    expect(wrapMath('x^2')).toBe('\\(x^2\\)');
    expect(mmlToLatex('<math></math>')).toBe('<math></math>');
  });

  it("renders through another copy of the adapter installed as the page's renderer", async () => {
    vi.resetModules();
    const { renderMath: otherCopy } = await import('../src/render-math.js');
    page['@pie-lib/math-rendering'] = { renderMath: otherCopy };
    const scripts = interceptScripts();
    const target = elementWith('\\(x\\)');

    const rendering = renderMath(target);
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it("renders with its own MathJax when the print player's renderer is this renderMath", async () => {
    page.renderMath = renderMath;
    const scripts = interceptScripts();
    const target = printedElementWith('\\(x\\)', { mathRenderingModuleUrlImported: true });

    const rendering = renderMath(target);
    await vi.waitFor(() => expect(scripts).toHaveLength(1));
    const { typesetPromise, finishStartup } = runMathjaxScript();
    finishStartup();
    await rendering;

    expect(typesetPromise.mock.calls).toEqual([[[target]]]);
  });

  it('delegates safe helper methods to the player math renderer when available', () => {
    const playerWrapMath = vi.fn(
      (latex: string, wrapType?: string | null) => `${wrapType}:${latex}`
    );
    const playerMmlToLatex = vi.fn((mathml: string) => `latex:${mathml}`);
    page['@pie-lib/math-rendering'] = {
      renderMath: vi.fn(),
      wrapMath: playerWrapMath,
      mmlToLatex: playerMmlToLatex,
    };

    expect(wrapMath('x^2', 'dollar')).toBe('dollar:x^2');
    expect(mmlToLatex('<math></math>')).toBe('latex:<math></math>');
    expect(playerWrapMath).toHaveBeenCalledWith('x^2', 'dollar');
    expect(playerMmlToLatex).toHaveBeenCalledWith('<math></math>');
  });
});

describe('wrapMath', () => {
  it('wraps LaTeX as the legacy renderer does when the page renderer has no wrapMath', () => {
    // The player installs a renderer with renderMath alone.
    page['@pie-lib/math-rendering'] = { renderMath: vi.fn() };

    expect(wrapMath('x^2')).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', null)).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', 'round_brackets')).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', 'square_brackets')).toBe('\\(x^2\\)');
    expect(wrapMath('x^2', 'dollar')).toBe('$x^2$');
    expect(wrapMath('x^2', 'double_dollar')).toBe('$x^2$');
  });

  it('wraps LaTeX on a page without a math renderer', () => {
    expect(wrapMath('\\frac{1}{2}')).toBe('\\(\\frac{1}{2}\\)');
  });

  it('keeps one pair of delimiters on LaTeX that already has them', () => {
    expect(wrapMath('\\(x^2\\)')).toBe('\\(x^2\\)');
    expect(wrapMath('\\[x^2\\]')).toBe('\\(x^2\\)');
    expect(wrapMath('$$x^2$$')).toBe('\\(x^2\\)');
    expect(wrapMath('$x^2$', 'dollar')).toBe('$x^2$');
  });

  it('keeps \\displaystyle, which only rendering drops', () => {
    expect(wrapMath('\\displaystyle\\sum_{i=1}^n i')).toBe('\\(\\displaystyle\\sum_{i=1}^n i\\)');
  });
});
