/**
 * The chrome's language: the locale a player publishes, else the item's
 * declared language, else `en-US`. The host's `lang` is the item's content
 * language and stays unset for an item that declares none.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: vi.fn() }));

import SimpleClozeElement from '../src/delivery/index.js';
import { model as buildViewModel } from '../src/controller/index.js';

const TAG = 'simple-cloze--version-0-0-0-interface-locale-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, SimpleClozeElement as CustomElementConstructor);
}

const QUESTION = { id: '1', element: TAG, prompt: '<p>2 + 2?</p>', correctAnswer: '4' };
const SESSION = { id: '1', element: TAG, value: '5' };

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

async function render(question: Record<string, unknown>, parent: HTMLElement = document.body) {
  const element = document.createElement(TAG) as HTMLElement & { model: unknown; session: unknown };
  parent.appendChild(element);
  element.model = await buildViewModel(question, SESSION, { mode: 'evaluate' });
  element.session = SESSION;
  return element;
}

const toggleLabel = (element: HTMLElement) =>
  element.querySelector('.simple-cloze-toggle-label')?.textContent?.trim();

afterEach(() => {
  document.body.innerHTML = '';
});

describe('simple-cloze interface locale', () => {
  it('renders the chrome in the player locale, with no English frame first', async () => {
    const { player } = mountPlayer('es');
    const element = await render(QUESTION, player);
    flushSync();
    expect(element.textContent).not.toContain('Show correct answer');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar respuesta correcta'));
    const input = element.querySelector('input') as HTMLInputElement;
    expect(input.placeholder).toBe('Escribe tu respuesta...');
    expect(element.querySelector('.simple-cloze-toggle')?.getAttribute('lang')).toBe('es');
  });

  it('follows a locale the player changes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const element = await render(QUESTION, player);
    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Show correct answer'));

    publish('nl-NL');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Juist antwoord weergeven'));
  });

  it('names English on the chrome for a player locale nothing ships', async () => {
    const { player } = mountPlayer('he');
    const element = await render(QUESTION, player);

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Show correct answer'));
    const toggle = element.querySelector('.simple-cloze-toggle');
    expect(toggle?.getAttribute('lang')).toBe('en-US');
    expect(toggle?.getAttribute('dir')).toBe('ltr');
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

  it('renders English for an item declaring no language with no player', async () => {
    const element = await render(QUESTION);

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Show correct answer'));
    expect(element.hasAttribute('lang')).toBe(false);
  });
});
