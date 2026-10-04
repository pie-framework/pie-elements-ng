import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import Chart from '../chart';
import { getRotatedLabelOverhang } from '../utils';

type Category = { label: string; value: number; interactive: boolean; editable: boolean };

const categories = (labels: string[]): Category[] =>
  labels.map((label, i) => ({ label, value: i + 1, interactive: true, editable: false }));

// 300px across five bars leaves each bar 46px wide; at 8px a character a label of six or more
// characters does not fit
const long = categories(['Chocolate chip', 'Oatmeal raisin', 'Peanut butter', 'Snickerdoodle', 'Double fudge']);
const short = categories(['A', 'B', 'C', 'D', 'E']);
const longer = categories(['Chocolate chip cookie', 'Oatmeal raisin', 'Peanut butter', 'Snickerdoodle', 'Double fudge']);

// happy-dom does no layout: text is 8px a character, and an input is its style width
const boxOf = (el: Element): { width: number; height: number } =>
  el instanceof HTMLInputElement
    ? { width: Number.parseFloat(el.style.width) || 0, height: 24 }
    : { width: (el.textContent || '').length * 8, height: 16 };

// reports each target whose size changed since its last report, as a browser does after layout
class LayoutResizeObserver implements ResizeObserver {
  static observers = new Set<LayoutResizeObserver>();
  private readonly callback: ResizeObserverCallback;
  private readonly reported = new Map<Element, string>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    this.reported.set(target, '');
    LayoutResizeObserver.observers.add(this);
  }

  unobserve(target: Element): void {
    this.reported.delete(target);
  }

  disconnect(): void {
    this.reported.clear();
    LayoutResizeObserver.observers.delete(this);
  }

  targets(): Element[] {
    return [...this.reported.keys()];
  }

  deliver(): void {
    const entries: ResizeObserverEntry[] = [];
    this.reported.forEach((last, target) => {
      const contentRect = target.getBoundingClientRect();
      const size = `${contentRect.width}x${contentRect.height}`;
      if (size !== last) {
        this.reported.set(target, size);
        entries.push({ target, contentRect, borderBoxSize: [], contentBoxSize: [], devicePixelContentBoxSize: [] });
      }
    });
    if (entries.length) {
      this.callback(entries, this);
    }
  }
}

const layout = () => act(() => LayoutResizeObserver.observers.forEach((observer) => observer.deliver()));

// inputs some live observer is watching; the hidden label that sizes the longest category is one
const observedInputs = () =>
  [...LayoutResizeObserver.observers].flatMap((o) => o.targets()).filter((t) => t instanceof HTMLInputElement);

const labelInputs = () => screen.getAllByRole('textbox', { name: /^Category \d label$/ });

// the rotation of each category label, from the transform on the box around its input
const angles = () =>
  labelInputs().map((input) => Number(/rotate\((-?\d+)deg\)/.exec(input.parentElement?.style.transform || '')?.[1] ?? 0));

// the chart edits its data in place, so each render gets its own copy and each change a new array
// the height of the chart's svg, which holds the room reserved below the category axis
const reservedHeight = (container: HTMLElement) => Number(container.querySelector('svg[role="group"]')?.getAttribute('height'));

const EditableChart = ({ initial }: { initial: Category[] }) => {
  const [data, setData] = useState(() => initial.map((c) => ({ ...c })));

  return (
    <Chart
      chartType="bar"
      data={data}
      defineChart
      domain={{ label: 'Cookie' }}
      range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
      size={{ width: 300, height: 300 }}
      onDataChange={(next: Category[]) => setData([...next])}
    />
  );
};

const renderChart = (data: Category[], defineChart = false) =>
  render(
    defineChart ? (
      <EditableChart initial={data} />
    ) : (
      <Chart
        chartType="bar"
        data={data.map((c) => ({ ...c }))}
        domain={{ label: 'Cookie' }}
        range={{ label: 'Count', min: 0, max: 5, step: 1, labelStep: 1 }}
        size={{ width: 300, height: 300 }}
        onDataChange={() => {}}
      />
    ),
  );

const editLabel = (index: number, label: string) => {
  const input = labelInputs()[index];
  fireEvent.change(input, { target: { value: label } });
  fireEvent.blur(input);
};

