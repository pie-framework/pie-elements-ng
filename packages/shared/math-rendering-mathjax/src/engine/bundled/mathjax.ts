/**
 * MathJax 4 built from the `@mathjax/src` modules, and started as the component startup starts
 * `tex-mml-chtml.js` with the configuration the adapter writes for it. The component loader and
 * startup bind to `window.MathJax`, so the build leaves them out: it fails when either is reached,
 * and replaces `components/global.js`, which the menu imports, with `./global.ts`.
 *
 * What `tex-mml-chtml.js` loads on demand is bundled: the TeX packages its autoload fetches, with
 * the font extension mhchem loads, the dynamic ranges of its font, chunks of this build requested
 * as this module evaluates, and the menu's accessibility extensions. Its font files, speech worker
 * and mathmaps load from the URLs the assets list for them, else from the asset root at the npm
 * paths the component build loads them from. SVG output and collapsing math are not bundled, and
 * their menu items are disabled.
 */
import { AssistiveMmlHandler } from '@mathjax/src/js/a11y/assistive-mml.js';
import * as assistiveMml from '@mathjax/src/js/a11y/assistive-mml.js';
import * as explorer from '@mathjax/src/js/a11y/explorer.js';
import { ExplorerHandler } from '@mathjax/src/js/a11y/explorer.js';
import * as Region from '@mathjax/src/js/a11y/explorer/Region.js';
import { EnrichHandler } from '@mathjax/src/js/a11y/semantic-enrich.js';
import { SpeechHandler } from '@mathjax/src/js/a11y/speech.js';
import * as Sre from '@mathjax/src/js/a11y/sre.js';
import { browserAdaptor } from '@mathjax/src/js/adaptors/browserAdaptor.js';
import { HTMLHandler } from '@mathjax/src/js/handlers/html/HTMLHandler.js';
import { MathML } from '@mathjax/src/js/input/mathml.js';
import { TeX } from '@mathjax/src/js/input/tex.js';
import { mathjax } from '@mathjax/src/js/mathjax.js';
import { CHTML } from '@mathjax/src/js/output/chtml.js';
import { Menu } from '@mathjax/src/js/ui/menu/Menu.js';
import { MenuHandler } from '@mathjax/src/js/ui/menu/MenuHandler.js';
import { MathJaxMhchemFontExtension } from '@mathjax/mathjax-mhchem-font-extension/js/chtml.js';
import { MathJaxNewcmFont } from '@mathjax/mathjax-newcm-font/js/chtml.js';
import { dynamicFonts } from 'virtual:bundled-mathjax-assets';
import type { MathJaxGlobal } from '../../adapter.js';
import { assetUrl, MATHJAX_VERSION, type MathjaxAssets, reportNoAssetRoot } from '../../assets.js';
import { speechWorkerScript, startWorker } from '../../speech-worker.js';
import { combineDefaults, MathJax } from './global.js';

// The TeX packages `input/tex` preloads, less require and autoload, which load packages through
// the component loader.
import '@mathjax/src/js/input/tex/base/BaseConfiguration.js';
import '@mathjax/src/js/input/tex/ams/AmsConfiguration.js';
import '@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js';
import '@mathjax/src/js/input/tex/textmacros/TextMacrosConfiguration.js';
import '@mathjax/src/js/input/tex/noundefined/NoUndefinedConfiguration.js';
import '@mathjax/src/js/input/tex/configmacros/ConfigMacrosConfiguration.js';
// The packages autoload loads on the first use of one of their macros.
import '@mathjax/src/js/input/tex/action/ActionConfiguration.js';
import '@mathjax/src/js/input/tex/amscd/AmsCdConfiguration.js';
import '@mathjax/src/js/input/tex/bbox/BboxConfiguration.js';
import '@mathjax/src/js/input/tex/boldsymbol/BoldsymbolConfiguration.js';
import '@mathjax/src/js/input/tex/braket/BraketConfiguration.js';
import '@mathjax/src/js/input/tex/bussproofs/BussproofsConfiguration.js';
import '@mathjax/src/js/input/tex/cancel/CancelConfiguration.js';
import '@mathjax/src/js/input/tex/color/ColorConfiguration.js';
import '@mathjax/src/js/input/tex/enclose/EncloseConfiguration.js';
import '@mathjax/src/js/input/tex/extpfeil/ExtpfeilConfiguration.js';
import '@mathjax/src/js/input/tex/html/HtmlConfiguration.js';
import '@mathjax/src/js/input/tex/mhchem/MhchemConfiguration.js';
import '@mathjax/src/js/input/tex/unicode/UnicodeConfiguration.js';
import '@mathjax/src/js/input/tex/verb/VerbConfiguration.js';

