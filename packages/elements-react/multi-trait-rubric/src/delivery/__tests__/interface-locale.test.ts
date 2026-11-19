import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import MultiTraitRubric from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object };

customElements.define('test-multi-trait-rubric-interface-locale', MultiTraitRubric as unknown as CustomElementConstructor);

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
  const el = document.createElement('test-multi-trait-rubric-interface-locale') as Host;
  parent.appendChild(el);
  el.model = {
    visible: true,
    halfScoring: true,
    description: true,
    animationsDisabled: true,
    scales: [
      {
        excludeZero: false,
        maxPoints: 1,
        traitLabel: 'Trait',
        traits: [
          { name: 'Ideas', description: 'A central idea', scorePointsDescriptors: ['Unclear', 'Clear'], standards: [] },
          { name: 'Voice', description: '', scorePointsDescriptors: ['Flat', ''], standards: [] },
        ],
      },
    ],
    ...(language ? { language } : {}),
  };
  return el;
};

const SPANISH = ['Descripción', '1 punto', '0 puntos', 'Sin descripción', 'se permiten puntuaciones de medio punto'];
const ENGLISH = ['Description', '1 point', '0 points', 'No Description', 'Half-point or in-between scores'];

afterEach(() => {
  document.body.innerHTML = '';
});

describe('multi-trait-rubric interface locale', () => {
  it('labels the rubric table in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = create(player);

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH[0]));
    for (const text of SPANISH) expect(el.textContent).toContain(text);
    // No content language declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it('follows a locale the player publishes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = create(player, 'en-US');
    await vi.waitFor(() => expect(el.textContent).toContain(ENGLISH[0]));

    publish('es');

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH[0]));
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = create(document.body, 'es_ES');

    await vi.waitFor(() => expect(el.textContent).toContain(SPANISH[0]));
  });

  it('renders English when neither declares one', async () => {
    const el = create(document.body);

    await vi.waitFor(() => expect(el.textContent).toContain(ENGLISH[0]));
    for (const text of ENGLISH) expect(el.textContent).toContain(text);
    expect(el.getAttribute('lang')).toBeNull();
  });
});
