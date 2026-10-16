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

  it('merges successive registrations in order; a plural group replaces the shipped one', () => {
    const { catalogs } = define('@pie-lib/a');
    registerMessages('@pie-lib/a', 'en-US', { label: 'Reveal' });
    registerMessages('@pie-lib/a', 'en-US', { count: { other: '{count} things' } });
    const translator = catalogs.forLocale();
    expect(translator.t('label')).toBe('Reveal');
    // pie-players semantics: the first source holding the group answers every count, so a
    // host's wording never mixes with the shipped forms.
    expect(translator.plural('count', { count: 1 })).toBe('1 things');
    expect(translator.plural('count', { count: 5 })).toBe('5 things');
  });
});
