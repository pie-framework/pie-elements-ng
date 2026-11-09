import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import MultipleChoice from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-mc-interface-locale', MultipleChoice as unknown as CustomElementConstructor);

/** A stand-in player: answers the element's interface-locale subscription with `locale`. */
function mountPlayer(locale: string) {
  const player = document.createElement('div');
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void; subscribe?: boolean };
    if (request.context !== interfaceLocaleContext || request.subscribe !== true) return;
    request.callback?.({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  return player;
}

const mount = (locale: string, model: object) => {
  const el = document.createElement('test-mc-interface-locale') as Host;
  mountPlayer(locale).appendChild(el);
  el.model = {
    choiceMode: 'radio',
    prompt: '<p>Which one?</p>',
    choices: [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
    ],
    // The content is English; the interface locale decides the chrome.
    language: 'en-US',
    ...model,
  };
  el.session = {};
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('multiple-choice interface locale', () => {
  it('names the answer choices and the heading in the interface locale', async () => {
    const el = mount('nl-NL', { mode: 'gather' });

    await vi.waitFor(() => expect(el.querySelector('legend')?.textContent).toBe('Antwoordkeuzes'));
    expect(el.querySelector('h2')?.textContent).toBe('Meerkeuzevraag');
    expect(el.getAttribute('aria-label')).toBe('Meerkeuzevraag');
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the
  // item declares. Items declaring `es_ES` render Spanish chrome this way, and
  // pie-players answers only once a host chooses a locale so they keep it.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = document.createElement('test-mc-interface-locale') as Host;
    document.body.appendChild(el);
    el.model = {
      choiceMode: 'radio',
      prompt: '<p>¿Cuál?</p>',
      choices: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ],
      language: 'es_ES',
      mode: 'gather',
    };
    el.session = {};

    await vi.waitFor(() => expect(el.querySelector('legend')?.textContent).toBe('Opciones de respuesta'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta de opción múltiple');
  });

  it('labels the correct-answer toggle in the interface locale', async () => {
    const el = mount('nl-NL', { mode: 'evaluate', responseCorrect: false });

    await vi.waitFor(() => expect(el.textContent).toContain('Juist antwoord weergeven'));
    expect(el.textContent).not.toContain('Show correct answer');
  });
});
