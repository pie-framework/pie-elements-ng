import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import GraphWithControls from '../graph-with-controls';
import { Graph } from '../graph';
import { axisPosition } from '../axis/axes';
import { markLimitReached } from '../utils';

describe('axes when the origin is out of view', () => {
  it('crosses at zero in view and at the nearest edge otherwise', () => {
    expect(axisPosition({ min: -5, max: 5 })).toBe(0);
    expect(axisPosition({ min: 5, max: 15 })).toBe(5);
    expect(axisPosition({ min: -15, max: -5 })).toBe(-5);
  });

  it('draws both axes over a domain and range that exclude the origin', () => {
    const { container } = render(
      <GraphWithControls
        domain={{ min: 5, max: 15, step: 1 }}
        range={{ min: 5, max: 15, step: 1 }}
        size={{ width: 300, height: 300 }}
        labels={{}}
        toolbarTools={['point']}
        marks={[]}
        onChangeMarks={() => {}}
      />,
    );

    expect(container.querySelectorAll('.visx-axis').length).toBe(2);
  });
});

const pointTool = { type: 'point', addPoint: (p: object) => ({ type: 'point', ...p }) };
const click = (marks: object[], markLimits?: object) => {
  const onChangeMarks = vi.fn();
  const graph = new Graph({ currentTool: pointTool, marks, markLimits, onChangeMarks });
  graph.onBgClick({ x: 1, y: 1 });
  return onChangeMarks;
};
const twoPoints = [
  { type: 'point', x: 2, y: 2 },
  { type: 'point', x: 3, y: 3 },
];

describe('per-tool mark limit', () => {
  it('places nothing more once the tool reaches its limit', () => {
    expect(click(twoPoints, { point: 2 })).not.toHaveBeenCalled();
    expect(click(twoPoints, { point: 3 })).toHaveBeenCalled();
    expect(click(twoPoints)).toHaveBeenCalled();
  });

  it('treats a limit of 0 as no limit', () => {
    expect(click([{ type: 'point', x: 2, y: 2 }], { point: 0 })).toHaveBeenCalled();
  });

  it('lets the student finish a mark still being drawn at the limit', () => {
    const segmentTool = {
      type: 'segment',
      addPoint: (p: object, mark?: object) => ({ type: 'segment', from: p, ...mark, building: false }),
    };
    const marks = [
      { type: 'segment', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
      { type: 'segment', from: { x: 2, y: 2 }, building: true },
    ];
    const onChangeMarks = vi.fn();
    new Graph({ currentTool: segmentTool, marks, markLimits: { segment: 2 }, onChangeMarks }).onBgClick({ x: 3, y: 3 });

    expect(onChangeMarks).toHaveBeenCalled();
  });
});

describe('mark limit status', () => {
  const graph = (marks: object[], props: object = {}) => (
    <GraphWithControls
      domain={{ min: -5, max: 5, step: 1 }}
      range={{ min: -5, max: 5, step: 1 }}
      size={{ width: 300, height: 300 }}
      labels={{}}
      toolbarTools={['point']}
      marks={marks}
      onChangeMarks={() => {}}
      {...props}
    />
  );
  // @dnd-kit adds a status region of its own
  const limitStatus = () => screen.getAllByRole('status').find((region) => !region.id.startsWith('DndLiveRegion'));

  it('tells the student once the current tool reaches its limit', () => {
    const { rerender } = render(graph(twoPoints.slice(0, 1), { markLimits: { point: 2 } }));

    expect(limitStatus()).toBeEmptyDOMElement();

    rerender(graph(twoPoints, { markLimits: { point: 2 } }));
    expect(limitStatus()).toHaveTextContent('Point: limit of 2 reached. No more can be placed.');
  });

  it('stays empty for an unlimited tool and a disabled graph', () => {
    const { rerender } = render(graph(twoPoints, { markLimits: { point: 0 } }));

    expect(limitStatus()).toBeEmptyDOMElement();

    rerender(graph(twoPoints, { markLimits: { point: 2 }, disabled: true }));
    expect(limitStatus()).toBeEmptyDOMElement();
  });

  it('shows exactly when placement is blocked', () => {
    for (const markLimits of [{ point: 1 }, { point: 2 }, { point: 3 }, { point: 0 }, {}]) {
      expect(markLimitReached(twoPoints, markLimits, 'point')).toBe(!click(twoPoints, markLimits).mock.calls.length);
    }
  });
});
