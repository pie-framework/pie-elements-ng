/**
 * Touch-input helpers for component tests.
 *
 * Why these exist instead of `fireEvent.touchStart(el, { touches: [...] })`:
 *
 * 1. **Mouse and touch do not arrive the same way.** react-draggable v4 - which
 *    backs `gridDraggable` in `@pie-lib/plot`, and therefore every drag handle in
 *    charting / graphing / graphing-solution-set - hands the mouse path a *React
 *    synthetic* event (via `cloneElement`) but registers `touchstart` as a
 *    *native, non-passive* listener in `componentDidMount`. A handler on the
 *    touch path is given a raw DOM event with no `.nativeEvent`. Code that reads
 *    `e.nativeEvent` unguarded works under a mouse and throws under a finger,
 *    which is exactly how a drag handle ended up inert on an iPad while every
 *    desktop test stayed green (PIE-1074). Dispatching real DOM events is the
 *    only way a test can see that difference.
 *
 * 2. **Touch-list semantics decide whether a gesture is recognised at all.** A
 *    real `touchend` carries an *empty* `touches`/`targetTouches` and the lifted
 *    finger in `changedTouches`; react-draggable's `getTouch()` depends on that
 *    exact shape to resolve the drag it should stop. A hand-rolled event that
 *    leaves the touch in `targetTouches` on release makes broken code look
 *    green. These helpers always build the lists the way a browser does.
 *
 * 3. **A real drag is start -> several moves -> end.** Grid-snapping handles
 *    discard sub-grid deltas, so a single `touchmove` can be dropped entirely.
 *    `touchDrag` interpolates, like a finger does.
 *
 * Coordinates are `clientX`/`clientY` and must be passed explicitly: happy-dom
 * and jsdom both report a zero-sized `getBoundingClientRect()`, so there is no
 * element geometry to derive them from.
 *
 * @example
 * // A handle that only listens for mouse events never sees this.
 * touchDrag(handle, { from: { x: 100, y: 250 }, to: { x: 100, y: 100 } });
 * expect(onDragStop).toHaveBeenCalled();
 */

import { fireEvent } from '@testing-library/react';

/** A point in client coordinates. */
export interface TouchPointInit {
  x: number;
  y: number;
}

export interface TouchDragOptions {
  /** Where the finger lands. */
  from: TouchPointInit;
  /** Where the finger lifts. */
  to: TouchPointInit;
  /**
   * How many `touchmove` events to interpolate between `from` and `to`.
   * Defaults to 5 - enough that a grid-snapping handle sees more than one step.
   */
  steps?: number;
  /** Touch identifier, for tests that need to interleave two fingers. */
  identifier?: number;
}

export interface TouchEventOptions {
  identifier?: number;
}

type TouchLists = {
  touches: Touch[];
  targetTouches: Touch[];
  changedTouches: Touch[];
};

const DEFAULT_IDENTIFIER = 0;
const DEFAULT_DRAG_STEPS = 5;

/**
 * Build a `Touch`. Uses the real constructor where the environment has one
 * (happy-dom does) and falls back to a structurally-equivalent object where it
 * does not (jsdom has no `Touch`), so a suite is not tied to one DOM shim.
 */
function createTouch(target: EventTarget, { x, y }: TouchPointInit, identifier: number): Touch {
  const init = {
    identifier,
    target: target as Element,
    clientX: x,
    clientY: y,
    pageX: x,
    pageY: y,
    screenX: x,
    screenY: y,
    radiusX: 1,
    radiusY: 1,
    rotationAngle: 0,
    force: 1,
  };

  const TouchCtor = (globalThis as { Touch?: typeof Touch }).Touch;
  if (typeof TouchCtor === 'function') {
    try {
      return new TouchCtor(init);
    } catch {
      // Fall through to the plain object below.
    }
  }

  return init as unknown as Touch;
}

