import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { describePlottedElements, labelNumberLine } from '../graph/description';
import NumberLineGraph from '../graph/index';

// Two element versions on a page each bundle their own lodash, whose uniqueId counters both
// start at 1; a constant reproduces that within this one module graph.
vi.mock('@pie-element/shared-lodash', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@pie-element/shared-lodash')>()),
  uniqueId: (prefix = '') => `${prefix}1`,
}));

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

  it('gives each graph its own drag instructions', () => {
    const point = [{ type: 'point', pointType: 'empty', position: 3 }];
    render(
      <>
        <NumberLineGraph {...graphProps} elements={point} />
        <NumberLineGraph {...graphProps} elements={point} />
      </>,
    );

    // dnd-kit's own `DndDescribedBy-<n>` counter restarts in each element bundle.
    const instructions = screen
      .getAllByRole('group')
      .map((graph) => graph.querySelector('[aria-roledescription]')?.getAttribute('aria-describedby'));
    expect(new Set(instructions).size).toBe(2);
    expect(instructions[0]).not.toMatch(/^DndDescribedBy-\d+$/);
  });

  it('keeps its description id across re-renders', () => {
    const { rerender } = render(<NumberLineGraph {...graphProps} elements={[]} />);
    const before = screen.getByRole('group').getAttribute('aria-describedby');

    rerender(<NumberLineGraph {...graphProps} elements={[{ type: 'point', pointType: 'full', position: 5 }]} />);

    expect(screen.getByRole('group').getAttribute('aria-describedby')).toBe(before);
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Closed point at 5.');
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

  it('states the correctness of each evaluated element in the description and marks it without colour', () => {
    const { container } = render(
      <NumberLineGraph
        {...graphProps}
        disabled
        elements={[
          { type: 'point', pointType: 'full', position: 2, correct: true },
          { type: 'line', leftPoint: 'full', rightPoint: 'empty', position: { left: 4, right: 6 }, correct: false },
          { type: 'ray', direction: 'positive', pointType: 'empty', position: 8 },
        ]}
      />,
    );

    expect(screen.getByRole('group')).toHaveAccessibleDescription(
      'Closed point at 2. Correct. Line from 4 (closed) to 6 (open). Incorrect. Ray from 8 (open) to the right.',
    );
    // one mark per judged element, none for the unjudged ray, none doubled on a line's two ends
    expect([...container.querySelectorAll('[data-correctness]')].map((m) => m.getAttribute('data-correctness'))).toEqual(
      ['correct', 'incorrect'],
    );
    expect(container.querySelectorAll('[data-correctness]')[0].closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('states correctness in the item language', () => {
    expect(
      describePlottedElements([{ type: 'point', pointType: 'full', position: 1, correct: false }], {
        language: 'es_ES',
      }),
    ).toBe('Punto cerrado en 1. Incorrecto.');
  });
});
