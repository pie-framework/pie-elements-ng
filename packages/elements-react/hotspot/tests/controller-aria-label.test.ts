import { describe, expect, it } from 'vitest';
import { model } from '../src/controller/index.js';

const GATHER = { mode: 'gather', role: 'student' };

describe('hotspot model: shape labels', () => {
  it('passes the camel-case, snake-case and kebab-case labels on to every kind of shape', async () => {
    const question = {
      id: '1',
      element: 'hotspot',
      shapes: {
        rectangles: [{ id: 'r', x: 0, y: 0, width: 10, height: 10, ariaLabel: 'Rectangle' }],
        polygons: [{ id: 'p', points: [{ x: 0, y: 0 }], aria_label: 'Polygon' }],
        circles: [{ id: 'c', x: 0, y: 0, radius: 5, 'aria-label': 'Circle' }],
      },
    };

    const out = await model(question as any, { answers: [] } as any, GATHER as any);

    expect(out.shapes.rectangles[0].ariaLabel).toBe('Rectangle');
    expect(out.shapes.polygons[0].aria_label).toBe('Polygon');
    expect(out.shapes.circles[0]['aria-label']).toBe('Circle');
  });
});
