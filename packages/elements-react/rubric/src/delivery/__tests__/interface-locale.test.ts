import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: RubricRender } = await import('../index.js');

type Host = HTMLElement & { model: object };

const TAG = 'test-rubric-interface-locale';
customElements.define(TAG, RubricRender as unknown as CustomElementConstructor);

/** A stand-in player; `publish` changes the locale it answers the element's subscription with. */
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

const model = { points: ['Nothing correct', 'Fully correct'], sampleAnswers: [], excludeZero: false };

function mount(parent: HTMLElement, itemModel: object) {
  const el = document.createElement(TAG) as Host;
  parent.appendChild(el);
  el.model = { ...model, ...itemModel };
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('rubric interface locale', () => {
  it('renders the chrome in the player locale and keeps the content language', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, { language: 'en_US' });

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar rúbrica'));
    expect(el.textContent).toContain('1 PTO');
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  it('follows a locale change after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = mount(player, {});
    await vi.waitFor(() => expect(el.textContent).toContain('Show Rubric'));

    publish('es');

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar rúbrica'));
  });

  it('stamps no lang on an item that declares none', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, {});

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar rúbrica'));
    expect(el.getAttribute('lang')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("renders a Spanish-declaring item's chrome in Spanish without a player", async () => {
    const el = mount(document.body, { language: 'es_ES' });

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar rúbrica'));
    expect(el.getAttribute('lang')).toBe('es-ES');
  });
});
