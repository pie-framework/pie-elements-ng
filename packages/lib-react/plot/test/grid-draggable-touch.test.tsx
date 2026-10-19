/**
 * `gridDraggable` backs every drag handle in charting, graphing and
 * graphing-solution-set, so "can a finger move a handle?" is one question asked
 * once here rather than per element.
 *
 * The mouse and touch paths through react-draggable v4 are not the same code
 * path. Mouse events arrive as React synthetic events via `cloneElement`; touch
 * arrives through a native, non-passive `touchstart` listener registered in
 * `componentDidMount`, and `handleDragStart` forwards that *raw DOM event* to
 * the `onMouseDown` prop. Anything that assumes a synthetic event there - a bare
 * `e.nativeEvent` read, say - throws before the drag starts, and the handle is
 * simply inert on an iPad while every desktop test still passes. That is
 * PIE-1074, fixed with nothing in CI to catch its regression; this suite is that
 * missing guard.
 *
 * These tests drive the touch path with real DOM events (see
 * `@pie-lib/test-utils`'s touch helpers) so that asymmetry is visible.
 */

import { describe, expect, it, vi } from 'vitest';
import React from 'react';
// `@pie-lib/test-utils` re-exports Testing Library alongside the touch helpers,
// so a package needs only the one dev dependency to write component tests.
import { fireEvent, render, touchDrag, touchEnd, touchStart } from '@pie-lib/test-utils';

import * as graphProps from '../src/graph-props.js';
import { gridDraggable } from '../src/grid-draggable.js';
import * as utils from '../src/utils.js';

const SIZE = { width: 500, height: 500 };
const DOMAIN = { min: 0, max: 10, step: 1 };
const RANGE = { min: 0, max: 10, step: 1 };

/**
 * 10 units over 500px, so one grid step is 50px. react-draggable snaps deltas to
 * that grid, which is why the drags below move in multiples of 50.
 */
const PX_PER_STEP = SIZE.height / (RANGE.max - RANGE.min);

const HANDLE_TEST_ID = 'handle';

type HandleProps = {
  x: number;
  y: number;
  onMouseDown?: React.MouseEventHandler;
  onMouseUp?: React.MouseEventHandler;
  onTouchEnd?: React.TouchEventHandler;
};

/**
 * Stands in for charting's `DragHandle` / graphing's point: a leaf that forwards
 * the handlers react-draggable clones onto it. Only the handlers are forwarded -
 * the rest of `gridDraggable`'s props are not DOM attributes.
 */
function Handle({ x, y, onMouseDown, onMouseUp, onTouchEnd }: HandleProps) {
  return (
    <div
      data-testid={HANDLE_TEST_ID}
      data-x={x}
      data-y={y}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onTouchEnd={onTouchEnd}
    />
  );
}

/** The same y-axis configuration charting's bar/plot drag handles use. */
const DraggableHandle = gridDraggable({
  axis: 'y',
  fromDelta: (props: HandleProps, delta: { x: number; y: number }) => {
    delta.x = 0;
    return utils.point(props).add(utils.point(delta)).y;
  },
  bounds: (props: HandleProps, { domain, range }: { domain: typeof DOMAIN; range: typeof RANGE }) =>
    utils.bounds({ left: 0, top: props.y, bottom: props.y, right: 0 }, domain, range),
  anchorPoint: (props: HandleProps) => ({ x: props.x, y: props.y }),
})(Handle);

/**
 * `onDrag` reports a value relative to the handle's current `y` prop, one grid
 * step at a time, so a live drag only accumulates if the owner feeds the value
 * back - which is what charting's bar and plot components do. This wrapper is
 * that owner, so a multi-step gesture can be asserted end to end.
 */
function ControlledHandle({
  initialY,
  onDrag,
  ...rest
}: {
  initialY: number;
  onDrag: (value: number) => void;
} & Record<string, unknown>) {
  const [y, setY] = React.useState(initialY);
  return (
    <DraggableHandle
      {...rest}
      x={0}
      y={y}
      onDrag={(value: number) => {
        setY(value);
        onDrag(value);
      }}
    />
  );
}

function renderHandle(overrides: Record<string, unknown> = {}) {
  const onDragStart = vi.fn();
  const onDrag = vi.fn();
  const onDragStop = vi.fn();
  const onClick = vi.fn();

  // `getRootNode` is the graph's own element; the drag code reads its geometry
  // to reject movement past the axes.
  const root = document.createElement('div');
  document.body.appendChild(root);

  const { getByTestId, unmount } = render(
    <DraggableHandle
      x={0}
      y={5}
      graphProps={graphProps.create(DOMAIN, RANGE, SIZE, () => root)}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragStop={onDragStop}
      onClick={onClick}
      {...overrides}
    />
  );

  return { handle: getByTestId(HANDLE_TEST_ID), onDragStart, onDrag, onDragStop, onClick, unmount };
}

