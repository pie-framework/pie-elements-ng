import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { describeNumberLine } from '../graph/description';
import NumberLineGraph from '../graph/index';

const noop = () => {};

const graphProps = {
  domain: { min: 0, max: 10 },
  ticks: { minor: 1, major: 2 },
  width: 600,
  height: 100,
  onToggleElement: noop,
  onMoveElement: noop,
  onAddElement: noop,
  onDeselectElements: noop,
};

describe('number line description', () => {
  it('names the graph from its range, tick spacing and plotted elements', () => {
    render(
      <NumberLineGraph
        {...graphProps}
        elements={[
          { type: 'point', pointType: 'full', position: 2 },
          { type: 'point', pointType: 'empty', position: 5 },
          { type: 'line', leftPoint: 'full', rightPoint: 'empty', position: { left: 1, right: 4 } },
        ]}
      />,
    );

    expect(
      screen.getByRole('img', {
        name: 'Number line from 0 to 10, with a tick every 1. Plotted: 2 points, 1 line.',
      }),
    ).toBeInTheDocument();
  });

  it('says when nothing is plotted', () => {
    render(<NumberLineGraph {...graphProps} elements={[]} />);

    expect(
      screen.getByRole('img', { name: 'Number line from 0 to 10, with a tick every 1. Nothing is plotted.' }),
    ).toBeInTheDocument();
  });

  it('states values as fractions in fraction mode', () => {
    expect(
      describeNumberLine({
        domain: { min: 0, max: 2 },
        ticks: { minor: 0.25, major: 0.5 },
        width: 600,
        fraction: true,
        elements: [{ type: 'ray' }],
      }),
    ).toBe('Number line from 0 to 2, with a tick every 1/4. Plotted: 1 ray.');
  });

  it('states the tick spacing as drawn when the width limits it', () => {
    // A 600px line over 0..100 cannot draw a tick every 0.1, so the ticks widen to the limit.
    expect(
      describeNumberLine({ domain: { min: 0, max: 100 }, ticks: { minor: 0.1, major: 1 }, width: 600, elements: [] }),
    ).toBe('Number line from 0 to 100, with a tick every 1.667. Nothing is plotted.');
  });

  it('describes the graph in the item language', () => {
    expect(
      describeNumberLine({
        ...graphProps,
        elements: [{ type: 'point' }, { type: 'ray' }, { type: 'ray' }],
        language: 'es_ES',
      }),
    ).toBe('Recta numérica de 0 a 10, con una marca cada 1. En la recta: 1 punto, 2 rayos.');
  });
});
