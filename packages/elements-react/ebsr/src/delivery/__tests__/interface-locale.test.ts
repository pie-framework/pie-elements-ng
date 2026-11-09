import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Ebsr } = await import('../index.js');
const { EBSR_MULTIPLE_CHOICE_TAG } = await import('../../private-tags.js');

type Host = HTMLElement & { model: object; session: object };

const TAG = 'test-ebsr-interface-locale';
customElements.define(TAG, Ebsr as unknown as CustomElementConstructor);

/** A stand-in player; `publish` changes the locale it answers every subscription with. */
function mountPlayer(locale: string) {
  const player = document.createElement('div');
  const subscribers: Array<(value: unknown) => void> = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void; subscribe?: boolean };
    if (request.context !== interfaceLocaleContext || request.subscribe !== true || !request.callback) return;
    subscribers.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  return {
    player,
    publish: (next: string) => subscribers.forEach((callback) => callback({ locale: next, direction: 'ltr' })),
  };
}

const part = (extra: object = {}) => ({
  choiceMode: 'radio',
  choicePrefix: 'letters',
  choices: [
    { value: 'a', label: 'Red' },
    { value: 'b', label: 'Blue' },
  ],
  ...extra,
});

function mount(parent: HTMLElement, itemModel: object) {
  const el = document.createElement(TAG) as Host;
  parent.appendChild(el);
  el.model = { mode: 'gather', partLabels: true, partLabelType: 'Letters', partA: part(), partB: part(), ...itemModel };
  el.session = { id: '1', element: 'ebsr' };
  return el;
}

const partOf = (el: Element, key: 'a' | 'b') => el.querySelector(`${EBSR_MULTIPLE_CHOICE_TAG}[data-part="${key}"]`)!;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ebsr interface locale', () => {
  it('renders its chrome and both parts in the player locale and keeps the content language', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, { language: 'en_US', partA: part({ language: 'en_US' }), partB: part({ language: 'en_US' }) });

    await vi.waitFor(() => expect(partOf(el, 'b').textContent).toContain('Parte B'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta de dos partes');
    expect(el.querySelector('.srOnly')?.textContent).toBe('Pregunta de dos partes');
    expect(partOf(el, 'a').textContent).toContain('Parte A');
    expect(partOf(el, 'a').getAttribute('aria-label')).toBe('Pregunta de opción múltiple');
    expect(el.getAttribute('lang')).toBe('en-US');
    expect(partOf(el, 'a').getAttribute('lang')).toBe('en-US');
  });

  it('follows a locale change after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = mount(player, {});
    await vi.waitFor(() => expect(partOf(el, 'b').textContent).toContain('Part B'));

    publish('es');

    await vi.waitFor(() => expect(partOf(el, 'b').textContent).toContain('Parte B'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta de dos partes');
    await vi.waitFor(() => expect(partOf(el, 'a').getAttribute('aria-label')).toBe('Pregunta de opción múltiple'));
  });

  it('stamps no lang on an item that declares none', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, {});

    await vi.waitFor(() => expect(partOf(el, 'a').textContent).toContain('Parte A'));
    expect(el.getAttribute('lang')).toBeNull();
    expect(partOf(el, 'a').getAttribute('lang')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares,
  // which ebsr reads from part A when the item sets none.
  it("renders a Spanish-declaring item's chrome in Spanish without a player", async () => {
    const el = mount(document.body, { partA: part({ language: 'es_ES' }) });

    await vi.waitFor(() => expect(partOf(el, 'b').textContent).toContain('Parte B'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta de dos partes');
    expect(partOf(el, 'b').getAttribute('aria-label')).toBe('Pregunta de opción múltiple');
    expect(el.getAttribute('lang')).toBe('es-ES');
    expect(partOf(el, 'b').getAttribute('lang')).toBe('es-ES');
  });
});
