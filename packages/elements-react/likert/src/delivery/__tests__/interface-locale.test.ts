import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import Likert from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-likert-interface-locale', Likert as unknown as CustomElementConstructor);

const SPANISH = 'Mostrar instrucciones para el maestro';
const ENGLISH = 'Show Teacher Instructions';

/** A stand-in player: answers the interface-locale subscription and can publish a new locale later. */
function mountPlayer(locale: string) {
  const player = document.createElement('div');
  const callbacks: Array<(value: unknown) => void> = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context !== interfaceLocaleContext || !request.callback) return;
    callbacks.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  return { player, publish: (next: string) => callbacks.forEach((cb) => cb({ locale: next, direction: 'ltr' })) };
}

const create = (parent: HTMLElement, language?: string) => {
  const el = document.createElement('test-likert-interface-locale') as Host;
  parent.appendChild(el);
  el.model = {
    choices: [
      { label: 'Disagree', value: -1 },
      { label: 'Agree', value: 1 },
    ],
    prompt: 'How likely are you to report a problem?',
    teacherInstructions: 'Read aloud.',
    disabled: false,
    likertOrientation: 'horizontal',
    ...(language ? { language } : {}),
  };
  el.session = {};
  return el;
};

const toggleLabel = (el: HTMLElement) => el.querySelector('[aria-expanded]')?.textContent;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('likert interface locale', () => {
  it('labels the teacher-instructions toggle in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = create(player);

    await vi.waitFor(() => expect(toggleLabel(el)).toBe(SPANISH));
    // No content language declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it('follows a locale the player publishes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = create(player, 'en-US');
    await vi.waitFor(() => expect(toggleLabel(el)).toBe(ENGLISH));

    publish('es');

    await vi.waitFor(() => expect(toggleLabel(el)).toBe(SPANISH));
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = create(document.body, 'es_ES');

    await vi.waitFor(() => expect(toggleLabel(el)).toBe(SPANISH));
  });

  it('renders English when neither declares one', async () => {
    const el = create(document.body);

    await vi.waitFor(() => expect(toggleLabel(el)).toBe(ENGLISH));
    expect(el.getAttribute('lang')).toBeNull();
  });
});
