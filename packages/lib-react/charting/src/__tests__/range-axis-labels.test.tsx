import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { color } from '@pie-lib/render-ui';

// MathJax typesets what the label holds; it does not load here
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

const { default: Chart } = await import('../chart');

const data = [{ label: 'Apples', value: 2, interactive: true, editable: false }];

const renderChart = (range: Record<string, number>) =>
  render(
    <Chart
      chartType="bar"
      data={data}
      domain={{ label: 'Fruit' }}
      range={{ label: 'Count', ...range }}
      size={{ width: 300, height: 300 }}
      onDataChange={() => {}}
    />,
  );

const rangeLabels = (container: HTMLElement) =>
  [...container.querySelectorAll<HTMLElement>('[data-range-label]')];

// the numbers on the range axis are typeset as math, like the numeric category labels (PIE-1249)
describe('the range axis labels', () => {
  it('are each written as math', () => {
    const { container } = renderChart({ min: 0, max: 3, step: 1, labelStep: 1 });

    expect(rangeLabels(container).map((label) => label.textContent)).toEqual(['\\(0\\)', '\\(1\\)', '\\(2\\)', '\\(3\\)']);
  });

  it('write negative and decimal values as math too', () => {
    const { container } = renderChart({ min: -1, max: 0.5, step: 0.5, labelStep: 0.5 });

    expect(rangeLabels(container).map((label) => label.textContent)).toEqual([
      '\\(-1\\)',
      '\\(-0.5\\)',
      '\\(0\\)',
      '\\(0.5\\)',
    ]);
  });

  // the axis calls its tick component as a function, so a hook in it counts against the axis: changing the
  // number of ticks (max value, grid interval, label interval) changed the number of hooks (PIE-1350)
  it('can change in number without breaking the chart', () => {
    const chart = (range: Record<string, number>) => (
      <Chart
        chartType="bar"
        data={data}
        domain={{ label: 'Fruit' }}
        range={{ label: 'Count', ...range }}
        size={{ width: 300, height: 300 }}
        onDataChange={() => {}}
      />
    );
    const { container, rerender } = render(chart({ min: 0, max: 3, step: 1, labelStep: 1 }));

    expect(() => rerender(chart({ min: 0, max: 6, step: 1, labelStep: 1 }))).not.toThrow();
    expect(rangeLabels(container)).toHaveLength(7);
    expect(() => rerender(chart({ min: 0, max: 6, step: 2, labelStep: 2 }))).not.toThrow();
    expect(rangeLabels(container)).toHaveLength(4);
  });

  it('are the color of the category labels', () => {
    const { container } = renderChart({ min: 0, max: 3, step: 1, labelStep: 1 });

    expect(getComputedStyle(rangeLabels(container)[0]).color).toBe(color.defaults.TEXT);
  });
});
