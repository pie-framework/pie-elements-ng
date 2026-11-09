import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import GraphWithControls from '../graph-with-controls';
import { Graph } from '../graph';
import { axisPosition } from '../axis/axes';

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

describe('per-tool mark limit', () => {
  const pointTool = { type: 'point', addPoint: (p: object) => ({ type: 'point', ...p }) };
  const click = (marks: object[], markLimits?: object) => {
    const onChangeMarks = vi.fn();
    const graph = new Graph({ currentTool: pointTool, marks, markLimits, onChangeMarks });
    graph.onBgClick({ x: 1, y: 1 });
    return onChangeMarks;
  };

  it('places nothing more once the tool reaches its limit', () => {
    const twoPoints = [
      { type: 'point', x: 2, y: 2 },
      { type: 'point', x: 3, y: 3 },
    ];

    expect(click(twoPoints, { point: 2 })).not.toHaveBeenCalled();
    expect(click(twoPoints, { point: 3 })).toHaveBeenCalled();
    expect(click(twoPoints)).toHaveBeenCalled();
  });
});
