/**
 * The provider, ported from pie-players' `SimpleI18n`
 * (`players-shared/src/i18n/provider.ts`): the same resolution order, fallback chain, plural
 * selection and `{placeholder}` syntax, so a string resolves identically on either side of the
 * player/element boundary.
 *
 * Two differences, both from catalog ownership. The `en-US` catalog arrives as `config.source`
 * rather than a static import, because each element package owns its strings. And the browser
 * locale is never consulted at all: pie-players exports a detector a host may opt into; an
 * element has no host to opt in for it.
 */

import {
  findBestLanguageMatch,
  languageTagScriptsMatch,
  normalizeLanguageTag,
  toLanguageTag,
} from './language-tags.js';
import type {
  DynamicMessageKey,
  I18nConfig,
  I18nServiceApi,
  InterpolationValues,
  MessageCatalog,
  MessageNode,
  NestedKeys,
  PluralOptions,
  PluralTranslation,
  TextDirection,
} from './types.js';

/** The locale every fallback chain terminates at. */
export const DEFAULT_LOCALE = 'en-US';

/**
 * Assert that a runtime-assembled string is a message key, for a key built from an id the
 * catalog cannot enumerate. Unchecked: pair it with `hasKey` where a miss must not reach the
 * screen.
 */
export function dynamicMessageKey(key: string): DynamicMessageKey {
  return key as DynamicMessageKey;
}

/**
 * Right-to-left primary language subtags, consulted only where `Intl.Locale#textInfo` is
 * unavailable: it is the CLDR answer but shipped late in Safari.
 */
const RTL_LANGUAGES = new Set([
  'ar', // Arabic
  'ckb', // Central Kurdish
  'dv', // Dhivehi
  'fa', // Persian
  'he',
  'iw', // Hebrew, current and legacy subtags
  'ks', // Kashmiri
  'ku', // Kurdish
  'nqo', // N'Ko
  'ps', // Pashto
  'sd', // Sindhi
  'syr', // Syriac
  'ug', // Uyghur
  'ur', // Urdu
  'yi', // Yiddish
]);

const PLURAL_CATEGORIES = new Set(['zero', 'one', 'two', 'few', 'many', 'other']);

function isPluralGroup(node: MessageNode): node is PluralTranslation {
  if (typeof node !== 'object' || node === null) return false;
  const keys = Object.keys(node);
  return keys.length > 0 && keys.every((key) => PLURAL_CATEGORIES.has(key));
}

/** Writing direction of a locale tag. */
export function localeDirection(locale: string): TextDirection {
  try {
    const textInfo = (new Intl.Locale(locale) as { textInfo?: { direction?: string } }).textInfo;
    if (textInfo?.direction === 'rtl' || textInfo?.direction === 'ltr') {
      return textInfo.direction;
    }
  } catch {
    // Not a tag `Intl.Locale` accepts; the subtag check below still answers.
  }
  const language = normalizeLanguageTag(locale).split('-')[0] ?? '';
  return RTL_LANGUAGES.has(language) ? 'rtl' : 'ltr';
}

/**
 * Catalogs are BCP-47 keyed and resolved through RFC 4647 lookup, and plural categories come
 * from `Intl.PluralRules`. Never writes `lang` or `dir` anywhere: stamping is the component's
 * job, on its own host.
 */
