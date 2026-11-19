import { describe, expect, it } from 'vitest';
import fixturesJson from '@pie-players/pie-language-tags/i18n-conformance-fixtures.json';
import { languageTagLookupSequence } from '@pie-players/pie-language-tags';
import { defineCatalogs, loadLocale, registerMessages } from '../src/catalogs.js';
import { localeDirection, SimpleI18n } from '../src/provider.js';
import type { MessageCatalog } from '../src/types.js';

/**
 * Conformance of this engine to the cross-repository spec.
 *
 * `@pie-players/pie-language-tags/i18n-conformance-fixtures.json` is the semantics
 * the two PIE engines share: this one and pie-players' `players-shared/src/i18n`.
 * Both import their language-tag code from that package and keep their own
 * providers, and both run this one file against their own engine, so a case one
 * engine passes and the other fails is drift made visible.
 */

interface Fixtures {
  lookupSequence: { tag: string; expected: string[] }[];
  catalogMatch: { locale: string; available: string[]; expected: string }[];
  direction: { tag: string; expected: 'ltr' | 'rtl' }[];
  plural: {
    catalogs: Record<string, MessageCatalog>;
    cases: { locale: string; count: number; expected: string }[];
  };
  interpolation: {
    locale: string;
    template: string;
    values: Record<string, unknown>;
    expected: string;
  }[];
  fallbackChain: {
    locale: string;
    source: MessageCatalog;
    shipped: MessageCatalog;
    hostMessages: MessageCatalog;
    expected: Record<string, string>;
  };
  scenarios: {
    name: string;
    locale: string;
    source: MessageCatalog;
    shipped: Record<string, MessageCatalog>;
    hostMessages: Record<string, MessageCatalog>;
    expected: {
      locale: string;
      direction: 'ltr' | 'rtl';
      t: Record<string, string>;
      plural: { key: string; count: number; expected: string }[];
    };
  }[];
}

const fixtures = fixturesJson as unknown as Fixtures;

let packageCounter = 0;

/**
 * Catalogs for one scenario under a fresh package name: the registry is
 * page-wide, so host messages registered for one case must not reach another.
 * `source` is the engine's `en-US`; every other locale enters through a loader,
 * as a shipped catalog would.
 */
async function catalogsFor(
  locale: string,
  source: MessageCatalog,
  shipped: Record<string, MessageCatalog>,
  hostMessages?: MessageCatalog
) {
  return scenarioCatalogs(locale, source, shipped, hostMessages ? { [locale]: hostMessages } : {});
}

/** As `catalogsFor`, with host messages registered under each tag exactly as the fixture writes it. */
async function scenarioCatalogs(
  locale: string,
  source: MessageCatalog,
  shipped: Record<string, MessageCatalog>,
  hostMessages: Record<string, MessageCatalog>
) {
  const packageName = `conformance-${packageCounter++}`;
  const loaders = Object.fromEntries(
    Object.entries(shipped)
      .filter(([tag]) => tag !== 'en-US')
      .map(([tag, catalog]) => [tag, async () => ({ default: catalog })])
  );
  const catalogs = defineCatalogs({ packageName, source, loaders });
  for (const [tag, messages] of Object.entries(hostMessages)) {
    registerMessages(packageName, tag, messages);
  }
  await loadLocale(locale);
  return catalogs.forLocale(locale);
}

describe('i18n conformance', () => {
  it('lookup sequence', () => {
    for (const { tag, expected } of fixtures.lookupSequence) {
      expect(languageTagLookupSequence(tag), tag).toEqual(expected);
    }
  });

  it('catalog match: script-aware lookup, then widening within the script', async () => {
    for (const { locale, available, expected } of fixtures.catalogMatch) {
      // Loaded, because a view names a catalog locale only once its catalog is resident.
      const i18n = new SimpleI18n({
        source: {},
        availableLocales: available,
        loadCatalog: async () => ({}),
      });
      await i18n.setLocale(locale);
      expect(i18n.getLocale(), `${locale} in ${available.join(', ')}`).toBe(expected);
    }
  });

  it('direction', () => {
    for (const { tag, expected } of fixtures.direction) {
      expect(localeDirection(tag), tag).toBe(expected);
    }
  });

  it('plural category routing and locale numerals', async () => {
    const { catalogs, cases } = fixtures.plural;
    for (const { locale, count, expected } of cases) {
      const t = await catalogsFor(locale, catalogs['en-US'], catalogs);
      expect(t.plural('items', { count }), `${locale} ${count}`).toBe(expected);
    }
  });

  it('interpolation', async () => {
    for (const { locale, template, values, expected } of fixtures.interpolation) {
      const catalog = { tpl: template };
      const t = await catalogsFor(locale, catalog, { [locale]: catalog });
      expect(t.t('tpl', values as Record<string, string | number>), template).toBe(expected);
    }
  });

  it('fallback chain: host locale, shipped locale, English, then the key', async () => {
    const { locale, source, shipped, hostMessages, expected } = fixtures.fallbackChain;
    const t = await catalogsFor(locale, source, { [locale]: shipped }, hostMessages);
    for (const [key, value] of Object.entries(expected)) {
      expect(t.t(key as never), key).toBe(value);
    }
  });

  it.each(fixtures.scenarios.map((scenario) => [scenario.name, scenario] as const))(
    'scenario: %s',
    async (_name, { locale, source, shipped, hostMessages, expected }) => {
      const t = await scenarioCatalogs(locale, source, shipped, hostMessages);
      expect(t.getLocale(), 'locale').toBe(expected.locale);
      expect(t.getDirection(), 'direction').toBe(expected.direction);
      for (const [key, value] of Object.entries(expected.t)) {
        expect(t.t(key as never), key).toBe(value);
      }
      for (const { key, count, expected: text } of expected.plural) {
        expect(t.plural(key as never, { count }), `${key} ${count}`).toBe(text);
      }
    }
  );
});
