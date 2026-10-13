import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import Chart from '../chart';

const data = [
  { label: 'Apples', value: 2, interactive: true, editable: false },
  { label: 'Pears', value: 3, interactive: true, editable: false },
];

const renderChart = (language?: string) =>
  render(
    <Chart
      chartType="bar"
      data={data}
      domain={{ label: 'Fruit' }}
      range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
      size={{ width: 300, height: 300 }}
      onDataChange={() => {}}
      language={language}
    />,
  );

describe('charting category label inputs', () => {
  it('names each category input by its position', () => {
    renderChart();

    expect(screen.getByRole('textbox', { name: 'Category 1 label' })).toHaveValue('Apples');
    expect(screen.getByRole('textbox', { name: 'Category 2 label' })).toHaveValue('Pears');
  });

  it('names the inputs in the item language', () => {
    renderChart('es_ES');

    expect(screen.getByRole('textbox', { name: 'Etiqueta de la categoría 1' })).toHaveValue('Apples');
  });
});