export const TEX_PACKAGES = [
  'base',
  'ams',
  'newcommand',
  'textmacros',
  'noundefined',
  'configmacros',
  'action',
  'amscd',
  'bbox',
  'boldsymbol',
  'braket',
  'bussproofs',
  'cancel',
  'color',
  'enclose',
  'extpfeil',
  'html',
  'mhchem',
  'unicode',
  'verb',
];

/** The components this engine takes from `loader.load`. */
const LOADABLE = ['a11y/assistive-mml'];

/**
 * The configuration this engine maps, by block, as the component build reads it. Anything else
 * fails the start: a setting this engine passed over would make it render differently from the
 * page engine, and the browser tests run every configuration the adapter writes.
 */
const SUPPORTED: Record<string, readonly string[] | null> = {
  // `output/svg` sets SVG output up when the menu loads it, which this engine cannot.
  loader: ['load', 'failed', 'output/svg'],
  startup: ['typeset', 'ready'],
  tex: null,
  chtml: null,
  output: null,
  options: null,
};

function checkConfig(config: MathJaxGlobal): void {
  const unsupported: string[] = [];
  for (const [block, value] of Object.entries(config)) {
    if (!(block in SUPPORTED)) {
      unsupported.push(block);
      continue;
    }
    const keys = SUPPORTED[block];
    if (keys && value) {
      for (const key of Object.keys(value)) {
        if (!keys.includes(key)) unsupported.push(`${block}.${key}`);
      }
    }
  }
  for (const name of config.loader?.load ?? []) {
    if (!LOADABLE.includes(name)) unsupported.push(`loader.load: ${name}`);
  }
  if (config.startup?.typeset !== false) unsupported.push('startup.typeset');
  if (config.tex && 'packages' in config.tex) unsupported.push('tex.packages');
  if (unsupported.length) {
    throw new Error(
      `[math-rendering] The bundled MathJax does not support ${unsupported.join(', ')}`
    );
  }
}

// Every dynamic range is requested as this module evaluates, so a range math first uses later is
// in hand. A range registers its data on this copy's font class, and changes nothing else.
for (const load of Object.values(dynamicFonts)) load().catch(() => {});

/** The name prefix the font's dynamic ranges are requested under. */
const DYNAMIC_FONT_PREFIX = `${MathJaxNewcmFont.OPTIONS.dynamicPrefix}/`;

/** Serves the font's dynamic ranges, which MathJax requests by name, from this build's chunks. */
function loadFromBundle(name: string): Promise<unknown> {
  const load = name.startsWith(DYNAMIC_FONT_PREFIX)
    ? dynamicFonts[name.slice(DYNAMIC_FONT_PREFIX.length).replace(/\.js$/, '')]
    : undefined;
  return load
    ? load()
    : Promise.reject(new Error(`[math-rendering] The bundled MathJax has no module '${name}'`));
}

/** Whether this copy has a speech worker; without one, enrichment and what needs it stay off. */
let hasSpeech = true;

