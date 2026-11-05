import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Touch gesture helpers for the element-demo e2e suite.
 *
 * Why these are not just `page.mouse.*`:
 *
 * The existing spatial-DnD coverage drives every draggable element - charting
 * and graphing included - with `page.mouse.down/move/up`. That exercises the
 * mouse path only. Drag libraries handle touch through separate listeners, so a
 * handle can be fully green under `page.mouse` and completely inert under a
 * finger. That is how charting shipped broken on iPads (PIE-1074).
 *
 * Why CDP rather than `page.touchscreen`:
 *
 * Playwright's `page.touchscreen` exposes `tap()` and nothing else - there is no
 * public touch-drag. `Input.dispatchTouchEvent` over CDP gives the full
 * start/move/end sequence with real *trusted* events, which is what the
 * browser's own gesture recognition needs: `touch-action` handling and the
 * `pointercancel` that aborts a dnd-kit drag only happen for trusted input.
 * Synthetic in-page events would bypass exactly the machinery worth testing.
 * It is Chromium-only, which is why the `touch` project emulates a tablet in
 * Chromium rather than running WebKit (see playwright.config.ts).
 *
 * A project must set `hasTouch: true` for any of this to work;
 * `assertTouchEnabled` fails loudly rather than letting a spec silently pass on
 * a non-touch project.
 */

type Point = { x: number; y: number };

type CdpSession = Awaited<ReturnType<ReturnType<Page['context']>['newCDPSession']>>;

const sessions = new WeakMap<Page, Promise<CdpSession>>();

/** One CDP session per page; creating one per gesture leaks handles. */
function cdp(page: Page): Promise<CdpSession> {
  let session = sessions.get(page);
  if (!session) {
    session = page.context().newCDPSession(page);
    sessions.set(page, session);
  }
  return session;
}

/**
 * Fail with a useful message when a spec that needs touch is running on a
 * project that has none - otherwise the gesture is a no-op and the assertion
 * failure points at the element instead of the config.
 */
export async function assertTouchEnabled(page: Page): Promise<void> {
  const hasTouch = await page.evaluate(
    () => 'ontouchstart' in window || navigator.maxTouchPoints > 0
  );
  if (!hasTouch) {
    throw new Error(
      'This spec requires a touch-enabled project. Run it under the `touch` project ' +
        '(`playwright test --project=touch`) or add `hasTouch: true` to the project `use` block.'
    );
  }
}

