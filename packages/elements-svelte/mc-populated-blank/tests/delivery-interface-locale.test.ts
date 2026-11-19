/**
 * The chrome's language: the locale a player publishes, else the item's
 * declared language (`language`, else `locale`), else `en-US`. The host's
 * `lang` is the item's content language and stays unset for an item that
 * declares none.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushSync } from 'svelte';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';
import McPopulatedBlankElement from '../src/delivery/index.js';
import { model as buildViewModel } from '../src/controller/index.js';

const TAG = 'mc-populated-blank--version-0-0-0-interface-locale-test';
if (!customElements.get(TAG)) {
  customElements.define(TAG, McPopulatedBlankElement as CustomElementConstructor);
}

const QUESTION = {
  id: '1',
  element: TAG,
  template: '<p>The answer is {{blank}}.</p>',
  interactionMode: 'populate_blank' as const,
  choiceMode: 'text' as const,
  choices: [
    { id: 'a', labelHtml: '<p>Alpha</p>' },
    { id: 'b', labelHtml: '<p>Beta</p>' },
  ],
  correctChoiceId: 'b',
  hasAudio: false,
};
const SESSION = { id: '1', element: TAG, value: ['a'] };

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
  element.model = await buildViewModel(question as never, SESSION, {
    mode: 'evaluate',
    role: 'student',
  });
  element.session = SESSION;
  return element;
}

const toggleLabel = (element: HTMLElement) =>
  element.querySelector('.pie-correct-answer-toggle-label')?.textContent?.trim();

afterEach(() => {
  document.body.innerHTML = '';
});

describe('mc-populated-blank interface locale', () => {
  it('renders the chrome in the player locale, with no English frame first', async () => {
    const { player } = mountPlayer('es');
    const element = await render(QUESTION, player);
    flushSync();
    expect(element.textContent).not.toContain('Show correct answer');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar respuesta correcta'));
    expect(element.querySelector('.pie-blank-hint')?.textContent).toBe(
      'La respuesta que elijas aparecerá en la línea en blanco de arriba.'
    );
    expect(element.querySelector('.pie-result-feedback')?.textContent).toBe(
      'Respuesta incorrecta seleccionada'
    );
  });

  it('follows a locale the player changes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const element = await render(QUESTION, player);
    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Show correct answer'));

    publish('nl-NL');

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Juist antwoord weergeven'));
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

  it('takes `locale` as the declared language when `language` is unset', async () => {
    const element = await render({ ...QUESTION, locale: 'es_MX' });

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Mostrar respuesta correcta'));
    expect(element.getAttribute('lang')).toBe('es-MX');
  });

  it('keeps the content language under a player locale', async () => {
    const { player } = mountPlayer('nl-NL');
    const element = await render({ ...QUESTION, language: 'es_ES' }, player);

    await vi.waitFor(() => expect(toggleLabel(element)).toBe('Juist antwoord weergeven'));
    expect(element.getAttribute('lang')).toBe('es-ES');
    expect(element.querySelector('.pie-toggle-correct-answer')?.getAttribute('lang')).toBe('nl-NL');
  });
});
