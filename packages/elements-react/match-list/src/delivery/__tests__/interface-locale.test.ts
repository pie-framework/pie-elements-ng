import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import MatchList from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-match-list-interface-locale', MatchList as unknown as CustomElementConstructor);

const SPANISH = 'Presiona Espacio o Intro para tomar esta opción de respuesta.';
const ENGLISH = 'Press Space or Enter to pick up this answer choice.';

/** A stand-in player: answers the interface-locale subscription and can publish a new locale later. */
function mountPlayer(locale: string) {
  const player = document.createElement('div');
  const callbacks: Array<(value: unknown) => void> = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void; subscribe?: boolean };
    if (request.context !== interfaceLocaleContext || !request.callback) return;
    callbacks.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  return { player, publish: (next: string) => callbacks.forEach((cb) => cb({ locale: next, direction: 'ltr' })) };
}

const model = (language?: string) => ({
  mode: 'gather',
  config: {
    prompt: '<p>Match each event to its year.</p>',
    prompts: [
      { id: 1, title: 'Boston Tea Party', relatedAnswer: 3 },
      { id: 2, title: 'Declaration of Independence', relatedAnswer: 4 },
    ],
    answers: [
      { id: 3, title: '1773' },
      { id: 4, title: '1776' },
    ],
    ...(language ? { language } : {}),
  },
});

const create = (parent: HTMLElement, language?: string) => {
  const el = document.createElement('test-match-list-interface-locale') as Host;
  parent.appendChild(el);
  el.model = model(language);
  el.session = {};
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('match-list interface locale', () => {
  it('speaks the player locale in its drag instructions', async () => {
    const { player } = mountPlayer('es');
    const el = create(player);

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH));
    expect(el.textContent).not.toContain(ENGLISH);
    // No content language declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it('follows a locale the player publishes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = create(player, 'en-US');
    await vi.waitFor(() => expect(el.textContent).toContain(ENGLISH));

    publish('es');

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH));
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = create(document.body, 'es_ES');

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH));
  });

  it('renders English when neither declares one', async () => {
    const el = create(document.body);

    await vi.waitFor(() => expect(el.textContent).toContain(ENGLISH));
    expect(el.getAttribute('lang')).toBeNull();
  });
});
