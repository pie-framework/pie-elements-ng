import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Match } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-match-locale', Match as unknown as CustomElementConstructor);

/** A stand-in player: answers the element's interface-locale subscription, and republishes on `publish`. */
function mountPlayer(locale?: string) {
  const player = document.createElement('div');
  const callbacks: ((value: unknown) => void)[] = [];
  player.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context !== interfaceLocaleContext || !request.callback || !locale) return;
    callbacks.push(request.callback);
    request.callback({ locale, direction: 'ltr' });
  });
  document.body.appendChild(player);
  const publish = (next: string) => {
    for (const callback of callbacks) callback({ locale: next, direction: 'ltr' });
  };
  return { player, publish };
}

// No rows, so the grid renders its empty-state sentence.
const model = {
  choiceMode: 'radio',
  layout: 3,
  headers: ['Statement', 'True', 'False'],
  rows: [],
  teacherInstructions: '<p>Notes</p>',
};

const mount = (itemModel: object, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-match-locale') as Host;
  player.appendChild(el);
  el.model = itemModel;
  el.session = {};
  return { el, publish };
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('match interface locale', () => {
  it('renders its chrome in the player locale', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Por ahora no hay preguntas para mostrar.'));
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = mount(model, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Por ahora no hay preguntas para mostrar.'));
    publish('nl-NL');
    await vi.waitFor(() => expect(el.textContent).toContain('Er zijn momenteel geen vragen om te tonen.'));
    expect(el.textContent).toContain('Instructies voor de leraar weergeven');
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(el.textContent).toContain('Por ahora no hay preguntas para mostrar.'));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = mount({ ...model, language: 'es_ES' });
    await vi.waitFor(() => expect(el.textContent).toContain('Por ahora no hay preguntas para mostrar.'));
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders English when neither declares a locale', async () => {
    const { el } = mount(model);
    await vi.waitFor(() => expect(el.textContent).toContain('There are currently no questions to show.'));
    expect(el.textContent).toContain('Show Teacher Instructions');
  });
});