/** Centre of a locator's box, which is where a finger would naturally land. */
export async function centerOf(target: Locator): Promise<Point> {
  await target.waitFor({ state: 'visible', timeout: 10_000 });
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Cannot resolve a touch point: target has no bounding box');
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Tap a point or a locator.
 *
 * `holdMs` is how long the finger stays down. The default lifts it at once, which is enough for a
 * handler that acts on `touchstart` or `click`. A finger rests for tens of milliseconds, and code
 * that arms a timer on `touchstart` and cancels it on `touchend` - an MUI `Tooltip` opening on a
 * touch - may never fire for a tap lifted that fast, so pass about 100 to tap as a learner does.
 *
 * `driftPx` moves the finger that far, in one `touchMove`, before it lifts. A finger is never
 * perfectly still, and a small move stays a tap (the browser's slop is far larger), so the
 * compatibility mouse events and `click` still follow - but later, and with the finger off its
 * starting point.
 */
export async function touchTap(
  page: Page,
  target: Locator | Point,
  { holdMs = 0, driftPx = 0 }: { holdMs?: number; driftPx?: number } = {}
): Promise<void> {
  const point = 'x' in target ? target : await centerOf(target);
  const session = await cdp(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: point.x, y: point.y }],
  });
  if (driftPx > 0) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: point.x + driftPx, y: point.y + driftPx }],
    });
  }
  if (holdMs > 0) {
    await page.waitForTimeout(holdMs);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/**
 * Waits until `target` has stopped moving or resizing: its box unchanged over a few polls. A finger
 * that goes down on something still animating into place lifts over whatever has moved under it.
 */
export async function waitForSettled(target: Locator): Promise<void> {
  let last = '';
  let stableFor = 0;
  await expect
    .poll(
      async () => {
        const box = await target.boundingBox();
        const now = box ? [box.x, box.y, box.width, box.height].map(Math.round).join() : '';
        stableFor = now === last ? stableFor + 1 : 0;
        last = now;
        return stableFor >= 4;
      },
      { timeout: 5_000, intervals: [50] }
    )
    .toBe(true);
}

export type TouchDragOptions = {
  /**
   * Intermediate `touchMove` events. Default 10: grid-snapping handles discard
   * sub-grid deltas, and drag libraries commonly ignore the first move as slop,
   * so a two-event drag can register as nothing at all.
   */
  steps?: number;
  /** Pause between moves, for components that settle asynchronously. */
  delayMs?: number;
  /**
   * Pause after the last move, before lifting. Drag-and-drop libraries find the
   * drop target as the last move renders, so a release that follows it at once
   * can land nowhere.
   */
  settleMs?: number;
};

/** Drag one finger from `from` to `to`. */
export async function touchDrag(
  page: Page,
  from: Point,
  to: Point,
  { steps = 10, delayMs = 16, settleMs = 0 }: TouchDragOptions = {}
): Promise<void> {
  const session = await cdp(page);

  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: from.x, y: from.y }],
  });

  for (let step = 1; step <= steps; step++) {
    const progress = step / steps;
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [
        {
          x: from.x + (to.x - from.x) * progress,
          y: from.y + (to.y - from.y) * progress,
        },
      ],
    });
    if (delayMs > 0) {
      await page.waitForTimeout(delayMs);
    }
  }

  if (settleMs > 0) {
    await page.waitForTimeout(settleMs);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/**
 * Pinch outward with two fingers, centred on `at`, as a learner zooms in.
 *
 * The fingers start `fromSpread` apart horizontally and end `toSpread` apart.
 * Chromium turns the trusted touches into a pinch gesture, so the visual
 * viewport zooms only where `touch-action` allows `pinch-zoom` - the same check
 * the browser makes for a real finger.
 */
export async function touchPinch(
  page: Page,
  at: Point,
  {
    fromSpread = 60,
    toSpread = 300,
    steps = 12,
  }: {
    fromSpread?: number;
    toSpread?: number;
    steps?: number;
  } = {}
): Promise<void> {
  const session = await cdp(page);
  const fingers = (spread: number) => [
    { x: at.x - spread / 2, y: at.y, id: 1 },
    { x: at.x + spread / 2, y: at.y, id: 2 },
  ];

  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: fingers(fromSpread),
  });
  for (let step = 1; step <= steps; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: fingers(fromSpread + ((toSpread - fromSpread) * step) / steps),
    });
    await page.waitForTimeout(16);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/**
 * Select text with a finger: press and hold at `at`, let `select` place the
 * selection, then drag a little and lift.
 *
 * The browser's own long-press selection and its selection handles cannot be
 * driven through CDP, so `select` stands in for them. What the gesture keeps
 * real is the event sequence around the selection: a held, moving touch that
 * ends without any `mousedown`/`mouseup`, because a moved touch is not a tap
 * and so gets no compatibility mouse events - which is what a learner or
 * scorer produces on a tablet.
 */
export async function touchSelect(
  page: Page,
  at: Point,
  select: () => Promise<void>,
  { holdMs = 700, steps = 4 }: { holdMs?: number; steps?: number } = {}
): Promise<void> {
  const session = await cdp(page);

  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: at.x, y: at.y }],
  });
  await page.waitForTimeout(holdMs);
  await select();

  for (let step = 1; step <= steps; step++) {
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: at.x + step * 10, y: at.y }],
    });
  }

  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

/** Drag a locator by a pixel delta from its centre. */
export async function touchDragBy(
  page: Page,
  target: Locator,
  delta: Partial<Point>,
  options: TouchDragOptions = {}
): Promise<void> {
  const from = await centerOf(target);
  await touchDrag(page, from, { x: from.x + (delta.x ?? 0), y: from.y + (delta.y ?? 0) }, options);
}

/** Drag from one locator's centre to another's. */
export async function touchDragBetween(
  page: Page,
  from: Locator,
  to: Locator,
  options: TouchDragOptions = {}
): Promise<void> {
  await touchDrag(page, await centerOf(from), await centerOf(to), options);
}

const lerp = (from: Point, to: Point, progress: number): Point => ({
  x: from.x + (to.x - from.x) * progress,
  y: from.y + (to.y - from.y) * progress,
});

/**
 * A finger that is still down. `moveTo` travels to a point in `steps` moves, `release` lifts it,
 * and `cancel` ends the touch the way the system does when it takes the gesture over (an edge swipe,
 * a notification, a palm) - `touchCancel`, with no `touchEnd`.
 *
 * Used where a spec has to do something while the finger is down: hold near an edge, or cancel.
 */
