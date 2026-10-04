import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { describePlottedElements, labelNumberLine } from '../graph/description';
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

describe('number line text alternative', () => {
  it('names the graph by its range and tick spacing, and describes what is plotted', () => {
    render(
      <NumberLineGraph
        {...graphProps}
        elements={[
          { type: 'point', pointType: 'full', position: 2 },
          { type: 'line', leftPoint: 'full', rightPoint: 'empty', position: { left: 1, right: 4 } },
          { type: 'ray', direction: 'negative', pointType: 'empty', position: 7 },
        ]}
      />,
    );

    const graph = screen.getByRole('group', { name: 'Number line from 0 to 10, with a tick every 1' });
    expect(graph).toHaveAccessibleDescription(
      'Closed point at 2. Line from 1 (closed) to 4 (open). Ray from 7 (open) to the left.',
    );
  });

  it('says when nothing is plotted', () => {
    render(<NumberLineGraph {...graphProps} elements={[]} />);

    expect(screen.getByRole('group')).toHaveAccessibleDescription('Nothing is plotted.');
  });

  it('gives each graph its own description', () => {
    render(
      <>
        <NumberLineGraph {...graphProps} elements={[]} />
        <NumberLineGraph {...graphProps} elements={[{ type: 'point', pointType: 'empty', position: 3 }]} />
      </>,
    );

    const graphs = screen.getAllByRole('group');
    expect(new Set(graphs.map((graph) => graph.getAttribute('aria-describedby'))).size).toBe(2);
    expect(graphs[0]).toHaveAccessibleDescription('Nothing is plotted.');
    expect(graphs[1]).toHaveAccessibleDescription('Open point at 3.');
  });

  it('states values as fractions in fraction mode', () => {
    const context = { fraction: true };

    expect(
      labelNumberLine({ domain: { min: 0, max: 2 }, ticks: { minor: 0.25, major: 0.5 }, width: 600, ...context }),
    ).toBe('Number line from 0 to 2, with a tick every 1/4');
    expect(
      describePlottedElements([{ type: 'ray', direction: 'positive', pointType: 'full', position: 1.5 }], context),
    ).toBe('Ray from 3/2 (closed) to the right.');
  });

  it('states the tick spacing as drawn when the width limits it', () => {
    // A 600px line over 0..100 cannot draw a tick every 0.1, so the ticks widen to the limit.
    expect(labelNumberLine({ domain: { min: 0, max: 100 }, ticks: { minor: 0.1, major: 1 }, width: 600 })).toBe(
      'Number line from 0 to 100, with a tick every 1.667',
    );
  });

  it('describes the graph in the item language', () => {
    const language = 'es_ES';

    expect(labelNumberLine({ ...graphProps, language })).toBe('Recta numérica de 0 a 10, con una marca cada 1');
    expect(
      describePlottedElements(
        [
          { type: 'point', pointType: 'empty', position: 4 },
          { type: 'line', leftPoint: 'empty', rightPoint: 'full', position: { left: 2, right: 6 } },
        ],
        { language },
      ),
    ).toBe('Punto abierto en 4. Línea de 2 (abierto) a 6 (cerrado).');
  });
});
