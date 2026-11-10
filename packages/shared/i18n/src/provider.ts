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
  canonicalLanguageTag,
  findClosestLanguageMatch,
  languageTagLookupSequence,
  normalizeLanguageTag,
  toLanguageTag,
} from '@pie-players/pie-language-tags';
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

/** A request's tag in BCP-47 syntax; anything that is not a non-blank string is no request. */
function requestedTag(locale: unknown): string {
  return (typeof locale === 'string' && toLanguageTag(locale)) || DEFAULT_LOCALE;
}

/**
 * Catalogs are BCP-47 keyed and resolved through RFC 4647 lookup, and plural categories come
 * from `Intl.PluralRules`. Never writes `lang` or `dir` anywhere: stamping is the component's
 * job, on its own host.
 *
 * A request resolves twice. The catalog locale is resolved against shipped catalogs only, the
 * loader's declared tags and what is resident, so it alone decides what loads. Host messages are
 * keyed by normalized tag and found along the request's own truncation chain. A lookup reads host
 * messages for that chain, the catalog locale's catalog, then the fallback locale's pair: a host
 * override for `es-MX` layers over a shipped `es` instead of hiding it.
 */
export class SimpleI18n<C extends MessageCatalog = MessageCatalog>
  implements I18nServiceApi<NestedKeys<C>>
{
  /** Shared across instances and views: `Intl.PluralRules` is not cheap. */
  private static readonly pluralRules = new Map<string, Intl.PluralRules>();

  /** The requested tag, in BCP-47 syntax. */
  private requested: string;
  /** The shipped catalog serving the request, resident or not; `undefined` when none does. */
  private catalogLocale: string | undefined;
  private readonly fallbackLocale: string;
  /** Shared by reference with every `withLocale` view. */
  private catalogs: Map<string, MessageCatalog>;
  /** Keyed by normalized tag, so `ES`, `es_ES` and `es-es` reach one set. */
  private customMessages: Record<string, MessageCatalog>;
  private loading: Map<string, Promise<void>>;
  /** Counts `setLocale` calls, so a slow load cannot overwrite a later request. */
  private requests = 0;
  private readonly listeners = new Set<() => void>();
  private readonly config: I18nConfig<C>;

  constructor(config: I18nConfig<C>) {
    this.config = { ...config };
    this.fallbackLocale = toLanguageTag(config.fallbackLocale) || DEFAULT_LOCALE;
    this.catalogs = new Map([[DEFAULT_LOCALE, config.source as MessageCatalog]]);
    this.customMessages = {};
    for (const [locale, messages] of Object.entries(config.customMessages ?? {})) {
      this.mergeCustomMessages(locale, messages);
    }
    this.loading = new Map();
    this.requested = requestedTag(config.locale);
    this.catalogLocale = this.resolveCatalogLocale(this.requested);
  }

  /**
   * The locale the strings are served in: the catalog locale once resident, else the host-message
   * locale when host messages cover the request, else the fallback. A request nothing serves
   * reports the fallback, so a chrome root stamped from it never names a language its text is
   * not in.
   */
  getLocale(): string {
    if (this.catalogLocale !== undefined && this.catalogs.has(this.catalogLocale)) {
      return this.catalogLocale;
    }
    const host = this.hostMessageLocale(this.requested);
    return host === undefined ? this.fallbackLocale : (canonicalLanguageTag(host) ?? host);
  }

  /**
   * Resolve the request against the shipped catalogs, load the winner if it is not resident,
   * then notify, in that order, so a re-render reads a catalog already in place. The last call
   * wins: a call whose load finishes after a later call's leaves the locale to that later call.
   */
  async setLocale(locale: string): Promise<void> {
    const request = ++this.requests;
    const requested = requestedTag(locale);
    const catalogLocale = this.resolveCatalogLocale(requested);
    if (catalogLocale !== undefined) await this.ensureLoaded(catalogLocale);
    if (request !== this.requests) return;
    this.requested = requested;
    this.catalogLocale = catalogLocale;
    this.notify();
  }

  t(key: NestedKeys<C> | DynamicMessageKey, values?: InterpolationValues): string {
    const message = this.resolveMessage(key);
    if (message === undefined) {
      this.config.onMissingKey?.(key, this.getLocale());
      return key;
    }
    return interpolate(message, values, this.getLocale());
  }

  /**
   * Each category resolves through the sources in lookup order: the first that carries the
   * selected category, then the first that carries `other`. A host override of one category
   * leaves the others to the catalog.
   */
  plural(key: NestedKeys<C> | DynamicMessageKey, options: PluralOptions): string {
    const message = this.resolveMessage(key, this.selectPluralCategory(options.count));
    if (message === undefined) {
      this.config.onMissingKey?.(key, this.getLocale());
      return key;
    }
    return interpolate(message, options, this.getLocale());
  }

  getDirection(): TextDirection {
    return localeDirection(this.getLocale());
  }

  /** Resident catalogs, whatever the loader declares, and any locale with host messages. */
  getAvailableLocales(): string[] {
    const tags = new Set<string>([
      ...this.shippedLocales(),
      ...Object.keys(this.customMessages).map((tag) => canonicalLanguageTag(tag) ?? tag),
    ]);
    return [...tags];
  }

  isLocaleLoaded(locale: string): boolean {
    const resolved = this.resolveCatalogLocale(requestedTag(locale));
    return resolved !== undefined && this.catalogs.has(resolved);
  }

  /**
   * Whether `setLocale(locale)` would load anything: false once the shipped catalog serving it is
   * resident, and for a locale nothing ships, which the fallback chain answers synchronously.
   */
  needsLoad(locale: string): boolean {
    const resolved = this.resolveCatalogLocale(requestedTag(locale));
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
    return this.resolveMessage(key) !== undefined;
  }

  /** Deep-merged, so a deployment overrides a single label without restating a catalog. */
  addCustomMessages(locale: string, messages: MessageCatalog): void {
    this.mergeCustomMessages(locale, messages);
    this.notify();
  }

  /**
   * A view fixed to another locale. Catalogs, in-flight loads and custom messages are shared by
   * reference, so two elements on one page render different locales from one parsed catalog
   * each.
   */
  withLocale(locale: string): SimpleI18n<C> {
    const requested = requestedTag(locale);
    if (normalizeLanguageTag(requested) === normalizeLanguageTag(this.requested)) return this;

    const view = new SimpleI18n<C>({
      ...this.config,
      customMessages: undefined,
      locale: requested,
    });
    view.catalogs = this.catalogs;
    view.customMessages = this.customMessages;
    view.loading = this.loading;
    view.catalogLocale = view.resolveCatalogLocale(requested);
    return view;
  }

  formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
    try {
      return new Intl.NumberFormat(this.getLocale(), options).format(value);
    } catch {
      return new Intl.NumberFormat(DEFAULT_LOCALE, options).format(value);
    }
  }

  formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
    try {
      return new Intl.DateTimeFormat(this.getLocale(), options).format(date);
    } catch {
      return new Intl.DateTimeFormat(DEFAULT_LOCALE, options).format(date);
    }
  }

  /** Load a declared locale's catalog once, however many views ask concurrently. */
  private async ensureLoaded(resolved: string): Promise<void> {
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

  /** Tags a catalog ships for: what is resident and what the loader declares. */
  private shippedLocales(): string[] {
    return [...new Set([...this.catalogs.keys(), ...(this.config.availableLocales ?? [])])];
  }

  /**
   * Script-aware RFC 4647 lookup over the shipped catalogs first, so `es-MX` reaches an `es`
   * catalog; then widening to a sibling with the same script and variant subtags, so a bare `es`
   * or a POSIX `es_ES` reaches a regional catalog. `zh` never reaches `zh-TW`, `sr-Latn` may
   * reach `sr-ME`, and `de-CH-1996` reaches no `de-DE`.
   */
  private resolveCatalogLocale(locale: string): string | undefined {
    return findClosestLanguageMatch(locale, this.shippedLocales());
  }

  /** The most specific host-message tag on the request's truncation chain, normalized. */
  private hostMessageLocale(locale: string): string | undefined {
    return languageTagLookupSequence(locale).find((tag) => this.customMessages[tag] !== undefined);
  }

  private mergeCustomMessages(locale: string, messages: MessageCatalog): void {
    const tag = normalizeLanguageTag(locale);
    if (!tag) return;
    this.customMessages[tag] = deepMerge(this.customMessages[tag] ?? {}, messages);
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

  /**
   * Two tiers in lookup order: host messages along the request's truncation chain and the catalog
   * locale's catalog, then host messages and the catalog for the fallback locale.
   */
  private sourceTiers(): (MessageCatalog | undefined)[][] {
    return [
      [
        ...languageTagLookupSequence(this.requested).map((tag) => this.customMessages[tag]),
        this.catalogLocale === undefined ? undefined : this.catalogs.get(this.catalogLocale),
      ],
      [
        this.customMessages[normalizeLanguageTag(this.fallbackLocale)],
        this.catalogs.get(this.fallbackLocale),
      ],
    ];
  }

  /**
   * The text for `key`. The first source that has it decides its shape: a string is the text, and
   * a plural group resolves `category`, else `other`, within the first tier that has a group, so a
   * locale's own `other` wins over the fallback's `one`. Namespaces are skipped.
   */
  private resolveMessage(key: string, category?: keyof PluralTranslation): string | undefined {
    const tiers: PluralTranslation[][] = [];
    for (const tier of this.sourceTiers()) {
      const groups: PluralTranslation[] = [];
      for (const source of tier) {
        const node = readPath(source, key);
        if (typeof node === 'string') {
          if (tiers.every((t) => t.length === 0) && groups.length === 0) return node;
        } else if (node !== undefined && isPluralGroup(node)) {
          groups.push(node);
        }
      }
      tiers.push(groups);
    }
    for (const groups of tiers) {
      const form = (name: keyof PluralTranslation) =>
        groups.find((group) => typeof group[name] === 'string')?.[name];
      const text = (category === undefined ? undefined : form(category)) ?? form('other');
      if (text !== undefined) return text;
    }
    return undefined;
  }

  private selectPluralCategory(count: number): keyof PluralTranslation {
    const locale = this.getLocale();
    let rules = SimpleI18n.pluralRules.get(locale);
    if (!rules) {
      try {
        rules = new Intl.PluralRules(locale);
      } catch {
        return count === 1 ? 'one' : 'other';
      }
      SimpleI18n.pluralRules.set(locale, rules);
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
