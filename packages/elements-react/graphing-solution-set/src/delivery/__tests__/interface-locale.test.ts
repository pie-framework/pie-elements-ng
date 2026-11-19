import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import GraphingSolutionSet from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object; session: object };

customElements.define(
  'test-graphing-solution-set-interface-locale',
  GraphingSolutionSet as unknown as CustomElementConstructor
);

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
  return {
    player,
    publish: (next: string) => callbacks.forEach((cb) => cb({ locale: next, direction: 'ltr' })),
  };
}

const create = (parent: HTMLElement, language?: string) => {
  const el = document.createElement('test-graphing-solution-set-interface-locale') as Host;
  parent.appendChild(el);
  el.model = {
    domain: { min: -5, max: 5, step: 1, labelStep: 1, axisLabel: 'x' },
    range: { min: -5, max: 5, step: 1, labelStep: 1, axisLabel: 'y' },
    size: { width: 300, height: 300 },
    labels: {},
    arrows: { left: true, right: true, up: true, down: true },
    gssLineData: { numberOfLines: 1, selectedTool: 'lineA', sections: [], lineA: { lineType: 'Solid' } },
    teacherInstructions: 'Look for the shaded half-plane.',
    ...(language ? { language } : {}),
  };
  el.session = { answer: [] };
  return el;
};

const toggleLabel = (el: HTMLElement) => el.querySelector('[aria-expanded]')?.textContent?.trim();

/** Opens the reset dialog and returns its title and buttons. */
async function resetDialog(el: HTMLElement, reset: string) {
  const button = [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === reset);
  if (!button) throw new Error(`no ${reset} button`);
  button.click();
  return vi.waitFor(() => {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) throw new Error('dialog not open');
    return {
      title: dialog.querySelector('h2')?.textContent,
      buttons: [...dialog.querySelectorAll('button')].map((b) => b.textContent),
    };
  });
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('graphing-solution-set interface locale', () => {
  it('renders its chrome and dialogs in the player locale', async () => {
    const { player } = mountPlayer('es');
    const el = create(player);

    await vi.waitFor(() =>
      expect(toggleLabel(el)).toBe('Mostrar instrucciones para el maestro')
    );
    expect(await resetDialog(el, 'Reiniciar')).toEqual({
      title: 'Advertencia',
      buttons: ['Cancelar', 'Aceptar'],
    });
    // No content language declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it('follows a locale the player publishes after the first render', async () => {
    const { player, publish } = mountPlayer('en-US');
    const el = create(player, 'en-US');
    await vi.waitFor(() => expect(toggleLabel(el)).toBe('Show Teacher Instructions'));

    publish('es');

    await vi.waitFor(() =>
      expect(toggleLabel(el)).toBe('Mostrar instrucciones para el maestro')
    );
    expect((await resetDialog(el, 'Reiniciar')).title).toBe('Advertencia');
    // The content keeps its own language.
    expect(el.getAttribute('lang')).toBe('en-US');
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("falls back to the item's declared language when no player answers", async () => {
    const el = create(document.body, 'es_ES');

    await vi.waitFor(() =>
      expect(toggleLabel(el)).toBe('Mostrar instrucciones para el maestro')
    );
    expect((await resetDialog(el, 'Reiniciar')).title).toBe('Advertencia');
  });

  it('renders English when neither declares one', async () => {
    const el = create(document.body);

    await vi.waitFor(() => expect(toggleLabel(el)).toBe('Show Teacher Instructions'));
    expect(await resetDialog(el, 'Reset')).toEqual({ title: 'Warning', buttons: ['Cancel', 'OK'] });
    expect(el.getAttribute('lang')).toBeNull();
  });
});
