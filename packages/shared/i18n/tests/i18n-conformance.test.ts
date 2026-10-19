import { describe, expect, it } from 'vitest';
import fixturesJson from './i18n-conformance-fixtures.json';
import { defineCatalogs, loadLocale, registerMessages } from '../src/catalogs.js';
import { languageTagLookupSequence } from '../src/language-tags.js';
import { localeDirection } from '../src/provider.js';
import type { MessageCatalog } from '../src/types.js';

/**
 * Conformance of this engine to the cross-repository spec.
 *
 * `i18n-conformance-fixtures.json` is the semantics the two PIE engines share:
 * this one and pie-players' `players-shared/src/i18n`, which this engine ports
 * without sharing code. Each repository runs the same file against its own
 * engine, so a case one engine passes and the other fails is drift made
 * visible. The copies are kept byte-identical; the fixture's `$comment` names
 * both paths.
 */

interface Fixtures {
  lookupSequence: { tag: string; expected: string[] }[];
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
  const packageName = `conformance-${packageCounter++}`;
  const loaders = Object.fromEntries(
    Object.entries(shipped)
      .filter(([tag]) => tag !== 'en-US')
      .map(([tag, catalog]) => [tag, async () => ({ default: catalog })])
  );
  const catalogs = defineCatalogs({ packageName, source, loaders });
  if (hostMessages) registerMessages(packageName, locale, hostMessages);
  await loadLocale(locale);
  return catalogs.forLocale(locale);
}

describe('i18n conformance', () => {
  it('lookup sequence', () => {
    for (const { tag, expected } of fixtures.lookupSequence) {
      expect(languageTagLookupSequence(tag), tag).toEqual(expected);
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
});
