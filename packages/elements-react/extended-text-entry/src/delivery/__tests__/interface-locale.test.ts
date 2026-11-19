import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: RootExtendedTextEntry } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

const TAG = 'test-ete-interface-locale';
customElements.define(TAG, RootExtendedTextEntry as unknown as CustomElementConstructor);

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

const model = { prompt: '<p>Describe the water cycle.</p>', teacherInstructions: '<p>Read aloud.</p>' };

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

describe('extended-text-entry interface locale', () => {
  it('renders the chrome in the player locale and keeps the content language', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, { language: 'en_US' });

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta de respuesta escrita');
    expect(el.textContent).toContain('Pregunta de respuesta construida');
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  it('follows a locale change after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = mount(player, {});
    await vi.waitFor(() => expect(el.textContent).toContain('Show Teacher Instructions'));

    publish('es');

    await vi.waitFor(() => expect(el.textContent).toContain('Mostrar instrucciones para el maestro'));
    expect(el.getAttribute('aria-label')).toBe('Pregunta de respuesta escrita');
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
    expect(el.getAttribute('aria-label')).toBe('Pregunta de respuesta escrita');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('labels the annotation comment editor in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = mount(player, { language: 'en_US', annotatorMode: true, disabledAnnotator: false });

    await vi.waitFor(() => expect(el.querySelector('label')?.textContent).toBe('Comentario'));
  });
});
