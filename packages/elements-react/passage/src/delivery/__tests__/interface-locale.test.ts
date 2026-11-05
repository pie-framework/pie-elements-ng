import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

import PiePassage from '../index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

type Host = HTMLElement & { model: object };

customElements.define('test-passage-locale', PiePassage as unknown as CustomElementConstructor);

const model = {
  passages: [{ title: 'Only', text: '<p>Texto</p>', teacherInstructions: '<p>Notas</p>' }],
};

// Answers the element's interface-locale request the way a player does.
const provide = (ancestor: HTMLElement, locale: string) =>
  ancestor.addEventListener('context-request', (event) => {
    const request = event as Event & { context?: unknown; callback?: (value: unknown) => void };
    if (request.context === interfaceLocaleContext) request.callback?.({ locale, direction: 'ltr' });
  });

const mount = async (passageModel: object, locale?: string) => {
  const player = document.createElement('div');
  if (locale) provide(player, locale);
  document.body.appendChild(player);
  const el = document.createElement('test-passage-locale') as Host;
  player.appendChild(el);
  el.model = passageModel;
  await vi.waitFor(() => expect(el.querySelector('.tabpanel-0')).not.toBeNull());
  return el;
};

afterEach(() => {
  document.body.innerHTML = '';
});

describe('passage interface locale', () => {
  it('names the region and the teacher-instructions control in the player locale', async () => {
    const el = await mount(model, 'es');
    expect(el.getAttribute('aria-label')).toBe('Pasaje');
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
    // The content language stays the item's: none declared, none asserted.
    expect(el.getAttribute('lang')).toBeNull();
  });

  it("falls back to the item's declared language without a player", async () => {
    const el = await mount({ ...model, language: 'es_MX' });
    expect(el.getAttribute('aria-label')).toBe('Pasaje');
  });

  it('renders English when neither declares one', async () => {
    const el = await mount(model);
    expect(el.getAttribute('aria-label')).toBe('Passage');
    expect(el.textContent).toContain('Show Teacher Instructions');
  });
});