/**
 * The menu without the items this engine cannot honour. Settings another MathJax stored under the
 * same key may name SVG output or collapsing math; the menu would load each through the component
 * loader, and a renderer it cannot load stalls every later typeset. Without a speech worker,
 * enrichment would start one, so it is off too, and with it speech, braille and the explorer.
 */
class BundledMenu extends Menu {
  protected mergeUserSettings(): void {
    super.mergeUserSettings();
    this.settings.renderer = this.document.outputJax.name;
    this.settings.collapsible = false;
    if (!hasSpeech) this.settings.enrich = false;
  }

  protected checkLoadableItems(): void {
    for (const name of Object.keys(this.jax)) {
      if (!this.jax[name]) this.menu.findID('Settings', 'Renderer', name).disable();
    }
    this.menu.findID('Options', 'Collapsible').disable();
    this.menu.findID('Options', 'AutoCollapse').disable();
    if (!hasSpeech) this.menu.findID('Options', 'Enrich').disable();
  }
}

/** The npm path of a MathJax font package's woff2 directory. */
function fontDir(font: string): string {
  return `@mathjax/${font}@${MATHJAX_VERSION}/chtml/woff2`;
}

const FONT_DIRS = ['mathjax-newcm-font', 'mathjax-mhchem-font-extension'].map(fontDir);

/** A file in a `@font-face` rule's `src`, after the directory MathJax substitutes for `%%URL%%`. */
const FONT_FILE = /%%URL%%\/([^"')]+)/g;

/**
 * Points each `@font-face` rule of a font this engine names by npm path at its file's URL, and
 * leaves out a rule whose file has none, so math draws that range in the page's fonts. A font URL
 * the configuration sets, as `loadFonts: false` sets an empty one, is substituted as MathJax does.
 * Every copy of this engine has its own font class. Returns the speech worker's script, undefined
 * without one.
 */
function useAssets(assets: MathjaxAssets): string | undefined {
  const workerScript = speechWorkerScript(assets);
  hasSpeech = Boolean(workerScript);
  const addFontURLs = MathJaxNewcmFont.addFontURLs.bind(MathJaxNewcmFont);
  MathJaxNewcmFont.addFontURLs = (styles, fonts, dir) => {
    if (!FONT_DIRS.includes(dir)) return addFontURLs(styles, fonts, dir);
    for (const [name, font] of Object.entries(fonts)) {
      let found = true;
      const src = String(font.src).replace(FONT_FILE, (_match, file: string) => {
        const url = assetUrl(assets, `${dir}/${file}`);
        if (!url) found = false;
        return url ?? '';
      });
      if (found) styles[name] = { ...font, src };
    }
  };
  const listed = [...(assets.urls?.keys() ?? [])];
  const hasFonts =
    Boolean(assets.root) ||
    listed.some((path) => FONT_DIRS.some((dir) => path.startsWith(`${dir}/`)));
  if (!hasFonts) reportNoAssetRoot(hasSpeech ? 'no-web-fonts' : 'no-web-fonts-or-speech');
  return workerScript;
}

/** Resolves once the page's DOM is parsed, as the component startup waits for it. */
function whenPageReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    const state = document.readyState;
    if (state === 'complete' || state === 'interactive') {
      resolve();
    } else {
      window.addEventListener('DOMContentLoaded', () => resolve(), { once: true, capture: true });
    }
  });
}

/**
 * MathJax ids each explorer region's stylesheet by its class name, which minifiers rename, so two
 * copies on a page can give different regions one id, and a region then reads the other's sheet
 * and throws. Each region takes an id from its export name and this copy's number.
 */
function useOwnRegionStylesheetIds(copy: number): void {
  for (const [name, region] of Object.entries(Region)) {
    if (region === Region.AbstractRegion || region.prototype instanceof Region.AbstractRegion) {
      Object.defineProperty(region, 'sheetId', { value: `PIE-MJX-${name}-styles-${copy}` });
    }
  }
}