export class SimpleI18n<C extends MessageCatalog = MessageCatalog>
  implements I18nServiceApi<NestedKeys<C>>
{
  /** Shared across instances and views: `Intl.PluralRules` is not cheap. */
  private static readonly pluralRules = new Map<string, Intl.PluralRules>();

  private locale: string;
  private readonly fallbackLocale: string;
  /** Shared by reference with every `withLocale` view. */
  private catalogs: Map<string, MessageCatalog>;
  private customMessages: Record<string, MessageCatalog>;
  private loading: Map<string, Promise<void>>;
  private readonly listeners = new Set<() => void>();
  private readonly config: I18nConfig<C>;

  constructor(config: I18nConfig<C>) {
    this.config = { ...config };
    this.fallbackLocale = toLanguageTag(config.fallbackLocale) || DEFAULT_LOCALE;
    this.catalogs = new Map([[DEFAULT_LOCALE, config.source as MessageCatalog]]);
    this.customMessages = { ...(config.customMessages ?? {}) };
    this.loading = new Map();
    this.locale = this.resolveLocaleTag(config.locale) ?? DEFAULT_LOCALE;
  }

  getLocale(): string {
    return this.locale;
  }

  /**
   * Resolve the request against the catalogs this provider can serve, load the winner if it is
   * not resident, then notify, in that order, so a re-render reads a catalog already in place.
   */
  async setLocale(locale: string): Promise<void> {
    const resolved = this.resolveLocaleTag(locale);
    if (!resolved) {
      // A locale nobody ships is legitimate: the host may supply messages for it. Honour the
      // tag and let the fallback chain cover what those messages omit.
      this.locale = toLanguageTag(locale) || DEFAULT_LOCALE;
      this.notify();
      return;
    }

    await this.ensureLoaded(resolved);
    this.locale = resolved;
    this.notify();
  }

  t(key: NestedKeys<C> | DynamicMessageKey, values?: InterpolationValues): string {
    const message = this.lookup(key);
    if (message === undefined) {
      this.config.onMissingKey?.(key, this.locale);
      return key;
    }
    return interpolate(message, values, this.locale);
  }

  /** A category the catalog does not carry resolves to `other`. */
  plural(key: NestedKeys<C> | DynamicMessageKey, options: PluralOptions): string {
    const group = this.lookupNode(key);
    if (group === undefined || !isPluralGroup(group)) {
      return this.t(key, options);
    }
    const category = this.selectPluralCategory(options.count);
    const form = group[category] ?? group.other;
    return interpolate(form, options, this.locale);
  }

  getDirection(): TextDirection {
    return localeDirection(this.locale);
  }

  /** Resident catalogs, whatever the loader declares, and any locale with host messages. */
  getAvailableLocales(): string[] {
    const tags = new Set<string>([
      ...this.catalogs.keys(),
      ...(this.config.availableLocales ?? []),
      ...Object.keys(this.customMessages),
    ]);
    return [...tags];
  }

  isLocaleLoaded(locale: string): boolean {
    const resolved = this.resolveLocaleTag(locale);
    return resolved !== undefined && this.catalogs.has(resolved);
  }

  /**
   * Whether `setLocale(locale)` would load anything: false once the shipped catalog is resident,
   * and for a locale nothing ships, which the fallback chain answers synchronously.
   */
  needsLoad(locale: string): boolean {
    const resolved = this.resolveLocaleTag(locale);
    return (
      resolved !== undefined &&
      !this.catalogs.has(resolved) &&
      this.config.availableLocales?.includes(resolved) === true
    );
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  hasKey(key: NestedKeys<C> | DynamicMessageKey): boolean {
    return this.lookup(key) !== undefined;
  }

  /** Deep-merged, so a deployment overrides a single label without restating a catalog. */
  addCustomMessages(locale: string, messages: MessageCatalog): void {
    const tag = toLanguageTag(locale);
    this.customMessages[tag] = deepMerge(this.customMessages[tag] ?? {}, messages);
    this.notify();
  }

  /**
   * A view fixed to another locale. Catalogs, in-flight loads and custom messages are shared by
   * reference, so two elements on one page render different locales from one parsed catalog
   * each.
   */
  withLocale(locale: string): SimpleI18n<C> {
    const resolved = this.resolveLocaleTag(locale) ?? toLanguageTag(locale);
    if (resolved === this.locale) return this;

    const view = new SimpleI18n<C>({ ...this.config, locale: resolved });
    view.locale = resolved || DEFAULT_LOCALE;
    view.catalogs = this.catalogs;
    view.customMessages = this.customMessages;
    view.loading = this.loading;
    return view;
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.locale, options).format(value);
    } catch {
      return new Intl.NumberFormat(DEFAULT_LOCALE, options).format(value);
    }
  }

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.locale, options).format(date);
    } catch {
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(date);
    }
  }

  /** Load a declared locale's catalog once, however many views ask concurrently. */
  private async ensureLoaded(resolved: string): Promise<void> {
    // The loader is asked only for tags it declares; a tag that resolved through host messages
    // alone has nothing to load.
    if (this.catalogs.has(resolved) || !this.config.availableLocales?.includes(resolved)) {
      return;
    }
    const inFlight = this.loading.get(resolved);
    if (inFlight) {
      await inFlight;
      return;
    }
    const load = this.loadCatalog(resolved);
    this.loading.set(resolved, load);
    try {
      await load;
    } finally {
      this.loading.delete(resolved);
    }
  }

  /**
   * Script-aware RFC 4647 lookup first, so `es-MX` reaches an `es` catalog; then primary-subtag
   * widening, so a bare `es` or a POSIX `es_ES` reaches a regional catalog. Widening stays within
   * the request's script: `zh` never reaches `zh-TW`, and `sr-Latn` may reach `sr-ME`.
   */
  private resolveLocaleTag(locale: string | null | undefined): string | undefined {
    if (!locale) return undefined;
    const available = this.getAvailableLocales();
    const exactOrPrefix = findBestLanguageMatch(locale, available);
    if (exactOrPrefix) return exactOrPrefix;

    const requestedLanguage = normalizeLanguageTag(locale).split('-')[0];
    if (!requestedLanguage) return undefined;
    return available.find(
      (candidate) =>
        normalizeLanguageTag(candidate).split('-')[0] === requestedLanguage &&
        languageTagScriptsMatch(locale, candidate)
    );
  }

  private async loadCatalog(locale: string): Promise<void> {
    const load = this.config.loadCatalog;
    if (!load) return;
    try {
      this.catalogs.set(locale, await load(locale));
    } catch (error) {
      // `setLocale` assigns the locale only after the load, so the previous locale stays active.
      throw new Error(`Failed to load i18n catalog for locale: ${locale}`, { cause: error });
    }
  }

  /** Host overrides for the active locale win, then its catalog, then the fallback pair. */
  private lookupNode(key: string): MessageNode | undefined {
    const sources = [
      this.customMessages[this.locale],
      this.catalogs.get(this.locale),
      this.customMessages[this.fallbackLocale],
      this.catalogs.get(this.fallbackLocale),
    ];
    for (const source of sources) {
      const hit = readPath(source, key);
      if (hit !== undefined) return hit;
    }
    return undefined;
  }

  private lookup(key: string): string | undefined {
    const node = this.lookupNode(key);
    if (typeof node === 'string') return node;
    // A plural group resolves to its `other` form; a namespace is a miss.
    if (node !== undefined && isPluralGroup(node)) return node.other;
    return undefined;
  }

  private selectPluralCategory(count: number): keyof PluralTranslation {
    let rules = SimpleI18n.pluralRules.get(this.locale);
    if (!rules) {
      try {
        rules = new Intl.PluralRules(this.locale);
      } catch {
        return count === 1 ? 'one' : 'other';
      }
      SimpleI18n.pluralRules.set(this.locale, rules);
    }
    return rules.select(count) as keyof PluralTranslation;
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }
}

