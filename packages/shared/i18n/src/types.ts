/**
 * Catalog and provider types, kept free of runtime values so a component can import the whole
 * contract with `import type`.
 *
 * Mirrors pie-players' `players-shared/src/i18n/types.ts`, generic over the catalog: there each
 * key derives from the one `en-US` catalog the repository ships, here every element and library
 * owns its own catalog and its keys derive from that.
 */

/**
 * Plural forms keyed by CLDR plural category. Only `other` is required: `Intl.PluralRules`
 * selects the category for the active locale, and a category the catalog lacks resolves to
 * `other`.
 */
export interface PluralTranslation {
  zero?: string;
  one?: string;
  two?: string;
  few?: string;
  many?: string;
  other: string;
}

/** A catalog node: a leaf string, a plural group, or a namespace. */
export type MessageNode = string | PluralTranslation | { [key: string]: MessageNode };

/** A whole catalog, as one locale module default-exports it. */
export type MessageCatalog = { [key: string]: MessageNode };

type PluralCategoryKey = keyof PluralTranslation;

/**
 * Dot-notation keys of a catalog shape. A plural group terminates the path at the group, so
 * `plural('maxSelections', …)` is typed and `'maxSelections.other'` is not. A group is
 * recognized by every one of its keys being a CLDR category.
 */
export type NestedKeys<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : keyof T[K] extends PluralCategoryKey
      ? K
      : T[K] extends object
        ? K | `${K}.${NestedKeys<T[K]>}`
        : K;
}[keyof T & string];

/**
 * A key assembled at runtime from an id the catalog cannot enumerate. Branded, so the only way
 * to produce one is `dynamicMessageKey` and a mistyped literal stays a compile error. The brand
 * is a named property because a `unique symbol` is not identity-compatible across two emitted
 * copies of this declaration.
 */
export type DynamicMessageKey = string & { readonly __pieDynamicMessageKey: true };

/** Interpolation values substituted into `{placeholder}` slots. */
export type InterpolationValues = Record<string, string | number | boolean | null | undefined>;

/** Options for `plural`; `count` also interpolates. */
export interface PluralOptions extends InterpolationValues {
  count: number;
}

/** Writing direction of a locale. */
export type TextDirection = 'ltr' | 'rtl';

/** Loader for one shipped locale's catalog module. */
export type CatalogLoader = () => Promise<{ default: MessageCatalog }>;

/** Provider configuration. */
export interface I18nConfig<C extends MessageCatalog = MessageCatalog> {
  /** The `en-US` catalog, bundled statically: the fallback for every key and the source of key types. */
  source: C;

  /** Initial locale. Defaults to `en-US`; never detected from the browser. */
  locale?: string;

  /** Locale every missing key falls back to. Defaults to `en-US`. */
  fallbackLocale?: string;

  /** Loader for a shipped locale. Omitted, only `source` and `customMessages` are available. */
  loadCatalog?: (locale: string) => Promise<MessageCatalog>;

  /** Locale tags `loadCatalog` can serve. */
  availableLocales?: readonly string[];

  /**
   * Host-supplied messages keyed by locale tag, consulted ahead of the shipped catalog for the
   * same locale: a host can rename one label without a fork, and supply a locale nobody ships.
   */
  customMessages?: Record<string, MessageCatalog>;

  /** Called once per missing key per lookup. */
  onMissingKey?: (key: string, locale: string) => void;
}

/**
 * What a component translates through, typed by its own catalog's keys. Framework-free, so
 * React and Svelte components share it.
 */
export interface Translator<K extends string = string> {
  /** Active locale tag, canonicalized to the resolved catalog's tag. */
  getLocale(): string;

  /** Translate a key, interpolating `{placeholder}` slots; a miss returns the key. */
  t(key: K | DynamicMessageKey, values?: InterpolationValues): string;

  /** Translate a plural group, selecting the CLDR category for `options.count`. */
  plural(key: K | DynamicMessageKey, options: PluralOptions): string;

  /** Writing direction of the active locale. */
  getDirection(): TextDirection;

  /** Whether a key resolves in the active locale or its fallback chain. */
  hasKey(key: K | DynamicMessageKey): boolean;
}

/** The full service surface of the bundled provider. */
export interface I18nServiceApi<K extends string = string> extends Translator<K> {
  /** Switch locale, loading its catalog first; subscribers are notified once it is in place. */
  setLocale(locale: string): Promise<void>;

  /** Locale tags this provider can serve. */
  getAvailableLocales(): string[];

  /** Whether a locale's catalog is already resident. */
  isLocaleLoaded(locale: string): boolean;

  /** Whether `setLocale(locale)` would load a catalog. */
  needsLoad(locale: string): boolean;

  /** Observe locale and catalog changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;

  /** Add or override messages for one locale, deep-merged. */
  addCustomMessages(locale: string, messages: MessageCatalog): void;

  /** A view fixed to another locale, sharing catalogs, loads and custom messages. */
  withLocale(locale: string): I18nServiceApi<K>;

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string;

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string;
}
