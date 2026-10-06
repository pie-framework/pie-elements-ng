/**
 * Where MathJax's fonts, speech worker and, for the npm build, MathJax itself load from. Neither
 * build names a host: every file resolves from an npm root, a URL under which
 * `<package>@<version>/<path>` serves that file of the package, as jsDelivr's `/npm`, raw.esm.sh,
 * unpkg and npm-mirroring proxies do.
 */
import type { MathjaxOptions } from './types.js';

/** The version `mathjax`, `@mathjax/src` and both MathJax fonts are pinned to. */
export const MATHJAX_VERSION = '4.1.3';

export const ASSETS_DOCS_URL =
  'https://github.com/pie-framework/pie-elements-ng/blob/develop/docs/MATH-RENDERING.md#assets';

/** The legacy renderer's page options, which this adapter reads as well. */
export const PAGE_OPTIONS_KEY = '@pie-lib/math-rendering@2';

/** SRE's braille codes, which it lists with its locales; the language menu leaves them out. */
const BRAILLE_CODES = ['nemeth', 'euro'];

export interface MathjaxAssets {
  /** The npm root MathJax's files load from. */
  root?: string;
  /** The directory of `speech-worker.js` and its `mathmaps/`. */
  speechPath?: string;
  /** The speech locales the menu lists, by id, with any label to show; undefined lists SRE's. */
  speechLocales?: Map<string, string | undefined>;
}

const PACKAGE_SEGMENT = /^[^@]+@[^@]+$/;

/**
 * The npm root of `url`: the part before its last `<package>@<version>` path segment, scope
 * included. Undefined for a URL without one, a file under `node_modules`, and a URL with no
 * origin (`file:`, `blob:`, `data:`), which is what bundlers turn a module's URL into.
 */
export function npmRoot(url: string | undefined): string | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.origin === 'null') return undefined;
  const segments = parsed.pathname.split('/');
  for (let i = segments.length - 1; i > 0; i--) {
    const segment = segments[i];
    if (segment === 'node_modules') return undefined;
    if (!PACKAGE_SEGMENT.test(segment)) continue;
    const start = segments[i - 1]?.startsWith('@') ? i - 1 : i;
    return parsed.origin + segments.slice(0, start).join('/');
  }
  return undefined;
}

type PageOptionsRegistry = { [PAGE_OPTIONS_KEY]?: { opts?: unknown } };

function pageOptions(): Record<string, unknown> {
  const opts = (globalThis as PageOptionsRegistry)[PAGE_OPTIONS_KEY]?.opts;
  return opts && typeof opts === 'object' ? (opts as Record<string, unknown>) : {};
}

/** `url` made absolute against the page, without a trailing slash: the speech worker needs both. */
function absolute(url: unknown): string | undefined {
  if (typeof url !== 'string' || !url) return undefined;
  const base = typeof document === 'undefined' ? undefined : document.baseURI;
  try {
    return new URL(url, base).href.replace(/\/+$/, '');
  } catch {
    return undefined;
  }
}

function localeList(locales: unknown): Map<string, string | undefined> | undefined {
  if (Array.isArray(locales)) {
    return new Map(locales.filter((id) => typeof id === 'string').map((id) => [id, undefined]));
  }
  if (locales && typeof locales === 'object') {
    return new Map(
      Object.entries(locales).map(([id, label]) => [
        id,
        typeof label === 'string' ? label : undefined,
      ])
    );
  }
  return undefined;
}

/**
 * The assets `options` set, then the page's options, then the npm root of `moduleUrl`, the URL
 * this module loaded from.
 */
export function resolveAssets(options: MathjaxOptions, moduleUrl?: string): MathjaxAssets {
  const page = pageOptions();
  const root = absolute(options.assetRoot ?? page.assetRoot) ?? npmRoot(moduleUrl);
  return {
    root,
    speechPath:
      absolute(options.speechPath ?? page.speechPath) ??
      (root ? `${root}/mathjax@${MATHJAX_VERSION}/sre` : undefined),
    speechLocales: localeList(options.speechLocales ?? page.speechLocales),
  };
}

/** The menu lists SRE's `locales`; this leaves the listed locales in it, braille codes kept. */
export function listSpeechLocales(
  locales: Map<string, string> | undefined,
  listed: Map<string, string | undefined> | undefined
): void {
  if (!locales || !listed) return;
  for (const id of [...locales.keys()]) {
    if (!listed.has(id) && !BRAILLE_CODES.includes(id)) locales.delete(id);
  }
  for (const [id, label] of listed) {
    if (label || !locales.has(id)) locales.set(id, label ?? id);
  }
}

/** The locale speech starts in when English is not listed: the first listed locale. */
export function defaultSpeechLocale(
  listed: Map<string, string | undefined> | undefined
): string | undefined {
  if (!listed || listed.has('en')) return undefined;
  return [...listed.keys()].find((id) => !BRAILLE_CODES.includes(id));
}

/**
 * Dispatched on `window` once per effect per page when an adapter copy has no asset root, with a
 * {@link NoAssetRootDetail}. Players forward it to their instrumentation.
 */
export const NO_ASSET_ROOT_EVENT = 'pie-mathjax-no-asset-root';

export type NoAssetRootEffect =
  /** The npm build loads no MathJax, so math stays untypeset. */
  | 'untypeset'
  /** The browser build typesets in the page's fonts. */
  | 'no-web-fonts'
  /** The browser build typesets in the page's fonts, with speech, braille and the explorer off. */
  | 'no-web-fonts-or-speech';

export interface NoAssetRootDetail {
  effect: NoAssetRootEffect;
  message: string;
  docsUrl: string;
}

const CONSEQUENCES: Record<NoAssetRootEffect, string> = {
  untypeset: 'no MathJax loads, so math stays untypeset',
  'no-web-fonts': 'math renders without web fonts',
  'no-web-fonts-or-speech': 'math renders without web fonts and speech',
};

// Every element bundles its own copy of this module, so what was reported is kept on the page.
const REPORTED: unique symbol = Symbol.for('@pie-element/shared-math-rendering-mathjax/no-assets');

type ReportRegistry = { [REPORTED]?: NoAssetRootEffect[] };

/**
 * Reports once per effect per page that MathJax's files have nowhere to load from: a
 * `console.error` when math stays untypeset, a `console.warn` when it renders degraded, and
 * {@link NO_ASSET_ROOT_EVENT} for each.
 */
export function reportNoAssetRoot(effect: NoAssetRootEffect): void {
  const registry = globalThis as ReportRegistry;
  registry[REPORTED] ??= [];
  const reported = registry[REPORTED];
  if (reported.includes(effect)) return;
  reported.push(effect);
  const message =
    `[math-rendering] No asset root for MathJax: ${CONSEQUENCES[effect]}. Set ` +
    `window['${PAGE_OPTIONS_KEY}'].opts.assetRoot to an npm root. See ${ASSETS_DOCS_URL}`;
  if (effect === 'untypeset') console.error(message);
  else console.warn(message);
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NoAssetRootDetail>(NO_ASSET_ROOT_EVENT, {
      detail: { effect, message, docsUrl: ASSETS_DOCS_URL },
    })
  );
}
