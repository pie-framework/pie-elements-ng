import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext, loadLocale } from '@pie-element/shared-i18n';
import type { PieEnvironment } from '@pie-element/shared-types';

import ImageClozeAssociation from '../index';
import { model as buildModel } from '../../controller/index';
import { catalogs } from '../../i18n/index.js';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-ica-locale', ImageClozeAssociation as unknown as CustomElementConstructor);

/** A stand-in player: answers the element's interface-locale subscription, and republishes on `publish`. */
function mountPlayer(locale?: string) {
  const player = document.createElement('div');
  const callbacks: ((value: unknown) => void)[] = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context !== interfaceLocaleContext || !request.callback || !locale) return;
    callbacks.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  const publish = (next: string) => {
    for (const callback of callbacks) callback({ locale: next, direction: 'ltr' });
  };
  return { player, publish };
}

// Picture choices carry no text of their own, so the choices take their position name.
const SUN = '<img src="sun.png">';
const MOON = '<img src="moon.png">';

const question = (extra: object = {}) => ({
  id: '1',
  element: 'image-cloze-association',
  image: { src: 'sky.png', width: 400, height: 200 },
  possible_responses: [SUN, MOON],
  response_containers: [
    { x: 0, y: 0, width: '20%', height: '20%' },
    { x: 50, y: 0, width: '20%', height: '20%' },
  ],
  validation: {
    scoring_type: 'exactMatch',
    valid_response: { score: 1, value: [{ images: [SUN] }, { images: [MOON] }] },
  },
  ...extra,
});

const mount = async (extra: object = {}, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-ica-locale') as Host;
  player.appendChild(el);
  el.model = await buildModel(question(extra), { answers: [] }, { mode: 'gather' } as PieEnvironment, vi.fn());
  el.session = { answers: [] };
  return { el, publish };
};

const imageName = (el: HTMLElement) => el.querySelector('img[src="sky.png"]')?.getAttribute('alt');
const names = (el: HTMLElement) =>
  [...el.querySelectorAll('[aria-label]')].map((node) => node.getAttribute('aria-label'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('image-cloze-association interface locale', () => {
  it('names its image, areas and choices in the player locale', async () => {
    const { el } = await mount({}, 'es');
    await vi.waitFor(() => expect(imageName(el)).toBe('Imagen con 2 áreas de respuesta'));
    expect(names(el)).toContain('Área de respuesta 1 de 2');
    expect(names(el)).toContain('Opción de respuesta 1 de 2');
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = await mount({}, 'es');
    await vi.waitFor(() => expect(imageName(el)).toBe('Imagen con 2 áreas de respuesta'));
    publish('nl-NL');
    await vi.waitFor(() => expect(imageName(el)).toBe('Afbeelding met 2 antwoordvakken'));
    expect(names(el)).toContain('Antwoordvak 1 van 2');
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = await mount({}, 'es');
    await vi.waitFor(() => expect(imageName(el)).toBe('Imagen con 2 áreas de respuesta'));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = await mount({ language: 'es_ES' });
    await vi.waitFor(() => expect(imageName(el)).toBe('Imagen con 2 áreas de respuesta'));
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders English when neither declares a locale', async () => {
    const { el } = await mount();
    await vi.waitFor(() => expect(imageName(el)).toBe('Image with 2 response areas'));
    expect(names(el)).toContain('Answer choice 1 of 2');
  });
});

describe('image-cloze-association limit warning', () => {
  // The warning shows for a limit above one, where it has always read as a one-word notice.
  it('selects its form by the limit', async () => {
    await loadLocale('es');
    expect(catalogs.forLocale('en-US').plural('reachedLimit', { count: 2 })).toBe('Full');
    expect(catalogs.forLocale('es').plural('reachedLimit', { count: 3 })).toBe('Lleno');
    expect(catalogs.forLocale('es').plural('reachedLimit', { count: 1 })).toContain('Has alcanzado el límite de 1 respuesta');
  });
});
