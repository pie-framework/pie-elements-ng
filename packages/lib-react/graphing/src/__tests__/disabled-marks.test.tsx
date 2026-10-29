import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render } from '@testing-library/react';

import GraphWithControls from '../graph-with-controls';

const marks = [
  { type: 'point', x: 2, y: 2 },
  { type: 'line', from: { x: -3, y: -3 }, to: { x: -1, y: -1 } },
  {
    type: 'polygon',
    points: [
      { x: 1, y: -4 },
      { x: 3, y: -4 },
      { x: 3, y: -2 },
    ],
    closed: true,
  },
];

const graph = (props: object = {}) => (
  <GraphWithControls
    domain={{ min: -5, max: 5, step: 1 }}
    range={{ min: -5, max: 5, step: 1 }}
    size={{ width: 300, height: 300 }}
    labels={{}}
    toolbarTools={['point', 'line', 'polygon']}
    marks={marks}
    onChangeMarks={() => {}}
    {...props}
  />
);

// press on each shape of the graph and drag it a long way, as a pointer would; a shape that follows
// the pointer changes the graph while the button is still down
const dragEach = (root: HTMLElement) =>
  [...root.querySelectorAll('circle, line, polygon, polyline')].map((shape) => {
    const before = root.innerHTML;

    fireEvent.mouseDown(shape, { clientX: 100, clientY: 100, button: 0 });
    fireEvent.mouseMove(shape, { clientX: 160, clientY: 160, button: 0 });
    fireEvent.mouseMove(shape, { clientX: 220, clientY: 200, button: 0 });
    const followed = root.innerHTML !== before;
    fireEvent.mouseUp(shape, { clientX: 220, clientY: 200, button: 0 });

    return followed;
  });

// the classes of every element of the graph itself, which is where a mark's look comes from
const looks = (root: HTMLElement) =>
  [...root.querySelectorAll('svg *')].map((el) => el.getAttribute('class') ?? '').sort();

describe('a disabled graph (view and evaluate mode)', () => {
  it('does not let a point, line or polygon be dragged', () => {
    const onChangeMarks = vi.fn();
    const { container } = render(graph({ disabled: true, onChangeMarks }));
    const followed = dragEach(container);

    expect(followed.length).toBeGreaterThan(0);
    expect(followed.some(Boolean)).toBe(false);
    expect(onChangeMarks).not.toHaveBeenCalled();
  });

  it('leaves the marks looking as they do when they can be moved', () => {
    const disabled = render(graph({ disabled: true })).container;
    const enabled = render(graph()).container;

    expect(looks(disabled)).toEqual(looks(enabled));
    expect(disabled.querySelector('svg [disabled]')).toBeNull();
  });

  it('still lets them be dragged when it is not disabled', () => {
    const onChangeMarks = vi.fn();
    const { container } = render(graph({ onChangeMarks }));

    expect(dragEach(container).some(Boolean)).toBe(true);
    expect(onChangeMarks).toHaveBeenCalled();
  });
});