/**
 * This copy's MathJax, configured by `config`, its stylesheet ids carrying `copy`. Its
 * `startup.defaultReady` builds the document, as the component startup's does; until then `_`
 * holds the classes `startup.ready` may adjust.
 */
export function createMathJax(
  config: MathJaxGlobal,
  assets: MathjaxAssets,
  copy: number
): MathJaxGlobal {
  if (MathJax.startup) throw new Error('[math-rendering] The bundled MathJax starts once');
  checkConfig(config);
  mathjax.asyncLoad = loadFromBundle;
  useOwnRegionStylesheetIds(copy);
  const workerScript = useAssets(assets);

  const accessibility = config.loader?.load?.includes('a11y/assistive-mml') ?? false;
  MathJax.config = config;
  MathJax._ = {
    a11y: {
      explorer: { Region },
      explorer_ts: explorer,
      sre_ts: Sre,
      ...(accessibility ? { 'assistive-mml': assistiveMml } : {}),
    },
    output: { chtml_ts: { CHTML } },
    ui: { menu: { Menu: { Menu } } },
  };

  let resolveStartup: () => void = () => {};
  let rejectStartup: (error: unknown) => void = () => {};
  const promise = new Promise<void>((resolve, reject) => {
    resolveStartup = resolve;
    rejectStartup = reject;
  });

  const startup: Record<string, any> = {
    promise,
    // The menu rerenders math only once something has been typeset.
    hasTypeset: false,
    defaultReady() {
      // The mhchem component adds this extension to the font class as it loads.
      MathJaxNewcmFont.addExtension({
        ...MathJaxMhchemFontExtension,
        fontURL: fontDir('mathjax-mhchem-font-extension'),
      });
      const tex = new TeX({ packages: TEX_PACKAGES, ...config.tex });
      const mml = new MathML();
      const chtml = new CHTML(
        combineDefaults({ chtml: { ...config.chtml } }, 'chtml', {
          ...config.output,
          fontData: MathJaxNewcmFont,
          fontURL: fontDir('mathjax-newcm-font'),
        })
      );

      // The component startup applies handler extensions by priority, then in load order:
      // enrichment, speech and the explorer as tex-mml-chtml.js loads them, hidden MathML from
      // `loader.load`, and the menu last.
      const adaptor = browserAdaptor();
      if (workerScript)
        adaptor.createWorker = async (listener) => startWorker(workerScript, listener);
      let handler: any = new HTMLHandler(adaptor, 5);
      handler = EnrichHandler(handler, new MathML({ allowHtmlInTokenNodes: true }));
      handler = SpeechHandler(handler, null as any);
      handler = ExplorerHandler(handler);
      if (accessibility) handler = AssistiveMmlHandler(handler);
      handler = MenuHandler(handler);
      mathjax.handlers.register(handler);

      const options: Record<string, any> = { ...config.options };
      if (!workerScript) options.enableEnrichment = false;
      const mathDocument: any = mathjax.document(document, {
        ...options,
        MenuClass: BundledMenu,
        InputJax: [tex, mml],
        OutputJax: chtml,
      });
      startup.document = mathDocument;
      whenPageReady()
        .then(() => mathDocument.menu?.loadingPromise)
        .then(resolveStartup, rejectStartup);
    },
  };
  MathJax.startup = startup;

  MathJax.typesetPromise = (elements: Element[] | null = null) => {
    startup.hasTypeset = true;
    const mathDocument = startup.document;
    return mathDocument.whenReady(async () => {
      mathDocument.options.elements = elements;
      mathDocument.reset();
      await mathDocument.renderPromise();
    });
  };
  MathJax.typesetClear = (elements: Element[] | null = null) => {
    if (elements) {
      startup.document.clearMathItemsWithin(elements);
    } else {
      startup.document.clear();
    }
  };

  return MathJax as MathJaxGlobal;
}
