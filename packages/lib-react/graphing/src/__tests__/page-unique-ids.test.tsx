import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import GraphWithControls from '../graph-with-controls';

const graph = (props: object = {}) => (
  <GraphWithControls
    domain={{ min: -5, max: 5, step: 1 }}
    range={{ min: -5, max: 5, step: 1 }}
    size={{ width: 300, height: 300 }}
    labels={{}}
    toolbarTools={['point', 'line', 'ray']}
    marks={[
      { type: 'line', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
      { type: 'ray', from: { x: 0, y: 0 }, to: { x: -1, y: 2 } },
      { type: 'point', x: 2, y: 2 },
    ]}
    onChangeMarks={() => {}}
    {...props}
  />
);

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((el) => el.id);

// Every id a mask, marker or ARIA attribute points at.
const references = (root: ParentNode) =>
  [...root.querySelectorAll('*')].flatMap((el) => [
    ...['aria-labelledby', 'aria-describedby', 'aria-controls', 'for'].flatMap((name) =>
      (el.getAttribute(name) || '').split(/\s+/).filter(Boolean),
    ),
    ...['mask', 'marker-start', 'marker-end']
      .map((name) => /url\(['"]?#([^'")]+)['"]?\)/.exec(el.getAttribute(name) || '')?.[1])
      .filter((id): id is string => !!id),
  ]);

describe('graphing ids', () => {
  it('stay unique when two graphs share a page', () => {
    render(graph());
    render(graph());

    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('resolve masks, arrow markers and descriptions inside their own graph', () => {
    const first = render(graph()).container;
    const second = render(graph()).container;

    for (const root of [first, second]) {
      const refs = references(root);
      expect(refs.filter((id) => id.startsWith('arrow-'))).toHaveLength(3);
      for (const id of refs) {
        expect(root.querySelector(`[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('stay the same across re-renders', () => {
    const { container, rerender } = render(graph());
    const before = ids(container);

    rerender(graph({ title: 'Renamed' }));

    expect(ids(container)).toEqual(before);
  });
});
