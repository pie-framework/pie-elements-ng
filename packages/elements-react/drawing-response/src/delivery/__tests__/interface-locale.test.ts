import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// Konva needs node-canvas outside a browser; the stand-in stage renders the one canvas a single-layer stage creates.
vi.mock('react-konva', async () => {
  const { createElement, forwardRef } = await import('react');
  const shape = forwardRef(() => null);
  return {
    Stage: forwardRef(() => createElement('div', null, createElement('canvas'))),
    Layer: shape,
    Arrow: shape,
    Circle: shape,
    Line: shape,
    Rect: shape,
    Text: shape,
    Transformer: shape,
  };
});

const { default: DrawingResponse } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-drawing-response-locale', DrawingResponse as unknown as CustomElementConstructor);

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
  imageDimensions: { height: 100, width: 100 },
  imageUrl: '',
  backgroundImageEnabled: false,
  teacherInstructions: '<p>Notes</p>',
};

const mount = (itemModel: object, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-drawing-response-locale') as Host;
  player.appendChild(el);
  el.model = itemModel;
  el.session = {};
  return { el, publish };
};

const toolTitles = (el: HTMLElement) =>
  [...el.querySelectorAll('button[title]')].map((button) => button.getAttribute('title'));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('drawing-response interface locale', () => {
  it('labels its tools, palette and canvas in the player locale', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(toolTitles(el)).toContain('Seleccionar'));
    expect(el.textContent).toContain('Color de relleno');
    expect(el.textContent).toContain('Deshacer');
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
    expect(el.querySelector('canvas')?.getAttribute('aria-label')).toBe('Área de dibujo');
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = mount(model, 'es');
    await vi.waitFor(() => expect(toolTitles(el)).toContain('Seleccionar'));
    publish('nl-NL');
    await vi.waitFor(() => expect(toolTitles(el)).toContain('Selecteren'));
    expect(el.textContent).toContain('Vulkleur');
    expect(el.textContent).toContain('Instructies voor de leraar weergeven');
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(toolTitles(el)).toContain('Seleccionar'));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = mount({ ...model, language: 'es_ES' });
    await vi.waitFor(() => expect(toolTitles(el)).toContain('Seleccionar'));
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders English when neither declares a locale', async () => {
    const { el } = mount(model);
    await vi.waitFor(() => expect(toolTitles(el)).toContain('Select'));
    expect(el.textContent).toContain('Fill color');
  });
});
