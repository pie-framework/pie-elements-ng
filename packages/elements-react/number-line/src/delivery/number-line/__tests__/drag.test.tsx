import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import NumberLineGraph from '../graph/index';

const noop = () => {};

const graphProps = {
  domain: { min: 0, max: 10 },
  ticks: { minor: 1, major: 2 },
  width: 600,
  height: 150,
  onToggleElement: noop,
  onAddElement: noop,
  onDeselectElements: noop,
};

// the draggable <g> of each point, i.e. the ones whose own children are the point's circles
const pointHandles = (container: HTMLElement) =>
  [...container.querySelectorAll('g[aria-roledescription]')].filter((g) => g.querySelector(':scope > circle'));

// dnd-kit's keyboard sensor: Space picks up, each arrow moves 25px, Space drops.
// It only starts listening for the arrows on the timeout after the pick-up.
const keyboardDrag = async (handle: Element, presses: number) => {
  await act(async () => {
    fireEvent.keyDown(handle, { code: 'Space' });
    await new Promise((resolve) => setTimeout(resolve));
  });
  for (let i = 0; i < presses; i++) {
    await act(async () => {
      fireEvent.keyDown(document, { code: 'ArrowRight' });
    });
  }
  await act(async () => {
    fireEvent.keyDown(document, { code: 'Space' });
  });
};

describe('number line dragging', () => {
  it('moves only the dragged endpoint when another line has an endpoint at the same value', async () => {
    const onMoveElement = vi.fn();
    const { container } = render(
      <NumberLineGraph
        {...graphProps}
        onMoveElement={onMoveElement}
        elements={[
          { type: 'line', leftPoint: 'full', rightPoint: 'full', position: { left: 1, right: 4 } },
          { type: 'line', leftPoint: 'full', rightPoint: 'full', position: { left: 1, right: 6 } },
        ]}
      />,
    );

    // [line 0 left, line 0 right, line 1 left, line 1 right]
    await keyboardDrag(pointHandles(container)[0], 3);

    expect(onMoveElement).toHaveBeenCalledTimes(1);
    expect(onMoveElement.mock.calls[0][0]).toBe(0);
    expect(onMoveElement.mock.calls[0][2]).toEqual({ left: 2, right: 4 });
  });

  it('moves only the dragged ray when another ray starts at the same value', async () => {
    const onMoveElement = vi.fn();
    const { container } = render(
      <NumberLineGraph
        {...graphProps}
        onMoveElement={onMoveElement}
        elements={[
          { type: 'ray', direction: 'positive', pointType: 'full', position: 3 },
          { type: 'ray', direction: 'negative', pointType: 'empty', position: 3 },
        ]}
      />,
    );

    await keyboardDrag(pointHandles(container)[1], 3);

    expect(onMoveElement).toHaveBeenCalledTimes(1);
    expect(onMoveElement.mock.calls[0][0]).toBe(1);
    expect(onMoveElement.mock.calls[0][2]).toBe(4);
  });
});
