import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: ExplicitConstructedResponse } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

const TAG = 'test-ecr-interface-locale';
customElements.define(TAG, ExplicitConstructedResponse as unknown as CustomElementConstructor);

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

const model = {
  mode: 'gather',
  markup: '<p>The capital of France is {{0}}.</p>',
  choices: {},
  teacherInstructions: '<p>Read aloud.</p>',
};

function mount(parent: HTMLElement, itemModel: object) {
  const el = document.createElement(TAG) as Host;
  parent.appendChild(el);
  el.model = { ...model, ...itemModel };
  el.session = {};
  return el;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('explicit-constructed-response interface locale', () => {
  it('renders the chrome in the player locale and keeps the content language', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, { language: 'en_US' });

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta para completar espacios en blanco');
    expect(el.querySelector('h2')?.textContent).toBe('Pregunta para completar espacios en blanco');
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  it('follows a locale change after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = mount(player, {});
    await vi.waitFor(() => expect(el.textContent).toContain('Show Teacher Instructions'));

    publish('es');

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta para completar espacios en blanco');
  });

  it('stamps no lang on an item that declares none', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, {});

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.getAttribute('lang')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("renders a Spanish-declaring item's chrome in Spanish without a player", async () => {
    const el = mount(document.body, { language: 'es_ES' });

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta para completar espacios en blanco');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders the alternates default in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, {
      language: 'en_US',
      mode: 'evaluate',
      choices: { 0: [{ label: 'Paris', value: '0' }, { label: 'Paree', value: '1' }] },
      showNote: true,
      feedback: { 0: 'correct' },
    });
    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar respuesta correcta'));

    expect(el.textContent).not.toContain('Nota:');

    const toggle = [...el.querySelectorAll('button, [role="button"]')].find((node) =>
      node.textContent?.includes('Mostrar respuesta correcta'),
    ) as HTMLElement;
    toggle.click();

    await vi.waitFor(() => expect(el.textContent).toContain('Nota: La respuesta que se muestra arriba'));
  });
});
