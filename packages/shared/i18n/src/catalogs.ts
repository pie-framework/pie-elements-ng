/**
 * Per-package catalogs and the page-wide registry that ties them together.
 *
 * The package that renders a string owns it: an element and each library on its render path
 * define their own catalogs with `defineCatalogs`. The `en-US` catalog is a static import of the
 * defining module, so the typical English render needs no load; every other locale is a loader
 * the bundler can split.
 *
 * An element renders through libraries whose catalogs it does not know, so readiness is asked of
 * the page: `isLocaleReady` and `loadLocale` cover every catalog set evaluated on it. The
 * registry lives on `globalThis` under `Symbol.for`, because every IIFE bundle and every
 * webpack-built player bundle carries its own copy of this engine, and one host call has to
 * reach all of them.
 */

import { DEFAULT_LOCALE, SimpleI18n } from './provider.js';
import type { CatalogLoader, MessageCatalog, NestedKeys, Translator } from './types.js';

/**
 * The registry shape, a contract between engine copies of different versions on one page. Its
 * members only grow; an older copy ignores what it does not read.
 */
interface PageRegistry {
  /** Every catalog set evaluated on the page. */
  sets: Set<RegisteredCatalogs>;
  /** Host messages by package name, in registration order. */
  messages: Map<string, HostMessages[]>;
}

interface HostMessages {
  locale: string;
  messages: MessageCatalog;
}

interface RegisteredCatalogs {
  readonly packageName: string;
  needsLoad(locale: string): boolean;
  load(locale: string): Promise<void>;
  addCustomMessages(locale: string, messages: MessageCatalog): void;
}

const REGISTRY_KEY = Symbol.for('pie-element.i18n.registry');

function pageRegistry(): PageRegistry {
  const host = globalThis as typeof globalThis & { [REGISTRY_KEY]?: PageRegistry };
  if (!host[REGISTRY_KEY]) {
    host[REGISTRY_KEY] = { sets: new Set(), messages: new Map() };
  }
  return host[REGISTRY_KEY];
}

export interface CatalogsOptions<C extends MessageCatalog> {
  /** The npm package that owns these strings; host messages are registered against it. */
  packageName: string;
  /** The `en-US` catalog, imported statically by the defining module. */
  source: C;
  /**
   * Every other shipped locale by BCP-47 tag. Write each as
   * `() => import(/* webpackMode: "eager" *\/ './es-ES.js')`: Vite's browser build still splits
   * it, the IIFE build drops it, and the multi-element webpack builds, which load chunks relative
   * to the host page, inline it instead of emitting a chunk they cannot fetch.
   */
  loaders?: Readonly<Record<string, CatalogLoader>>;
}

export interface Catalogs<C extends MessageCatalog> {
  readonly packageName: string;
  /** Shipped locale tags, `en-US` first. */
  readonly locales: readonly string[];
  /**
   * A translator fixed to `locale`, `en-US` when none is given. Synchronous: it renders what is
   * resident and English for any key it lacks.
   *
   * With `onLoad`, a locale that is not resident starts loading and `onLoad` runs once the load
   * settles. A library component passes its re-render, because the element rendering it may
   * never call `loadLocale`; an element that does call it first renders no English frame.
   */
  forLocale(locale?: string | null, onLoad?: () => void): Translator<NestedKeys<C>>;
  /** Whether `locale` would load a catalog for this package. */
  needsLoad(locale: string): boolean;
  /** Load `locale` for this package; a failed load is reported once and then served as English. */
  load(locale: string): Promise<void>;
}

/** Define one package's catalogs and register them on the page. */
export function defineCatalogs<C extends MessageCatalog>(options: CatalogsOptions<C>): Catalogs<C> {
  const loaders = options.loaders ?? {};
  const registry = pageRegistry();
  const root = new SimpleI18n<C>({
    source: options.source,
    availableLocales: [DEFAULT_LOCALE, ...Object.keys(loaders)],
    loadCatalog: async (locale) => (await loaders[locale]()).default,
  });
  for (const { locale, messages } of registry.messages.get(options.packageName) ?? []) {
    root.addCustomMessages(locale, messages);
  }
  const views = new Map<string, SimpleI18n<C>>();
  const pending = new Map<string, Promise<void>>();
  const failed = new Set<string>();

  const view = (locale?: string | null): SimpleI18n<C> => {
    const tag = locale || DEFAULT_LOCALE;
    let cached = views.get(tag);
    if (!cached) {
      cached = root.withLocale(tag);
      views.set(tag, cached);
    }
    return cached;
  };

  const catalogs: Catalogs<C> & RegisteredCatalogs = {
    packageName: options.packageName,
    locales: [DEFAULT_LOCALE, ...Object.keys(loaders)],
    forLocale: (locale, onLoad) => {
      if (onLoad && locale && catalogs.needsLoad(locale)) {
        void catalogs.load(locale).then(onLoad);
      }
      return view(locale);
    },
    needsLoad: (locale) => !failed.has(locale) && root.needsLoad(locale),
    load: (locale) => {
      if (!catalogs.needsLoad(locale)) return Promise.resolve();
      let load = pending.get(locale);
      if (!load) {
        load = view(locale)
          .setLocale(locale)
          .catch((error: unknown) => {
            // Not retried: a chunk that failed once fails on every render, and English is a
            // rendering, where a rejected load would leave the element blank.
            failed.add(locale);
            console.warn(`[${options.packageName}]`, error);
          })
          .finally(() => pending.delete(locale));
        pending.set(locale, load);
      }
      return load;
    },
    addCustomMessages: (locale, messages) => {
      root.addCustomMessages(locale, messages);
      // A view resolved its tag against the locales known when it was made; messages for a
      // new tag can change that resolution.
      views.clear();
    },
  };
  registry.sets.add(catalogs);
  return catalogs;
}

/** Whether every catalog set on the page renders `locale` without a load. */
export function isLocaleReady(locale: string | null | undefined): boolean {
  if (!locale) return true;
  for (const set of pageRegistry().sets) {
    if (set.needsLoad(locale)) return false;
  }
  return true;
}

/** Load `locale` for every catalog set on the page. Never rejects; a failure renders English. */
export async function loadLocale(locale: string | null | undefined): Promise<void> {
  if (!locale) return;
  await Promise.all([...pageRegistry().sets].map((set) => set.load(locale)));
}

/**
 * Supply or override one package's messages for one locale, deep-merged over what it ships.
 *
 * The runtime injection channel: a host renames a label, or serves a locale no package ships,
 * without a rebuild. It applies to every copy of that package on the page and to copies
 * evaluated later. An element already rendered picks the messages up on its next render.
 */
export function registerMessages(
  packageName: string,
  locale: string,
  messages: MessageCatalog
): void {
  const registry = pageRegistry();
  const registered = registry.messages.get(packageName) ?? [];
  registered.push({ locale, messages });
  registry.messages.set(packageName, registered);
  for (const set of registry.sets) {
    if (set.packageName === packageName) set.addCustomMessages(locale, messages);
  }
}
