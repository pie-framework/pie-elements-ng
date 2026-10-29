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

// a disabled mark is not a slider, so find the marks by their drag handles: the root of a mark is the
// largest ancestor of its handle that does not also hold the other mark's handle
const markRoot = (handle: Element, other: Element) => {
  let node = handle as HTMLElement;

  while (node.parentElement && !node.parentElement.contains(other)) {
    node = node.parentElement;
  }

  return node;
};

// the marks of each type are found by their drag handles: the bars and plots by the ellipse, the line types by
// the circle (a dot has a transparent ring and the dot itself, so its second mark starts at the third circle)
const handles = (chartType: string) => {
  const circles = Array.from(document.querySelectorAll('circle'));

  if (chartType === 'lineDot') return [circles[0], circles[2]];
  if (chartType === 'lineCross') return [circles[0], circles[1]];

  return Array.from(document.querySelectorAll('ellipse'));
};

describe.each(['bar', 'histogram', 'lineDot', 'lineCross', 'dotPlot', 'linePlot'])('%s hover when the marks are disabled', (chartType) => {
  it('does not leave the other marks unable to hover after a press on one', () => {
    renderChart({ chartType, disabled: true });
    const [first, second] = handles(chartType);
    const pears = markRoot(second, first);

    fireEvent.mouseDown(first, { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseEnter(second);

    // while the press is still held
    expect(rollover(pears)).toBe(true);

    fireEvent.mouseUp(first, { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseEnter(second);

    expect(rollover(pears)).toBe(true);
  });
});

describe.each(['bar', 'histogram', 'lineDot', 'lineCross', 'dotPlot', 'linePlot'])('%s hover around a drag', (chartType) => {
  it('lets a mark the pointer entered during another mark\'s drag take the hover when the drag ends', () => {
    renderChart({ chartType });
    const apples = screen.getByRole('slider', { name: 'Apples' });
    const pears = screen.getByRole('slider', { name: 'Pears' });

    fireEvent.mouseEnter(grabber(apples));
    fireEvent.mouseDown(grabber(apples), { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseMove(grabber(apples), { clientX: 10, clientY: 60, button: 0 });
    fireEvent.mouseLeave(grabber(apples));
    fireEvent.mouseEnter(grabber(pears));

    expect(rollover(pears)).toBe(false);

    fireEvent.mouseUp(document.body, { clientX: 10, clientY: 60, button: 0 });

    expect(rollover(pears)).toBe(true);
    expect(rollover(apples)).toBe(false);
  });

  it('does not leave the other marks unable to hover when the marks are disabled in the middle of a drag', () => {
    const initial = fruit();
    const onDataChange = vi.fn();
    const { rerender } = render(<ChartHost chartType={chartType} initial={initial} onDataChange={onDataChange} />);
    const apples = screen.getByRole('slider', { name: 'Apples' });

    fireEvent.mouseEnter(grabber(apples));
    fireEvent.mouseDown(grabber(apples), { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseMove(grabber(apples), { clientX: 10, clientY: 60, button: 0 });

    // an auto-submit locks the marks while one is being dragged
    rerender(<ChartHost chartType={chartType} initial={initial} onDataChange={onDataChange} disabled />);
    fireEvent.mouseUp(document.body, { clientX: 10, clientY: 60, button: 0 });
    rerender(<ChartHost chartType={chartType} initial={initial} onDataChange={onDataChange} />);

    const pears = screen.getByRole('slider', { name: 'Pears' });

    fireEvent.mouseEnter(grabber(pears));

    expect(rollover(pears)).toBe(true);
  });
});

// the dot has a transparent ring around it that is a sibling of the dot, so going from the ring onto the dot
// moves between two elements of the mark, not out of it
describe('lineDot hover when the pointer moves from the ring onto the dot', () => {
  it('keeps the hover after the dot is dragged and released', () => {
    renderChart({ chartType: 'lineDot' });
    const apples = screen.getByRole('slider', { name: 'Apples' });
    const [ring, dot] = Array.from(apples.querySelectorAll('circle'));

    fireEvent.mouseEnter(ring);
    fireEvent.mouseOut(ring, { relatedTarget: dot });
    fireEvent.mouseOver(dot, { relatedTarget: ring });
    fireEvent.mouseDown(dot, { clientX: 10, clientY: 100, button: 0 });
    fireEvent.mouseMove(dot, { clientX: 10, clientY: 60, button: 0 });
    fireEvent.mouseUp(dot, { clientX: 10, clientY: 60, button: 0 });

    expect(rollover(apples)).toBe(true);
  });
});
