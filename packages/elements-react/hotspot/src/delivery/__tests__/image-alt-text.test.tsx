import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { model as buildModel } from '../../controller/index';

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));
// Konva draws on a canvas, which happy-dom lacks; the image renders outside it.
vi.mock('react-konva', () => ({
  Stage: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Layer: React.forwardRef(({ children }: { children?: React.ReactNode }, ref) => {
    const canvas = React.useRef<HTMLCanvasElement>(null);
    React.useImperativeHandle(ref, () => ({ getNativeCanvasElement: () => canvas.current }));
    return (
      <div>
        <canvas ref={canvas} />
        {children}
      </div>
    );
  }),
}));
vi.mock('../hotspot/rectangle.js', () => ({ default: () => null }));
vi.mock('../hotspot/polygon.js', () => ({ default: () => null }));
vi.mock('../hotspot/circle.js', () => ({ default: () => null }));

const { default: Hotspot } = await import('../index');

type Host = HTMLElement & { model: object; session: object };

customElements.define('test-hotspot-image-alt-text', Hotspot as unknown as CustomElementConstructor);

// The whole path an authored alt text takes: the controller's model, the element, then the image.
const mount = async (extra: object) => {
  const question = {
    id: '1',
    element: 'hotspot',
    imageUrl: 'plane.png',
    dimensions: { width: 100, height: 100 },
    shapes: { rectangles: [{ id: '1', x: 0, y: 0, width: 10, height: 10 }], polygons: [], circles: [] },
    ...extra,
  };
  const el = document.createElement('test-hotspot-image-alt-text') as Host;
  document.body.appendChild(el);
  el.model = (await buildModel(question, { answers: [] }, { mode: 'gather', role: 'student' })) as object;
  el.session = { answers: [] };
  await vi.waitFor(() => expect(el.querySelector('img')).not.toBeNull());
  return el;
};

const imageName = (el: HTMLElement) => el.querySelector('img')?.getAttribute('alt');

afterEach(() => {
  document.body.innerHTML = '';
});

describe('hotspot image alt text', () => {
  it('names the image with the model’s alt text', async () => {
    expect(imageName(await mount({ imageAltText: 'A plane seen from above' }))).toBe('A plane seen from above');
  });

  it('names the image by its number of hotspots without one', async () => {
    expect(imageName(await mount({}))).toBe('Image with 1 hotspot');
  });
});
