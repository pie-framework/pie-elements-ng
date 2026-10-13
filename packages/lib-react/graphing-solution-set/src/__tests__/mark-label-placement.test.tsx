import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { createGraphProps } from '@pie-lib/plot';

import MarkLabel from '../mark-label';

const axis = { min: 0, max: 10, step: 1, labelStep: 1 };
const graphProps = createGraphProps(axis, axis, { width: 400, height: 400 }, () => null);

// happy-dom does no layout: text is 8px a character, and an input is its style width plus 10px of
// padding and border, 24px tall
const boxOf = (el: Element): { width: number; height: number } =>
  el instanceof HTMLInputElement
    ? { width: (Number.parseFloat(el.style.width) || 0) + 10, height: 24 }
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

// how far the label's box reaches past each edge of the graph
const overflow = () => {
  const input = screen.getByRole('textbox');
  let placed: HTMLElement | null = input;
  while (placed && placed.style.position !== 'fixed') {
    placed = placed.parentElement;
  }
  if (!placed) {
    throw new Error('no positioned label');
  }
  const left = Number.parseFloat(placed.style.left);
  const top = Number.parseFloat(placed.style.top);
  const { width, height } = boxOf(input);
  const { scale } = graphProps;

  return {
    left: Math.max(0, scale.x(axis.min) - left),
    right: Math.max(0, left + width - scale.x(axis.max)),
    top: Math.max(0, scale.y(axis.max) - top),
    bottom: Math.max(0, top + height - scale.y(axis.min)),
  };
};

describe('graphing-solution-set mark label placement', () => {
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
  });

  it.each([
    ['at the right edge', { x: 10, y: 5 }],
    ['just inside the right edge', { x: 9, y: 5 }],
    ['at the bottom edge', { x: 5, y: 0 }],
  ])('places a label %s inside the graph once it is sized', (_, point) => {
    render(
      <MarkLabel
        disabled
        graphProps={graphProps}
        inputRef={() => {}}
        onChange={() => {}}
        mark={{ ...point, label: 'Region R' }}
      />,
    );
    layout();

    expect(overflow()).toEqual({ left: 0, right: 0, top: 0, bottom: 0 });
  });
});
