import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { color } from '@pie-lib/render-ui';

import Chart from '../chart';

// a category a student added is editable; the others are not
const data = [
  { label: 'Apples', value: 2, interactive: true, editable: false },
  { label: 'New category', value: 0, interactive: true, editable: true },
];

describe('charting category label colors', () => {
  // the labels sit on the chart's white background, so a page that themes its inputs must not recolor them
  it.each([
    ['an editable label, as a category a student added is', 2, color.defaults.TEXT],
    ['a read-only label', 1, color.defaults.DISABLED_TEXT],
  ])('sets the color of %s', (_, position, expected) => {
    render(
      <Chart
        chartType="bar"
        data={data}
        domain={{ label: 'Fruit' }}
        range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
        size={{ width: 300, height: 300 }}
        onDataChange={() => {}}
      />,
    );

    const input = screen.getByRole('textbox', { name: `Category ${position} label` });

    expect(input.style.color).toBe(expected);
  });
});
