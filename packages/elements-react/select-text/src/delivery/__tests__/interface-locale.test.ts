import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: SelectText } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-select-text-locale', SelectText as unknown as CustomElementConstructor);

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

const model = {
  prompt: '<p>Pick one.</p>',
  text: 'The storm hit. Mara ran.',
  tokens: [
    { text: 'The storm hit.', start: 0, end: 14 },
    { text: 'Mara ran.', start: 15, end: 24 },
  ],
  teacherInstructions: '<p>Notes</p>',
  env: { mode: 'gather' },
};

const mount = (itemModel: object, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-select-text-locale') as Host;
  player.appendChild(el);
  el.model = itemModel;
  el.session = { selectedTokens: [] };
  return { el, publish };
};

const groupName = (el: HTMLElement) => el.querySelector('[role="group"]')?.getAttribute('aria-label');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('select-text interface locale', () => {
  it('labels its chrome in the player locale', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(groupName(el)).toBe('Texto seleccionable'));
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = mount(model, 'es');
    await vi.waitFor(() => expect(groupName(el)).toBe('Texto seleccionable'));
    publish('nl-NL');
    await vi.waitFor(() => expect(groupName(el)).toBe('Selecteerbare tekst'));
    expect(el.textContent).toContain('Instructies voor de leraar weergeven');
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(groupName(el)).toBe('Texto seleccionable'));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = mount({ ...model, language: 'es_ES' });
    await vi.waitFor(() => expect(groupName(el)).toBe('Texto seleccionable'));
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });
});
