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


// each type shows its rollover differently: a drag icon on bars, an outline square on the others
const rollover = (slider: HTMLElement) => !!slider.querySelector('circle[r="22"], rect[fill="none"][stroke]');

// the element that takes the mouse down on a mark
const grabber = (slider: HTMLElement) => (slider.querySelector('ellipse') ?? slider.querySelector('circle')) as Element;

describe.each(['bar', 'histogram', 'lineDot', 'lineCross', 'dotPlot', 'linePlot'])('%s hover while dragging', (chartType) => {
  const setup = () => {
    renderChart({ chartType });

    return { apples: screen.getByRole('slider', { name: 'Apples' }), pears: screen.getByRole('slider', { name: 'Pears' }) };
  };

  it('keeps the dragged mark hovered after the pointer leaves it, and no other mark gets hovered', () => {
    const { apples, pears } = setup();

    fireEvent.mouseEnter(grabber(apples));
    expect(rollover(apples)).toBe(true);

    fireEvent.mouseDown(grabber(apples), { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseMove(grabber(apples), { clientX: 10, clientY: 60, button: 0 });
    fireEvent.mouseLeave(grabber(apples));
    fireEvent.mouseMove(document.body, { clientX: 50, clientY: 40, button: 0 });

    expect(rollover(apples)).toBe(true);

    fireEvent.mouseEnter(grabber(pears));
    fireEvent.mouseMove(document.body, { clientX: 60, clientY: 40, button: 0 });

    expect(rollover(pears)).toBe(false);
    expect(rollover(apples)).toBe(true);
  });

  it('drops the hover when the drag ends with the pointer away from the mark', () => {
    const { apples } = setup();

    fireEvent.mouseEnter(grabber(apples));
    fireEvent.mouseDown(grabber(apples), { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseMove(grabber(apples), { clientX: 10, clientY: 60, button: 0 });
    fireEvent.mouseLeave(grabber(apples));
    fireEvent.mouseMove(document.body, { clientX: 50, clientY: 40, button: 0 });
    fireEvent.mouseUp(document.body, { clientX: 50, clientY: 40, button: 0 });

    expect(rollover(apples)).toBe(false);
  });
});