describe('gridDraggable on a touch device', () => {
  it('starts a drag when a finger lands on the handle', () => {
    const { handle, onDragStart } = renderHandle();

    touchStart(handle, { x: 100, y: 250 });

    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('reports the dragged value while a finger moves', () => {
    const onDrag = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);

    const { getByTestId } = render(
      <ControlledHandle
        initialY={5}
        graphProps={graphProps.create(DOMAIN, RANGE, SIZE, () => root)}
        onDrag={onDrag}
      />
    );

    // Three grid steps up. The y scale is inverted, so moving the finger toward
    // the top of the graph raises the value: 5 -> 8.
    touchDrag(getByTestId(HANDLE_TEST_ID), {
      from: { x: 100, y: 250 },
      to: { x: 100, y: 250 - 3 * PX_PER_STEP },
    });

    expect(onDrag.mock.calls.map(([value]) => value)).toEqual([6, 7, 8]);
  });

  it('stops the drag when the finger lifts', () => {
    const { handle, onDragStop } = renderHandle();

    touchDrag(handle, {
      from: { x: 100, y: 250 },
      to: { x: 100, y: 150 },
    });

    expect(onDragStop).toHaveBeenCalledTimes(1);
  });

  it('treats a tap with no movement as a click, not a drag', () => {
    const { handle, onClick, onDrag } = renderHandle();

    touchStart(handle, { x: 100, y: 250 });
    touchEnd(handle, { x: 100, y: 250 });

    expect(onDrag).not.toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not drag a disabled handle', () => {
    const { handle, onDrag, onDragStop } = renderHandle({ disabled: true });

    touchDrag(handle, {
      from: { x: 100, y: 250 },
      to: { x: 100, y: 150 },
    });

    expect(onDrag).not.toHaveBeenCalled();
    expect(onDragStop).not.toHaveBeenCalled();
  });

  it('releases its document listeners so a lifted handle stops following the finger', () => {
    const { handle, onDrag, unmount } = renderHandle();

    touchDrag(handle, {
      from: { x: 100, y: 250 },
      to: { x: 100, y: 150 },
    });
    const callsAfterFirstDrag = onDrag.mock.calls.length;

    // A finger moving elsewhere after the gesture ended must not move the
    // handle. react-draggable only detaches its document `touchmove` listener if
    // `onStop` does not return false, which is easy to regress.
    touchDrag(document.body, { from: { x: 300, y: 400 }, to: { x: 300, y: 100 } });

    expect(onDrag.mock.calls.length).toBe(callsAfterFirstDrag);
    unmount();
  });
});

/**
 * The mouse path is the one that has always worked, so these are not here to
 * prove it does. They pin mouse and touch to the *same* observable behaviour, so
 * that a change made for one input cannot quietly diverge for the other - which
 * is how touch broke the last time.
 *
 * This is also the fast signal for React 19: react-draggable attaches its native
 * `touchstart` listener to `ReactDOM.findDOMNode(this)`, which React 19 removed,
 * so a React 19 move without a `nodeRef` kills the touch path again.
 */
describe('gridDraggable parity between mouse and touch', () => {
  function mouseDrag(
    target: Element,
    from: { x: number; y: number },
    to: { x: number; y: number }
  ) {
    fireEvent.mouseDown(target, { clientX: from.x, clientY: from.y, button: 0 });
    const steps = 5;
    for (let step = 1; step <= steps; step++) {
      const progress = step / steps;
      fireEvent.mouseMove(target, {
        clientX: from.x + (to.x - from.x) * progress,
        clientY: from.y + (to.y - from.y) * progress,
        button: 0,
      });
    }
    fireEvent.mouseUp(target, { clientX: to.x, clientY: to.y, button: 0 });
  }

  // Both gestures run inside one test, so each render is torn down before the
  // next - otherwise `getByTestId` sees two handles.
  function dragValues(drag: (handle: Element) => void) {
    const onDrag = vi.fn();
    const root = document.createElement('div');
    document.body.appendChild(root);
    const { getByTestId, unmount } = render(
      <ControlledHandle
        initialY={5}
        graphProps={graphProps.create(DOMAIN, RANGE, SIZE, () => root)}
        onDrag={onDrag}
      />
    );
    try {
      drag(getByTestId(HANDLE_TEST_ID));
      return onDrag.mock.calls.map(([value]) => value);
    } finally {
      unmount();
      root.remove();
    }
  }

  const FROM = { x: 100, y: 250 };
  const TO = { x: 100, y: 250 - 3 * PX_PER_STEP };

  it('reports the same values for the same gesture', () => {
    const withMouse = dragValues((handle) => mouseDrag(handle, FROM, TO));
    const withTouch = dragValues((handle) => touchDrag(handle, { from: FROM, to: TO }));

    expect(withTouch).toEqual(withMouse);
  });
});
