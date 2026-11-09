import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineCatalogs, isLocaleReady, loadLocale, registerMessages } from '../src/catalogs.js';

const REGISTRY_KEY = Symbol.for('pie-element.i18n.registry');

const en = { label: 'Show', count: { one: '{count} item', other: '{count} items' } };
const es = { label: 'Mostrar', count: { one: '{count} elemento', other: '{count} elementos' } };

const define = (packageName: string, load = vi.fn(async () => ({ default: es }))) => ({
  load,
  catalogs: defineCatalogs({ packageName, source: en, loaders: { 'es-ES': load } }),
});

afterEach(() => {
  delete (globalThis as Record<symbol, unknown>)[REGISTRY_KEY];
  vi.restoreAllMocks();
});

describe('defineCatalogs', () => {
  it('renders English synchronously with nothing to load', () => {
    const { catalogs, load } = define('@pie-lib/a');
    expect(catalogs.locales).toEqual(['en-US', 'es-ES']);
    expect(catalogs.forLocale().t('label')).toBe('Show');
    expect(catalogs.forLocale('en').t('label')).toBe('Show');
    expect(isLocaleReady(undefined)).toBe(true);
    expect(isLocaleReady('en-US')).toBe(true);
    expect(load).not.toHaveBeenCalled();
  });

  it('loads a shipped locale for every catalog set on the page', async () => {
    const a = define('@pie-lib/a');
    const b = define('@pie-element/b');
    expect(isLocaleReady('es-MX')).toBe(false);
    await loadLocale('es-MX');
    expect(isLocaleReady('es-MX')).toBe(true);
    expect(a.catalogs.forLocale('es-MX').t('label')).toBe('Mostrar');
    expect(b.catalogs.forLocale('es').plural('count', { count: 1 })).toBe('1 elemento');
    expect(a.load).toHaveBeenCalledTimes(1);
    expect(b.load).toHaveBeenCalledTimes(1);
  });

  it('treats a locale nothing ships as ready and renders English', () => {
    const { catalogs } = define('@pie-lib/a');
    expect(isLocaleReady('fr-CA')).toBe(true);
    expect(catalogs.forLocale('fr-CA').t('label')).toBe('Show');
  });

  it('reports a failed load once, renders English and does not retry', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failing = vi.fn(async () => Promise.reject(new Error('chunk 404')));
    const { catalogs } = define('@pie-lib/a', failing);
    await expect(loadLocale('es-ES')).resolves.toBeUndefined();
    await loadLocale('es-ES');
    expect(failing).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(isLocaleReady('es-ES')).toBe(true);
    expect(catalogs.forLocale('es-ES').t('label')).toBe('Show');
  });

  it('loads on behalf of a component that renders before anyone called loadLocale', async () => {
    const { catalogs, load } = define('@pie-lib/a');
    const onLoad = vi.fn();
    expect(catalogs.forLocale('es-ES', onLoad).t('label')).toBe('Show');
    catalogs.forLocale('es-ES', onLoad);
    await vi.waitFor(() => expect(onLoad).toHaveBeenCalledTimes(2));
    expect(load).toHaveBeenCalledTimes(1);
    expect(catalogs.forLocale('es-ES', onLoad).t('label')).toBe('Mostrar');
    await Promise.resolve();
    expect(onLoad).toHaveBeenCalledTimes(2);
  });

  it('never calls onLoad for a locale already resident or not shipped', async () => {
    const { catalogs } = define('@pie-lib/a');
    const onLoad = vi.fn();
    catalogs.forLocale(undefined, onLoad);
    catalogs.forLocale('en-GB', onLoad);
    catalogs.forLocale('fr-CA', onLoad);
    await Promise.resolve();
    expect(onLoad).not.toHaveBeenCalled();
  });
});

