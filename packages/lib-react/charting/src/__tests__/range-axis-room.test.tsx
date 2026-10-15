import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';

// MathJax does not load here: typesetting a label puts in the container MathJax would, and happy-dom does
// no layout, so a typeset number is 9px a digit, about what MathJax draws
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({
  renderMath: (el: HTMLElement) => {
    const math = document.createElement('mjx-container');
    math.textContent = el.textContent;
    el.replaceChildren(math);
  },
}));

const { default: Chart } = await import('../chart');

const digitsOf = (el: Element) => (el.textContent || '').replace(/[^0-9]/g, '').length;
const realRect = Element.prototype.getBoundingClientRect;

beforeEach(() => {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return this.tagName.toLowerCase() === 'mjx-container'
      ? ({ x: 0, y: 0, top: 0, left: 0, right: digitsOf(this) * 9, bottom: 16, width: digitsOf(this) * 9, height: 16 } as DOMRect)
      : realRect.call(this);
  });
});

afterEach(() => vi.restoreAllMocks());

const data = [{ label: 'Apples', value: 2, interactive: true, editable: false }];

const renderChart = (max: number) =>
  render(
    <Chart
      chartType="bar"
      data={data}
      domain={{ label: 'Fruit' }}
      range={{ label: 'Count', min: 0, max, step: max / 2, labelStep: max / 2 }}
      size={{ width: 300, height: 300 }}
      onDataChange={() => {}}
    />,
  );

// where the plot starts, past the left label and the range axis labels
const plotLeft = (container: HTMLElement) => {
  const plot = [...container.querySelectorAll('g[transform^="translate("]')][0];
  return Number(/translate\(([-\d.]+)/.exec(plot.getAttribute('transform') || '')?.[1]);
};

// a range axis label too wide for the room beside the left label would run under it (PIE-1249)
describe('the room for the range axis labels', () => {
  it('stays as it is when the widest label fits', async () => {
    const { container } = renderChart(10);

    await waitFor(() => expect(container.querySelector('[data-range-label] mjx-container')).not.toBeNull());

    expect(plotLeft(container)).toBe(70);
  });

  it('grows by as much as the widest label is too wide', async () => {
    const { container } = renderChart(100);

    // "100" is 27px wide, 9px more than the room
    await waitFor(() => expect(plotLeft(container)).toBe(79));
  });
});
