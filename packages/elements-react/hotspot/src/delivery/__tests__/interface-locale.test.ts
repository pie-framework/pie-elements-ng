import { afterEach, describe, expect, it, vi } from 'vitest';
import { interfaceLocaleContext } from '@pie-element/shared-i18n';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// Konva draws on a canvas, which happy-dom lacks; the keyboard focusables and the image render outside it.
vi.mock('react-konva', async () => {
  const { createElement, forwardRef, useImperativeHandle, useRef } = await import('react');
  type Children = { children?: import('react').ReactNode };
  const shape = forwardRef(() => null);
  return {
    Stage: forwardRef(({ children }: Children) => createElement('div', null, children)),
    Layer: forwardRef(({ children }: Children, ref) => {
      const canvas = useRef<HTMLCanvasElement>(null);
      useImperativeHandle(ref, () => ({ getNativeCanvasElement: () => canvas.current }));
      return createElement('div', null, createElement('canvas', { ref: canvas }), children);
    }),
    Circle: shape,
    Group: shape,
    Image: shape,
    Label: shape,
    Line: shape,
    Rect: shape,
    Tag: shape,
    Text: shape,
  };
});

const { default: Hotspot } = await import('../index.js');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-hotspot-locale', Hotspot as unknown as CustomElementConstructor);

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
  mode: 'gather',
  imageUrl: 'plane.png',
  dimensions: { width: 100, height: 100 },
  shapes: { rectangles: [{ id: '1', x: 0, y: 0, width: 10, height: 10 }] },
  teacherInstructions: '<p>Notes</p>',
};

const mount = (itemModel: object, locale?: string) => {
  const { player, publish } = mountPlayer(locale);
  const el = document.createElement('test-hotspot-locale') as Host;
  player.appendChild(el);
  el.model = itemModel;
  el.session = {};
  return { el, publish };
};

const shapeName = (el: HTMLElement) => el.querySelector('[role="button"]')?.getAttribute('aria-label');
const imageName = (el: HTMLElement) => el.querySelector('img')?.getAttribute('alt');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('hotspot interface locale', () => {
  it('names its image and shapes in the player locale', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(shapeName(el)).toBe('Zona activa 1 de 1'));
    expect(imageName(el)).toBe('Imagen con 1 zona activa');
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
  });

  it('relabels when the player publishes another locale', async () => {
    const { el, publish } = mount(model, 'es');
    await vi.waitFor(() => expect(shapeName(el)).toBe('Zona activa 1 de 1'));
    publish('nl-NL');
    await vi.waitFor(() => expect(shapeName(el)).toBe('Hotspot 1 van 1'));
    expect(imageName(el)).toBe('Afbeelding met 1 hotspot');
    expect(el.textContent).toContain('Instructies voor de leraar weergeven');
  });

  it('stamps no lang for an item that declares none', async () => {
    const { el } = mount(model, 'es');
    await vi.waitFor(() => expect(shapeName(el)).toBe('Zona activa 1 de 1'));
    expect(el.getAttribute('lang')).toBeNull();
    expect(el.getAttribute('dir')).toBeNull();
  });

  // Invariant: with no player answering, the chrome follows the language the item declares.
  it("follows the item's declared language when no player answers", async () => {
    const { el } = mount({ ...model, language: 'es_ES' });
    await vi.waitFor(() => expect(shapeName(el)).toBe('Zona activa 1 de 1'));
    expect(el.textContent).toContain('Mostrar instrucciones para el maestro');
    expect(el.getAttribute('lang')).toBe('es-ES');
  });

  it('renders English when neither declares a locale', async () => {
    const { el } = mount(model);
    await vi.waitFor(() => expect(shapeName(el)).toBe('Hotspot 1 of 1'));
    expect(imageName(el)).toBe('Image with 1 hotspot');
  });
});
