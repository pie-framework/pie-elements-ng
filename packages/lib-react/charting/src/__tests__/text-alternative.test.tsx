import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import Chart from '../chart';

const data = [
  { label: 'Apples', value: 2, interactive: true, editable: false },
  { label: 'Pears & plums', value: 3, interactive: true, editable: false },
];

const renderChart = (props: object = {}) =>
  render(
    <Chart
      chartType="bar"
      data={data}
      domain={{ label: 'Fruit' }}
      range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
      size={{ width: 300, height: 300 }}
      onDataChange={() => {}}
      {...props}
    />,
  );

describe('charting text alternative', () => {
  it('names the chart by its type and describes its categories and values', () => {
    renderChart();

    expect(screen.getByRole('group', { name: 'Bar chart' })).toHaveAccessibleDescription(
      'Bar chart. 2 categories: Apples, Pears & plums. Count from 0 to 5.',
    );
  });

  it('names the chart by its title when it has one', () => {
    renderChart({ title: '<p>Fruit <strong>sold</strong></p>', chartType: 'histogram', range: { min: 0, max: 5 } });

    expect(screen.getByRole('group', { name: 'Fruit sold' })).toHaveAccessibleDescription(
      'Histogram. 2 categories: Apples, Pears & plums. Values from 0 to 5.',
    );
  });

  it('describes a chart with no categories', () => {
    renderChart({ data: [] });

    expect(screen.getByRole('group', { name: 'Bar chart' })).toHaveAccessibleDescription(
      'Bar chart. No categories. Count from 0 to 5.',
    );
  });

  it('names and describes the chart in the item language', () => {
    renderChart({ language: 'es_ES', data: data.slice(0, 1) });

    expect(screen.getByRole('group', { name: 'Gráfico de barras' })).toHaveAccessibleDescription(
      'Gráfico de barras. 1 categoría: Apples. Count de 0 a 5.',
    );
  });
});