function assignTouchLists(event: Event, lists: TouchLists): Event {
  for (const [key, value] of Object.entries(lists)) {
    Object.defineProperty(event, key, { value, configurable: true, enumerable: true });
  }
  return event;
}

/**
 * Dispatch a real DOM touch event, with browser-accurate touch lists.
 *
 * Goes through `fireEvent`'s generic form so React state updates are wrapped in
 * `act()`, while the event itself stays a genuine DOM event that native,
 * non-passive listeners receive - React synthetic events would bypass them.
 */
export function dispatchTouchEvent(target: EventTarget, type: string, lists: TouchLists): Event {
  const init = { bubbles: true, cancelable: true, composed: true, ...lists };

  const TouchEventCtor = (globalThis as { TouchEvent?: typeof TouchEvent }).TouchEvent;
  let event: Event | undefined;
  if (typeof TouchEventCtor === 'function') {
    try {
      event = new TouchEventCtor(type, init);
    } catch {
      event = undefined;
    }
  }
  if (!event) {
    event = assignTouchLists(new Event(type, init), lists);
  }

  fireEvent(target as Element | Node | Window, event);
  return event;
}

/** A finger lands on `target`. */
export function touchStart(
  target: EventTarget,
  point: TouchPointInit,
  { identifier = DEFAULT_IDENTIFIER }: TouchEventOptions = {}
): Event {
  const touch = createTouch(target, point, identifier);
  return dispatchTouchEvent(target, 'touchstart', {
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch],
  });
}

/**
 * A finger already down moves to `point`.
 *
 * Dispatched on `target` rather than on `document`, mirroring the browser's
 * implicit touch capture: every move in a gesture is retargeted to the element
 * the gesture started on, and bubbles from there to the document listeners drag
 * libraries attach on start.
 */
export function touchMove(
  target: EventTarget,
  point: TouchPointInit,
  { identifier = DEFAULT_IDENTIFIER }: TouchEventOptions = {}
): Event {
  const touch = createTouch(target, point, identifier);
  return dispatchTouchEvent(target, 'touchmove', {
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch],
  });
}

/**
 * The finger lifts at `point`.
 *
 * `touches` and `targetTouches` are empty and the lifted finger is reported in
 * `changedTouches` only - the shape a browser actually sends, and the one
 * react-draggable's `getTouch()` resolves a drag stop from.
 */
export function touchEnd(
  target: EventTarget,
  point: TouchPointInit,
  { identifier = DEFAULT_IDENTIFIER }: TouchEventOptions = {}
): Event {
  const touch = createTouch(target, point, identifier);
  return dispatchTouchEvent(target, 'touchend', {
    touches: [],
    targetTouches: [],
    changedTouches: [touch],
  });
}

/**
 * Tap `target`: touchstart then touchend at the same point, followed by the
 * `click` a touch browser synthesises afterwards.
 *
 * The trailing `click` matters for components that suppress the post-gesture
 * click to stop a tap from being handled twice.
 */
export function touchTap(
  target: EventTarget,
  point: TouchPointInit = { x: 0, y: 0 },
  options: TouchEventOptions = {}
): void {
  touchStart(target, point, options);
  touchEnd(target, point, options);
  fireEvent(
    target as Element,
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: point.x,
      clientY: point.y,
    })
  );
}

/**
 * Drag `target` with one finger, from `from` to `to`, through interpolated
 * `touchmove` events.
 */
export function touchDrag(target: EventTarget, options: TouchDragOptions): void {
  const { from, to, steps = DEFAULT_DRAG_STEPS, identifier = DEFAULT_IDENTIFIER } = options;
  const eventOptions = { identifier };

  touchStart(target, from, eventOptions);

  for (let step = 1; step <= steps; step++) {
    const progress = step / steps;
    touchMove(
      target,
      {
        x: from.x + (to.x - from.x) * progress,
        y: from.y + (to.y - from.y) * progress,
      },
      eventOptions
    );
  }

  touchEnd(target, to, eventOptions);
}
