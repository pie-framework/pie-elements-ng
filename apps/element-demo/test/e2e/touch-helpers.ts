import type { Locator, Page } from '@playwright/test';

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

/** Tap a point or a locator. */
export async function touchTap(page: Page, target: Locator | Point): Promise<void> {
  const point = 'x' in target ? target : await centerOf(target);
  const session = await cdp(page);
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: point.x, y: point.y }],
  });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
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
};

/** Drag one finger from `from` to `to`. */
export async function touchDrag(
  page: Page,
  from: Point,
  to: Point,
  { steps = 10, delayMs = 16 }: TouchDragOptions = {}
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
