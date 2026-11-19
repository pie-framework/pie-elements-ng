/**
 * The chrome's language, composed region names included: the locale a player
 * publishes, else the item's declared `language`, else `en-US`. The host's
 * `lang` is the item's content language and stays unset for an item that
 * declares none.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: vi.fn() }));

import { interfaceLocaleContext } from '@pie-element/shared-i18n';
import VennClassificationElement from '../src/delivery/index.js';
import { model as controllerModel } from '../src/controller/index.js';
import type { VennClassificationModel } from '../src/types.js';

const TAG = 'venn-classification--version-0-0-0-interface-locale-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, VennClassificationElement as unknown as CustomElementConstructor);
}

const QUESTION: VennClassificationModel = {
  id: '1',
  element: TAG,
  prompt: '<p>Sort each animal.</p>',
  circles: [{ label: 'Reptile' }, { label: 'Egg-layer' }],
  tiles: [{ id: 'frog', label: 'Frog', correctRegion: [1] }],
};
const EVALUATE = { mode: 'evaluate', role: 'student' };

type Publish = (locale: string) => void;

/** A stand-in player answering the element's interface-locale subscription; `publish` changes it. */
function mountPlayer(locale: string): { player: HTMLElement; publish: Publish } {
  const player = document.createElement('div');
  const subscribers: Array<(value: unknown) => void> = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context !== interfaceLocaleContext || !request.callback) return;
    event.stopPropagation();
    subscribers.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  const publish: Publish = (next) => {
    for (const callback of subscribers) callback({ locale: next, direction: 'ltr' });
  };
  return { player, publish };
}

async function render(question: VennClassificationModel, parent: HTMLElement = document.body) {
  const element = document.createElement(TAG) as HTMLElement & { model: unknown; session: unknown };
  parent.appendChild(element);
  const session = { id: '1', element: TAG };
  element.session = session;
  element.model = await controllerModel(question, session, EVALUATE);
  return element;
}

const toggleLabel = (element: HTMLElement) =>
  element.querySelector('.toggle-label')?.textContent?.trim();
const tileName = (element: HTMLElement) =>
  element.querySelector('.venn-tray [aria-label]')?.getAttribute('aria-label');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('venn-classification interface locale', () => {
  it('renders the chrome in the player locale, with no English frame first', async () => {
    const { player } = mountPlayer('es');
    const element = await render(QUESTION, player);
    flushSync();
    expect(element.textContent).not.toContain('Show correct answer');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar respuesta correcta'));
    expect(tileName(element)).toBe('Frog, sin colocar');
    expect(element.querySelector('.toggle-correct')?.getAttribute('lang')).toBe('es');
  });

  it('follows a locale the player changes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const element = await render(QUESTION, player);
    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Show correct answer'));

    publish('nl-NL');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Juist antwoord weergeven'));
    expect(tileName(element)).toBe('Frog, niet geplaatst');
  });

  it('stamps no lang for an item that declares no language', async () => {
    const { player } = mountPlayer('es');
    const element = await render(QUESTION, player);
    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar respuesta correcta'));

    expect(element.hasAttribute('lang')).toBe(false);
    expect(element.hasAttribute('dir')).toBe(false);
  });

  it('renders Spanish chrome for an item declaring Spanish with no player', async () => {
    const element = await render({ ...QUESTION, language: 'es_ES' });

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar respuesta correcta'));
    expect(element.getAttribute('lang')).toBe('es-ES');
  });

  it('names the regions in the chrome language, from the authored circle labels', async () => {
    const { player } = mountPlayer('fr');
    const element = await render({ ...QUESTION, language: 'en-US' }, player);

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Afficher la réponse correcte'));
    const regionNames = [...element.querySelectorAll('[data-region-key]')].map((node) =>
      node.getAttribute('aria-label')
    );
    expect(regionNames).toContain('Uniquement Reptile');
    expect(element.getAttribute('lang')).toBe('en-US');
  });
});
