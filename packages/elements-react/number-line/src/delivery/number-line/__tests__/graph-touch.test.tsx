import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import NumberLineGraph from '../graph/index';

const noop = () => {};

const graphProps = {
  domain: { min: 0, max: 10 },
  ticks: { minor: 1, major: 2 },
  width: 600,
  height: 100,
  onToggleElement: noop,
  onMoveElement: noop,
  onAddElement: noop,
  onDeselectElements: noop,
};

const elements = [
  { type: 'point', pointType: 'full', position: 2 },
  { type: 'line', leftPoint: 'full', rightPoint: 'full', position: { left: 5, right: 8 } },
];

/** Whether the graph cancels a touch that starts on `target`, as it does to keep it from the page. */
const touchStartIsCancelled = (target: Element) => {
  const event = new Event('touchstart', { bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event.defaultPrevented;
};

// Whether a browser then scrolls, zooms or keeps the drag is for page-gestures.touch.spec.ts.
describe('number line touch', () => {
  it('declares touch-action: manipulation on the svg', () => {
    render(<NumberLineGraph {...graphProps} elements={elements} />);

    expect(screen.getByRole('group')).toHaveStyle({ touchAction: 'manipulation' });
  });

  it('cancels a touchstart on a point, an endpoint or a line body', () => {
    const { container } = render(<NumberLineGraph {...graphProps} elements={elements} />);
    const circles = [...container.querySelectorAll('circle')];

    expect(circles.length).toBeGreaterThan(0);
    for (const circle of circles) {
      expect(touchStartIsCancelled(circle)).toBe(true);
    }
    expect(touchStartIsCancelled(container.querySelector('line.line-handle') as Element)).toBe(true);
  });

  it('leaves a touchstart off the handles to the page', () => {
    render(<NumberLineGraph {...graphProps} elements={elements} />);

    expect(touchStartIsCancelled(screen.getByRole('group'))).toBe(false);
  });

  it('leaves every touchstart to the page when disabled', () => {
    const { container } = render(<NumberLineGraph {...graphProps} elements={elements} disabled />);

    for (const circle of container.querySelectorAll('circle')) {
      expect(touchStartIsCancelled(circle)).toBe(false);
    }
    expect(touchStartIsCancelled(container.querySelector('line.line-handle') as Element)).toBe(false);
  });
});
