import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';

import ChartComponent from '../chart';
import ChartType from '../chart-type';
import chartTypes from '../chart-types';

// Chart's propTypes leave out the evaluation fields a data point carries.
const Chart = ChartComponent as unknown as React.ComponentType<Record<string, unknown>>;

const incorrect = { value: 'incorrect', label: 'Incorrect' };

// Evaluated bars, so each draws its correct-answer icon and its drag handle.
const chart = (props: object = {}) => (
  <Chart
    chartType="bar"
    charts={[chartTypes.Bar()]}
    data={[
      { label: 'Apples', value: 2, interactive: true, editable: false, correctness: incorrect },
      { label: 'Pears', value: 3, interactive: true, editable: false, correctness: incorrect },
    ]}
    correctData={[
      { label: 'Apples', value: 4 },
      { label: 'Pears', value: 1 },
    ]}
    domain={{ label: 'Fruit' }}
    range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
    size={{ width: 300, height: 300 }}
    onDataChange={() => {}}
    {...props}
  />
);

const ids = (root: ParentNode) => [...root.querySelectorAll('[id]')].map((el) => el.id);

// Every id a mask or ARIA attribute points at.
const references = (root: ParentNode) =>
  [...root.querySelectorAll('*')].flatMap((el) => [
    ...['aria-labelledby', 'aria-describedby', 'aria-controls', 'for'].flatMap((name) =>
      (el.getAttribute(name) || '').split(/\s+/).filter(Boolean),
    ),
    ...[/url\(['"]?#([^'")]+)['"]?\)/.exec(el.getAttribute('mask') || '')?.[1]].filter((id): id is string => !!id),
  ]);

describe('charting ids', () => {
  it('stay unique when two charts share a page', () => {
    render(chart());
    render(chart());

    expect(ids(document).length).toBeGreaterThan(0);
    expect(new Set(ids(document)).size).toBe(ids(document).length);
  });

  it('resolve masks and descriptions inside their own chart', () => {
    const first = render(chart()).container;
    const second = render(chart()).container;

    for (const root of [first, second]) {
      const refs = references(root);
      // the chart mask and one mask per correct-answer icon
      expect(root.querySelectorAll('mask')).toHaveLength(3);
      for (const id of refs) {
        expect(root.querySelector(`[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('stay the same across re-renders', () => {
    const { container, rerender } = render(chart());
    const before = ids(container);

    rerender(chart({ title: 'Renamed' }));

    expect(ids(container)).toEqual(before);
  });
});

describe('chart type select ids', () => {
  const chartType = () => (
    <ChartType onChange={() => {}} value="bar" availableChartTypes={{ bar: 'Bar' }} chartTypeLabel="Chart type" />
  );

  it('stay unique when two configure panels share a page, and label their own select', () => {
    const first = render(chartType()).container;
    const second = render(chartType()).container;

    expect(new Set(ids(document)).size).toBe(ids(document).length);
    for (const root of [first, second]) {
      for (const id of references(root)) {
        expect(root.querySelector(`[id="${id}"]`)).not.toBeNull();
      }
    }
  });

  it('stay the same across re-renders', () => {
    const { container, rerender } = render(chartType());
    const before = ids(container);

    rerender(chartType());

    expect(ids(container)).toEqual(before);
  });
});
