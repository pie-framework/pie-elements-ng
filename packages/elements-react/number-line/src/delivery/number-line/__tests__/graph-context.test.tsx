import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import NumberLineGraph from '../graph/index';

const noop = () => {};

const graphProps = {
  domain: { min: 0, max: 10 },
  ticks: { minor: 1, major: 5 },
  width: 600,
  height: 150,
  onToggleElement: noop,
  onAddElement: noop,
  onDeselectElements: noop,
  onMoveElement: noop,
};

// The graph hands its scale to the ticks and elements through React context (not legacy childContextTypes).
// 0 and 10 sit 23px inside the 600px line, so the scale maps 0 -> 23, 5 -> 300 and 10 -> 577.
const tickXs = (container: HTMLElement) =>
  [...container.querySelectorAll('svg > g:not([class]) > g')].map((g) =>
    parseFloat(/translate\(([\d.]+)/.exec(g.getAttribute('transform') || '')?.[1] || 'NaN'),
  );

const circleXs = (container: HTMLElement) =>
  [...container.querySelectorAll('g[aria-roledescription] > circle[r="5"]')].map((c) =>
    parseFloat(c.getAttribute('cx') || 'NaN'),
  );

describe('number line graph context', () => {
  it('lays the ticks out on the domain scale', () => {
    const { container } = render(<NumberLineGraph {...graphProps} elements={[]} />);

    const xs = tickXs(container);
    expect(xs).toHaveLength(11);
    expect(xs[0]).toBeCloseTo(23);
    expect(xs[5]).toBeCloseTo(300);
    expect(xs[10]).toBeCloseTo(577);
  });

  it('places points on the same scale as the ticks', () => {
    const { container } = render(
      <NumberLineGraph
        {...graphProps}
        elements={[
          { type: 'point', pointType: 'full', position: 0 },
          { type: 'point', pointType: 'full', position: 5 },
          { type: 'point', pointType: 'full', position: 10 },
        ]}
      />,
    );

    expect(circleXs(container).map(Math.round)).toEqual([23, 300, 577]);
  });

  it('places the endpoints of a line on the scale', () => {
    const { container } = render(
      <NumberLineGraph
        {...graphProps}
        elements={[{ type: 'line', leftPoint: 'full', rightPoint: 'full', position: { left: 0, right: 10 } }]}
      />,
    );

    expect(circleXs(container).map(Math.round)).toEqual([23, 577]);
  });

  it('places the point of a ray on the scale', () => {
    const { container } = render(
      <NumberLineGraph
        {...graphProps}
        elements={[{ type: 'ray', direction: 'positive', pointType: 'full', position: 5 }]}
      />,
    );

    expect(circleXs(container).map(Math.round)).toEqual([300]);
  });
});
