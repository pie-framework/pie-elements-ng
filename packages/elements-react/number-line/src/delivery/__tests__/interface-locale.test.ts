import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext, loadLocale } from '@pie-element/shared-i18n';

import { catalogs } from '../../i18n/index';
import NumberLine from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-number-line-interface-locale', NumberLine as unknown as CustomElementConstructor);

const SPANISH_LABEL = 'Recta numérica de 0 a 10, con una marca cada 1';
const ENGLISH_LABEL = 'Number line from 0 to 10, with a tick every 1';

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
  const el = document.createElement('test-number-line-interface-locale') as Host;
  parent.appendChild(el);
  el.model = {
    disabled: false,
    graph: {
      domain: { min: 0, max: 10 },
      ticks: { major: 1, minor: 1 },
      arrows: { left: true, right: true },
      width: 600,
    },
    ...(language ? { language } : {}),
  };
  el.session = {};
  return el;
};

const graphLabel = (el: HTMLElement) => el.querySelector('svg[aria-label]')?.getAttribute('aria-label');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('number-line interface locale', () => {
  it('names the number line and its controls in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = create(player);

    await vi.waitFor(() => expect(graphLabel(el)).toBe(SPANISH_LABEL));
    expect(el.textContent).toContain('Deshacer');
    expect(el.textContent).toContain('Borrar todo');
    // No content language declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it('follows a locale the player publishes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = create(player, 'en-US');
    await vi.waitFor(() => expect(graphLabel(el)).toBe(ENGLISH_LABEL));

    publish('es');

    await vi.waitFor(() => expect(graphLabel(el)).toBe(SPANISH_LABEL));
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = create(document.body, 'es_ES');

    await vi.waitFor(() => expect(graphLabel(el)).toBe(SPANISH_LABEL));
    expect(el.textContent).toContain('Deshacer');
  });

  it('picks the element-limit plural from the count', async () => {
    await loadLocale('es');
    expect(catalogs.forLocale('en-US').plural('addElementLimit', { count: 1 })).toBe('You can only add 1 element');
    expect(catalogs.forLocale('en-US').plural('addElementLimit', { count: 3 })).toBe('You can only add 3 elements');
    expect(catalogs.forLocale('es').plural('addElementLimit', { count: 1 })).toBe('Solo puedes agregar 1 elemento');
  });

  it('renders English when neither declares one', async () => {
    const el = create(document.body);

    await vi.waitFor(() => expect(graphLabel(el)).toBe(ENGLISH_LABEL));
    expect(el.textContent).toContain('Undo');
    expect(el.getAttribute('lang')).toBeNull();
  });
});
