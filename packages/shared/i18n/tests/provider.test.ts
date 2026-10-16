import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_LOCALE, dynamicMessageKey, localeDirection, SimpleI18n } from '../src/provider.js';

const en = {
  common: { show: 'Show', greeting: 'Hello, {name}' },
  selections: { one: 'Select {count} answer.', other: 'Select {count} answers.' },
};
const es = {
  common: { show: 'Mostrar' },
  selections: { one: 'Seleccione {count} respuesta.', other: 'Seleccione {count} respuestas.' },
};

const create = (overrides: Partial<ConstructorParameters<typeof SimpleI18n<typeof en>>[0]> = {}) =>
  new SimpleI18n({
    source: en,
    availableLocales: [DEFAULT_LOCALE, 'es-ES'],
    loadCatalog: async () => es,
    ...overrides,
  });

describe('SimpleI18n', () => {
  it('renders en-US with no locale and never reads the browser', () => {
    const i18n = create();
    expect(i18n.getLocale()).toBe('en-US');
    expect(i18n.t('common.show')).toBe('Show');
  });

  it('interpolates and leaves a slot without a value in place', () => {
    const i18n = create();
    expect(i18n.t('common.greeting', { name: 'Ana' })).toBe('Hello, Ana');
    expect(i18n.t('common.greeting')).toBe('Hello, {name}');
  });

  it.each(['es', 'es_ES', 'es-MX', 'ES'])('resolves %j to the es-ES catalog', async (tag) => {
    const i18n = create();
    await i18n.setLocale(tag);
    expect(i18n.getLocale()).toBe('es-ES');
    expect(i18n.t('common.show')).toBe('Mostrar');
  });

  it('falls back to English for a key the locale lacks', async () => {
    const i18n = create();
    await i18n.setLocale('es-ES');
    expect(i18n.t('common.greeting', { name: 'Ana' })).toBe('Hello, Ana');
  });

  it('returns the key and reports a miss', () => {
    const onMissingKey = vi.fn();
    const i18n = create({ onMissingKey });
    expect(i18n.t(dynamicMessageKey('common.nope'))).toBe('common.nope');
    expect(onMissingKey).toHaveBeenCalledWith('common.nope', 'en-US');
  });

  it('selects plural categories through Intl.PluralRules', async () => {
    const i18n = create();
    expect(i18n.plural('selections', { count: 1 })).toBe('Select 1 answer.');
    expect(i18n.plural('selections', { count: 3 })).toBe('Select 3 answers.');
    expect(i18n.t('selections')).toBe('Select {count} answers.');
    await i18n.setLocale('es');
    expect(i18n.plural('selections', { count: 1 })).toBe('Seleccione 1 respuesta.');
  });

  it('honors a locale nothing ships and serves host messages for it', async () => {
    const i18n = create({ customMessages: { 'cy-GB': { common: { show: 'Dangos' } } } });
    await i18n.setLocale('cy_GB');
    expect(i18n.getLocale()).toBe('cy-GB');
    expect(i18n.t('common.show')).toBe('Dangos');
    expect(i18n.t('common.greeting', { name: 'Ana' })).toBe('Hello, Ana');
  });

  it('lets host messages override one shipped key', async () => {
    const i18n = create();
    i18n.addCustomMessages('es_ES', { common: { show: 'Ver' } });
    await i18n.setLocale('es-ES');
    expect(i18n.t('common.show')).toBe('Ver');
    expect(i18n.plural('selections', { count: 2 })).toBe('Seleccione 2 respuestas.');
  });

  it('loads a catalog once for concurrent requests, and only for declared tags', async () => {
    const loadCatalog = vi.fn(async () => es);
    const i18n = create({ loadCatalog });
    expect(i18n.needsLoad('es-MX')).toBe(true);
    expect(i18n.needsLoad('fr')).toBe(false);
    await Promise.all([i18n.setLocale('es'), i18n.withLocale('es-MX').setLocale('es-MX')]);
    expect(loadCatalog).toHaveBeenCalledTimes(1);
    expect(i18n.isLocaleLoaded('es')).toBe(true);
    expect(i18n.needsLoad('es')).toBe(false);
  });

  it('keeps the previous locale and names the locale when a load fails', async () => {
    const i18n = create({ loadCatalog: async () => Promise.reject(new Error('chunk 404')) });
    await expect(i18n.setLocale('es')).rejects.toThrow(
      'Failed to load i18n catalog for locale: es-ES'
    );
    expect(i18n.getLocale()).toBe('en-US');
  });

  it('shares catalogs with views but notifies only its own subscribers', async () => {
    const i18n = create();
    const view = i18n.withLocale('es-ES');
    const rootListener = vi.fn();
    const viewListener = vi.fn();
    i18n.subscribe(rootListener);
    view.subscribe(viewListener);
    await view.setLocale('es-ES');
    expect(view.t('common.show')).toBe('Mostrar');
    expect(i18n.t('common.show')).toBe('Show');
    expect(viewListener).toHaveBeenCalledTimes(1);
    expect(rootListener).not.toHaveBeenCalled();
  });
});

describe('localeDirection', () => {
  it.each([
    ['ar', 'rtl'],
    ['he-IL', 'rtl'],
    ['ur_PK', 'rtl'],
    ['en-US', 'ltr'],
    ['es', 'ltr'],
  ])('%s is %s', (tag, direction) => {
    expect(localeDirection(tag)).toBe(direction);
  });
});
