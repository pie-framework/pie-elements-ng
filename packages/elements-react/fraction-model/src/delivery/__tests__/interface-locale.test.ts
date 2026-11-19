import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import FractionModel from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-fraction-model-interface-locale', FractionModel as unknown as CustomElementConstructor);

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
  const el = document.createElement('test-fraction-model-interface-locale') as Host;
  parent.appendChild(el);
  el.model = {
    title: 'Shade the fraction',
    modelTypeSelected: 'bar',
    maxModelSelected: 2,
    partsPerModel: 4,
    allowedStudentConfig: true,
    ...(language ? { language } : {}),
  };
  el.session = { answers: { response: [], noOfModel: 1, partsPerModel: 2 } };
  return el;
};

const labels = (el: HTMLElement) => [...el.querySelectorAll('label')].map((label) => label.textContent);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('fraction-model interface locale', () => {
  it('labels the configuration fields in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = create(player);

    await vi.waitFor(() => expect(labels(el)).toEqual(['Número de modelos', 'Partes por modelo']));
    // No content language declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it('follows a locale the player publishes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = create(player, 'en-US');
    await vi.waitFor(() => expect(labels(el)).toEqual(['Number of Models', 'Parts per Model']));

    publish('es');

    await vi.waitFor(() => expect(labels(el)).toEqual(['Número de modelos', 'Partes por modelo']));
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = create(document.body, 'es_ES');

    await vi.waitFor(() => expect(labels(el)).toEqual(['Número de modelos', 'Partes por modelo']));
  });

  it('renders English when neither declares one', async () => {
    const el = create(document.body);

    await vi.waitFor(() => expect(labels(el)).toEqual(['Number of Models', 'Parts per Model']));
    expect(el.getAttribute('lang')).toBeNull();
  });
});