function readPath(source: MessageCatalog | undefined, key: string): MessageNode | undefined {
  if (!source) return undefined;
  let current: MessageNode | undefined = source;
  for (const part of key.split('.')) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string, MessageNode>)[part];
    if (current === undefined) return undefined;
  }
  return current;
}

/**
 * Substitute `{name}` placeholders.
 *
 * A finite numeric value renders through `Intl.NumberFormat` for the active
 * locale, so digits and grouping follow CLDR locale defaults: `ar` renders
 * Arabic-Indic digits, `fr` groups with narrow no-break spaces, `en-US` with
 * commas. Catalog text that spells digits out is untouched.
 */
const numberFormats = new Map<string, Intl.NumberFormat>();

function formatNumber(value: number, locale: string): string {
  let formatter = numberFormats.get(locale);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale);
    } catch {
      formatter = new Intl.NumberFormat(DEFAULT_LOCALE);
    }
    numberFormats.set(locale, formatter);
  }
  return formatter.format(value);
}

function interpolate(text: string, values?: InterpolationValues, locale?: string): string {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = values[name];
    if (value === undefined || value === null) return match;
    if (locale !== undefined && typeof value === 'number' && Number.isFinite(value)) {
      return formatNumber(value, locale);
    }
    return String(value);
  });
}

function deepMerge(target: MessageCatalog, source: MessageCatalog): MessageCatalog {
  const result: MessageCatalog = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key];
    if (value && typeof value === 'object' && existing && typeof existing === 'object') {
      result[key] = deepMerge(existing as MessageCatalog, value as MessageCatalog);
    } else {
      result[key] = value;
    }
  }
  return result;
}
