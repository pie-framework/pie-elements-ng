import { describe, expect, it } from 'vitest';
import { labelCanvases, labelDrawingArea } from '../drawing-area-label';

const ALL_TOOLS = [
  'Select',
  'FreePathDrawable',
  'LineDrawable',
  'RectangleDrawable',
  'CircleDrawable',
  'Text',
  'EraserDrawable',
];

describe('drawing area label', () => {
  it('names the area and the tools available', () => {
    expect(labelDrawingArea({ hasBackgroundImage: false, toolTypes: ALL_TOOLS })).toBe(
      'Drawing area. Tools: Select, Free draw, Line, Rectangle, Circle, Text entry, Eraser.',
    );
  });

  it('says when the area is over a background image, without describing the image', () => {
    expect(labelDrawingArea({ hasBackgroundImage: true, toolTypes: ['LineDrawable'] })).toBe(
      'Drawing area over a background image. Tools: Line.',
    );
  });

  it('leaves out the tools when none are available', () => {
    expect(labelDrawingArea({ hasBackgroundImage: true, toolTypes: [] })).toBe(
      'Drawing area over a background image.',
    );
  });

  it('skips tool types it has no name for', () => {
    expect(labelDrawingArea({ hasBackgroundImage: false, toolTypes: ['PaintBucket', 'CircleDrawable'] })).toBe(
      'Drawing area. Tools: Circle.',
    );
  });

  it('names the area in the item language', () => {
    expect(
      labelDrawingArea({ hasBackgroundImage: true, toolTypes: ['Select', 'EraserDrawable'], language: 'es_ES' }),
    ).toBe('Área de dibujo sobre una imagen de fondo. Herramientas: Seleccionar, Borrador.');
  });

  it('gives every canvas in the container the image role and the label', () => {
    const container = document.createElement('div');
    container.innerHTML = '<div><canvas></canvas><canvas></canvas></div>';

    labelCanvases(container, 'Drawing area.');

    for (const canvas of container.querySelectorAll('canvas')) {
      expect(canvas).toHaveAttribute('role', 'img');
      expect(canvas).toHaveAccessibleName('Drawing area.');
    }
  });
});