describe('registerMessages', () => {
  it('overrides one key for one package, including copies defined later', async () => {
    const before = define('@pie-lib/a');
    registerMessages('@pie-lib/a', 'es_ES', { label: 'Ver' });
    const after = define('@pie-lib/a');
    const other = define('@pie-lib/other');
    await loadLocale('es-ES');
    expect(before.catalogs.forLocale('es-ES').t('label')).toBe('Ver');
    expect(after.catalogs.forLocale('es-ES').t('label')).toBe('Ver');
    expect(other.catalogs.forLocale('es-ES').t('label')).toBe('Mostrar');
  });

  it('serves a locale nothing ships, falling back to English per key', () => {
    const { catalogs } = define('@pie-lib/a');
    const before = catalogs.forLocale('cy-GB');
    expect(before.t('label')).toBe('Show');
    registerMessages('@pie-lib/a', 'cy-GB', { label: 'Dangos' });
    const translator = catalogs.forLocale('cy_GB');
    expect(translator.t('label')).toBe('Dangos');
    expect(translator.plural('count', { count: 2 })).toBe('2 items');
  });

  it('merges successive registrations in order; a plural override resolves per category', () => {
    const { catalogs } = define('@pie-lib/a');
    registerMessages('@pie-lib/a', 'en-US', { label: 'Reveal' });
    registerMessages('@pie-lib/a', 'en-US', { count: { other: '{count} things' } });
    const translator = catalogs.forLocale();
    expect(translator.t('label')).toBe('Reveal');
    // The host overrode `other` only, so `one` still comes from the shipped group.
    expect(translator.plural('count', { count: 1 })).toBe('1 item');
    expect(translator.plural('count', { count: 5 })).toBe('5 things');
    expect(translator.t('count')).toBe('{count} things');
  });

  it('never throws on a plural override that lacks the selected category', () => {
    const { catalogs } = define('@pie-lib/a');
    registerMessages('@pie-lib/a', 'en-US', { count: { one: 'Just {count} item' } });
    const translator = catalogs.forLocale();
    expect(translator.plural('count', { count: 1 })).toBe('Just 1 item');
    expect(translator.plural('count', { count: 2 })).toBe('2 items');
    expect(translator.t('count')).toBe('{count} items');
  });

  it('layers a regional host override over the shipped parent catalog and loads it', async () => {
    const { catalogs, load } = define('@pie-lib/a');
    registerMessages('@pie-lib/a', 'es-MX', { label: 'Ver' });
    expect(isLocaleReady('es-MX')).toBe(false);
    await loadLocale('es-MX');
    expect(load).toHaveBeenCalledTimes(1);
    const translator = catalogs.forLocale('es-MX');
    expect(translator.t('label')).toBe('Ver');
    expect(translator.plural('count', { count: 2 })).toBe('2 elementos');
    expect(translator.getLocale()).toBe('es-ES');
  });

  it('matches host messages to the request whatever the tag casing', async () => {
    const { catalogs } = define('@pie-lib/a');
    registerMessages('@pie-lib/a', 'ES', { label: 'Ver' });
    await loadLocale('es');
    expect(catalogs.forLocale('es').t('label')).toBe('Ver');
    expect(catalogs.forLocale('es').plural('count', { count: 2 })).toBe('2 elementos');
    expect(catalogs.forLocale('es-MX').t('label')).toBe('Ver');
  });

  it('names the served locale: English for a locale nothing serves, the host tag for host messages', () => {
    const { catalogs } = define('@pie-lib/a');
    const he = catalogs.forLocale('he');
    expect(he.getLocale()).toBe('en-US');
    expect(he.getDirection()).toBe('ltr');
    registerMessages('@pie-lib/a', 'HE', { label: 'הצג' });
    expect(he.getLocale()).toBe('he');
    expect(he.getDirection()).toBe('rtl');
  });

  it('names English for a shipped locale whose catalog failed', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { catalogs } = define(
      '@pie-lib/a',
      vi.fn(async () => Promise.reject(new Error('404')))
    );
    await loadLocale('es-ES');
    expect(catalogs.forLocale('es-ES').getLocale()).toBe('en-US');
  });
});

describe('locale arguments', () => {
  it('treats a value that is not a string as no locale', async () => {
    const { catalogs, load } = define('@pie-lib/a');
    const notATag = ['es-ES'] as unknown as string;
    expect(isLocaleReady(notATag)).toBe(true);
    await expect(loadLocale(notATag)).resolves.toBeUndefined();
    expect(catalogs.forLocale(notATag, vi.fn()).t('label')).toBe('Show');
    expect(load).not.toHaveBeenCalled();
  });
});