describe('charting category label rotation', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', LayoutResizeObserver);
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const { width, height } = boxOf(this);
      return new DOMRect(0, 0, width, height);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    LayoutResizeObserver.observers.clear();
  });

  it.each([
    ['read-only', false],
    ['editable', true],
  ])('rotates %s labels wider than their bars once they are sized', (_, defineChart) => {
    renderChart(long, defineChart);
    layout();

    expect(angles()).toEqual([25, 25, 25, 25, 25]);
  });

  it.each([
    ['read-only', false],
    ['editable', true],
  ])('keeps %s labels that fit their bars horizontal', (_, defineChart) => {
    renderChart(short, defineChart);
    layout();

    expect(angles()).toEqual([0, 0, 0, 0, 0]);
  });

  it('rotates the labels when one is edited to no longer fit, and straightens them when it fits again', () => {
    renderChart(short, true);
    layout();

    editLabel(2, 'Peanut butter');
    layout();

    expect(angles()).toEqual([25, 25, 25, 25, 25]);

    editLabel(2, 'C');
    layout();

    expect(angles()).toEqual([0, 0, 0, 0, 0]);
  });

  it('keeps measuring after StrictMode remounts the chart', () => {
    render(
      <React.StrictMode>
        <EditableChart initial={short} />
      </React.StrictMode>,
    );
    layout();

    editLabel(2, 'Peanut butter');
    layout();

    expect(angles()).toEqual([25, 25, 25, 25, 25]);
  });

  it('stops measuring when the chart unmounts', () => {
    const { unmount } = renderChart(long);
    layout();

    expect(observedInputs()).toHaveLength(1);

    unmount();

    expect(observedInputs()).toHaveLength(0);
  });

  it('renders without ResizeObserver', () => {
    vi.stubGlobal('ResizeObserver', undefined);

    renderChart(long);

    expect(labelInputs()).toHaveLength(5);
  });

  describe('room below the axis', () => {
    // the hidden label sizing the longest category is its text width plus AutosizeInput's 2px, and
    // 24px tall; each bar is 46px wide, for which the chart reserves 15px below the axis
    const overhangOf = (label: string) => getRotatedLabelOverhang(label.length * 8 + 2, 24, 25);

    it.each([
      ['read-only', false],
      ['editable', true],
    ])('grows by how much lower the rotated %s labels reach', (_, defineChart) => {
      const { container } = renderChart(long, defineChart);
      const unrotated = reservedHeight(container);

      layout();

      expect(reservedHeight(container)).toBe(unrotated - 15 + overhangOf('Chocolate chip'));
    });

    it('grows with the rotated label height', () => {
      const first = renderChart(long);
      layout();
      const longHeight = reservedHeight(first.container);
      first.unmount();

      const second = renderChart(longer);
      layout();

      expect(reservedHeight(second.container) - longHeight).toBe(
        overhangOf('Chocolate chip cookie') - overhangOf('Chocolate chip'),
      );
    });

    it('stays the same when the labels fit', () => {
      const { container } = renderChart(short);
      const unrotated = reservedHeight(container);

      layout();

      expect(reservedHeight(container)).toBe(unrotated);
    });

    it('shrinks back when an edited label fits again', () => {
      const { container } = renderChart(short, true);
      layout();
      const unrotated = reservedHeight(container);

      editLabel(2, 'Peanut butter');
      layout();

      expect(reservedHeight(container)).toBeGreaterThan(unrotated);

      editLabel(2, 'C');
      layout();

      expect(reservedHeight(container)).toBe(unrotated);
    });
  });
});

describe('getRotatedLabelOverhang', () => {
  it('is nothing for a horizontal label', () => {
    expect(getRotatedLabelOverhang(160, 24, 0)).toBe(0);
  });

  it('is how much lower the far bottom corner sits once rotated about the middle of the left edge', () => {
    const radians = (25 * Math.PI) / 180;
    // the bottom right corner, 160px along and 12px below the pivot, against the horizontal bottom edge
    const lowered = 160 * Math.sin(radians) + 12 * Math.cos(radians) - 12;

    expect(getRotatedLabelOverhang(160, 24, 25)).toBe(Math.ceil(lowered));
  });
});
