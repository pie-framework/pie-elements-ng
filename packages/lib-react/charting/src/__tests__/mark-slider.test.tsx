import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Chart from '../chart';
import chartTypes from '../chart-types';

// a fraction label renders through MathJax, which does not load here
vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({ renderMath: () => {} }));

// the element passes its chart types, as the delivery and authoring views do
const charts = [
  chartTypes.Bar(),
  chartTypes.Histogram(),
  chartTypes.LineDot(),
  chartTypes.LineCross(),
  chartTypes.DotPlot(),
  chartTypes.LinePlot(),
];

type Category = { label: string; value: number; interactive?: boolean; editable?: boolean };

const fruit = (overrides: Partial<Category> = {}): Category[] => [
  { label: 'Apples', value: 2, interactive: true, editable: false, ...overrides },
  { label: '<p>Pears</p>', value: 3, interactive: true, editable: false, ...overrides },
];

// a host that keeps the data the chart reports, as a player does
const ChartHost = ({
  initial,
  onDataChange,
  ...props
}: {
  initial: Category[];
  onDataChange: (data: Category[]) => void;
  [prop: string]: unknown;
}) => {
  const [data, setData] = React.useState(initial);

  return (
    <Chart
      chartType="bar"
      charts={charts}
      data={data}
      domain={{ label: 'Fruit' }}
      range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
      size={{ width: 300, height: 300 }}
      onDataChange={(next: Category[]) => {
        onDataChange(next.map((d) => ({ ...d })));
        setData(next.map((d) => ({ ...d })));
      }}
      {...props}
    />
  );
};

const renderChart = (props: { initial?: Category[]; [prop: string]: unknown } = {}) => {
  const onDataChange = vi.fn();
  const { initial = fruit(), ...rest } = props;
  const view = render(<ChartHost initial={initial} onDataChange={onDataChange} {...rest} />);

  return { ...view, onDataChange };
};

const lastValue = (onDataChange: ReturnType<typeof vi.fn>, index = 0) =>
  onDataChange.mock.calls[onDataChange.mock.calls.length - 1][0][index].value;

describe.each(['bar', 'histogram', 'lineDot', 'lineCross', 'dotPlot', 'linePlot'])('%s marks', (chartType) => {
  it('are sliders named by their category, with their value and range', () => {
    renderChart({ chartType });

    const apples = screen.getByRole('slider', { name: 'Apples' });

    expect(apples).toHaveAttribute('tabindex', '0');
    expect(apples).toHaveAttribute('aria-valuenow', '2');
    expect(apples).toHaveAttribute('aria-valuemin', '0');
    expect(apples).toHaveAttribute('aria-valuemax', '5');
    expect(apples).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByRole('slider', { name: 'Pears' })).toHaveAttribute('aria-valuenow', '3');
  });

  it('change their value with the arrow keys through the change callback', () => {
    const { onDataChange } = renderChart({ chartType });
    const apples = screen.getByRole('slider', { name: 'Apples' });

    fireEvent.keyDown(apples, { key: 'ArrowUp' });
    expect(lastValue(onDataChange)).toBe(3);

    fireEvent.keyDown(apples, { key: 'ArrowRight' });
    expect(lastValue(onDataChange)).toBe(4);

    fireEvent.keyDown(apples, { key: 'ArrowDown' });
    fireEvent.keyDown(apples, { key: 'ArrowLeft' });
    expect(lastValue(onDataChange)).toBe(2);
    expect(onDataChange).toHaveBeenCalledTimes(4);

    // the slider stays mounted through the changes, so it keeps focus
    expect(screen.getByRole('slider', { name: 'Apples' })).toBe(apples);
    expect(apples).toHaveAttribute('aria-valuenow', '2');
  });

  it('go to the ends of the range with Home and End, and stop there', () => {
    const { onDataChange } = renderChart({ chartType });
    const apples = screen.getByRole('slider', { name: 'Apples' });

    fireEvent.keyDown(apples, { key: 'End' });
    expect(lastValue(onDataChange)).toBe(5);

    fireEvent.keyDown(apples, { key: 'ArrowUp' });
    expect(onDataChange).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(apples, { key: 'Home' });
    expect(lastValue(onDataChange)).toBe(0);

    fireEvent.keyDown(apples, { key: 'ArrowDown' });
    expect(onDataChange).toHaveBeenCalledTimes(2);
    expect(apples).toHaveAttribute('aria-valuenow', '0');
  });

  it('are no sliders and take no focus when read-only', () => {
    const { container } = renderChart({ chartType, initial: fruit({ interactive: false }) });

    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(container.querySelectorAll('g[tabindex]')).toHaveLength(0);
  });

  it('are no sliders and take no focus when the chart is disabled', () => {
    const { container } = renderChart({ chartType, disabled: true });

    expect(screen.queryAllByRole('slider')).toHaveLength(0);
    expect(container.querySelectorAll('g[tabindex]')).toHaveLength(0);
  });
});