export type HeldTouch = {
  moveTo(to: Point, options?: { steps?: number; delayMs?: number }): Promise<void>;
  /** Puts a second finger down at `at` (touch id 2), then moves both with the first held. */
  addFinger(at: Point): Promise<void>;
  /** Moves the second finger only; the first stays where it is. */
  moveFinger(to: Point, options?: { steps?: number; delayMs?: number }): Promise<void>;
  /** Lifts the second finger; the first stays down. */
  liftFinger(): Promise<void>;
  release(): Promise<void>;
  cancel(): Promise<void>;
};

/** Puts one finger down at `from` and returns the held touch. */
export async function touchHold(page: Page, from: Point): Promise<HeldTouch> {
  const session = await cdp(page);
  let first = { ...from };
  let second: Point | null = null;

  const points = () => [
    { x: first.x, y: first.y, id: 1 },
    ...(second ? [{ x: second.x, y: second.y, id: 2 }] : []),
  ];
  const send = async (
    type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
    touchPoints = points()
  ): Promise<void> => {
    await session.send('Input.dispatchTouchEvent', { type, touchPoints });
  };

  await send('touchStart');

  return {
    async moveTo(to, { steps = 10, delayMs = 16 } = {}) {
      const start = { ...first };
      for (let step = 1; step <= steps; step++) {
        first = lerp(start, to, step / steps);
        await send('touchMove');
        if (delayMs > 0) {
          await page.waitForTimeout(delayMs);
        }
      }
    },
    async addFinger(at) {
      second = { ...at };
      await send('touchStart');
    },
    async moveFinger(to, { steps = 10, delayMs = 16 } = {}) {
      if (!second) {
        throw new Error('moveFinger: no second finger is down');
      }
      const start = { ...second };
      for (let step = 1; step <= steps; step++) {
        second = lerp(start, to, step / steps);
        await send('touchMove');
        if (delayMs > 0) {
          await page.waitForTimeout(delayMs);
        }
      }
    },
    async liftFinger() {
      // CDP reports a released point as one missing from the next event.
      second = null;
      await send('touchMove');
    },
    release: () => send('touchEnd', []),
    cancel: () => send('touchCancel', []),
  };
}

/**
 * Drag one finger from `from` towards `to`, then have the system cancel the touch `cancelAfter` of
 * the way along (default half way) instead of lifting it.
 */
export async function touchDragCancelled(
  page: Page,
  from: Point,
  to: Point,
  { steps = 10, delayMs = 16, cancelAfter = 0.5 }: TouchDragOptions & { cancelAfter?: number } = {}
): Promise<void> {
  const touch = await touchHold(page, from);
  await touch.moveTo(lerp(from, to, cancelAfter), { steps, delayMs });
  await page.waitForTimeout(100);
  await touch.cancel();
}

/**
 * Drag one finger from `from` to `to` while a second finger lands at `other` part way through,
 * moves, and lifts before the first does. Returns once the first finger has lifted.
 */
export async function touchDragWithSecondFinger(
  page: Page,
  from: Point,
  to: Point,
  other: { from: Point; to: Point },
  { steps = 10, delayMs = 16, settleMs = 150 }: TouchDragOptions = {}
): Promise<void> {
  const touch = await touchHold(page, from);
  await touch.moveTo(lerp(from, to, 0.4), { steps, delayMs });
  await touch.addFinger(other.from);
  await touch.moveFinger(other.to, { steps, delayMs });
  await touch.liftFinger();
  await touch.moveTo(to, { steps, delayMs });
  await page.waitForTimeout(settleMs);
  await touch.release();
}

/**
 * Scrolls the page so the joint box of `targets` is centred vertically in the viewport. A finger
 * can only land on what is on screen, so a spec that opens a route with `layout=page`, where the
 * element sits below other content, calls this before it touches anything.
 */
export async function centreInViewport(...targets: Locator[]): Promise<void> {
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const target of targets) {
    await target.waitFor({ state: 'visible', timeout: 15_000 });
    const box = await target.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        top: rect.top + window.scrollY,
        bottom: rect.bottom + window.scrollY,
      };
    });
    top = Math.min(top, box.top);
    bottom = Math.max(bottom, box.bottom);
  }
  await targets[0].page().evaluate(
    ({ top, bottom }) =>
      window.scrollTo({
        top: (top + bottom) / 2 - window.innerHeight / 2,
        behavior: 'instant',
      }),
    { top, bottom }
  );
}