describe('chart mark sliders', () => {
  it('leave keys they do not handle to the page', () => {
    const { onDataChange } = renderChart();
    const apples = screen.getByRole('slider', { name: 'Apples' });

    expect(fireEvent.keyDown(apples, { key: 'Tab' })).toBe(true);
    expect(fireEvent.keyDown(apples, { key: 'PageUp' })).toBe(true);
    expect(onDataChange).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(apples, { key: 'ArrowUp' })).toBe(false);
  });

  it('take the labelled tick interval as the Page Up and Page Down step', () => {
    const { onDataChange } = renderChart({ range: { min: 0, max: 20, step: 1, labelStep: 5 } });
    const apples = screen.getByRole('slider', { name: 'Apples' });

    fireEvent.keyDown(apples, { key: 'PageUp' });
    expect(lastValue(onDataChange)).toBe(5);

    fireEvent.keyDown(apples, { key: 'PageUp' });
    fireEvent.keyDown(apples, { key: 'PageDown' });
    expect(lastValue(onDataChange)).toBe(5);
  });

  it('step by the range step', () => {
    const { onDataChange } = renderChart({
      initial: [{ label: 'Apples', value: 0.5, interactive: true }],
      range: { min: 0, max: 1, step: 0.25, labelStep: 0.5 },
    });
    const apples = screen.getByRole('slider', { name: 'Apples' });

    fireEvent.keyDown(apples, { key: 'ArrowUp' });
    expect(lastValue(onDataChange)).toBe(0.75);

    fireEvent.keyDown(apples, { key: 'ArrowDown' });
    fireEvent.keyDown(apples, { key: 'ArrowDown' });
    expect(lastValue(onDataChange)).toBe(0.25);
  });

  it('are named by position when the category has no label', () => {
    renderChart({ initial: [{ label: '', value: 1, interactive: true }] });

    expect(screen.getByRole('slider', { name: 'Category 1' })).toBeInTheDocument();
  });

  it('are named by position in the item language', () => {
    renderChart({ initial: [{ label: '', value: 1, interactive: true }], language: 'es_ES' });

    expect(screen.getByRole('slider', { name: 'Categoría 1' })).toBeInTheDocument();
  });

  it('are sliders for every category while the author defines the chart', () => {
    renderChart({ initial: fruit({ interactive: false }), defineChart: true });

    expect(screen.getAllByRole('slider')).toHaveLength(2);
  });
});

describe('fraction category labels', () => {
  const fraction = (editable: boolean) => [{ label: '1/2', value: 2, interactive: true, editable }];

  it.each(['Enter', ' '])('open for editing on %j', (key) => {
    renderChart({ initial: fraction(true) });

    const label = screen.getByRole('button', { name: 'Category 1 label: 1/2' });

    expect(label).toHaveAttribute('tabindex', '0');
    expect(screen.queryByRole('textbox', { name: 'Category 1 label' })).not.toBeInTheDocument();

    fireEvent.keyDown(label, { key });

    const input = screen.getByRole('textbox', { name: 'Category 1 label' });

    expect(input).toHaveValue('1/2');
    expect(input).toHaveFocus();
  });

  it('open for editing on a click', () => {
    renderChart({ initial: fraction(true) });

    fireEvent.click(screen.getByRole('button', { name: 'Category 1 label: 1/2' }));

    expect(screen.getByRole('textbox', { name: 'Category 1 label' })).toHaveValue('1/2');
  });

  it('are named in the item language', () => {
    renderChart({ initial: fraction(true), language: 'es_ES' });

    expect(screen.getByRole('button', { name: 'Etiqueta de la categoría 1: 1/2' })).toBeInTheDocument();
  });

  it('are no control when the label is not editable', () => {
    renderChart({ initial: fraction(false) });

    expect(screen.queryByRole('button', { name: /Category 1 label/ })).not.toBeInTheDocument();
  });
});
