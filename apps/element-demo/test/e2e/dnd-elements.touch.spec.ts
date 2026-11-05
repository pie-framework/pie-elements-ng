import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test';
import {
  deliveryContainer,
  getModelFromSource,
  getSessionState,
  openDeliverRoute,
  switchTab,
  updateModelInSource,
  waitForMathRendering,
} from './test-helpers';
import {
  assertTouchEnabled,
  centerOf,
  centreInViewport,
  touchDragBetween,
  touchDragCancelled,
  touchDragWithSecondFinger,
  touchHold,
} from './touch-helpers';

/**
 * Can a finger move a choice into a target in the drag-and-drop elements?
 *
 * `phase1-spatial-dnd.spec.ts` drags all of these with `page.mouse` only, and
 * `dnd-release-outside.spec.ts` drags by touch only to release outside the element. A handle that
 * works with a mouse can still be cancelled by touch: when nothing sets `touch-action: none` on
 * the drag path, Chromium claims the gesture as a page pan and fires `pointercancel`, which aborts
 * dnd-kit's PointerSensor (PIE-1104 was this, in number-line).
 *
 * Each case drags one choice into one target and checks the session, not how the page looks. Two
 * gestures beyond a plain drag follow, because a finger does what a mouse cannot:
 *
 * - the system cancels the touch part way (`touchCancel`, as for an edge swipe or a palm): nothing
 *   is placed, nothing is left stuck mid-drag, and the next drag still works;
 * - a second finger lands during a drag: the drag carries on with the first finger and no second
 *   drag starts under the other.
 *
 * And, where the element hands scrolling to dnd-kit, a drag held at the edge of the viewport scrolls
 * the page. That is the document, not an inner scroll container, because the demos have no long
 * list or tall item. Venn is left out: its pointer code has no scrolling.
 *
 * What keeps the touch from becoming a page pan differs by element. categorize, match-list,
 * drag-in-the-blank and venn rely on `touch-action: none`: with it forced to `auto` their cases fail.
 * placement-ordering and image-cloze-association register their own non-passive `touchmove`
 * `preventDefault`, so they stay green either way. A pass here is not a `touch-action` check for those two.
 *
 * The route opens with `layout=page`. Elsewhere the demo never scrolls, so Chromium has no pan to
 * claim, never sends `pointercancel`, and a handle missing `touch-action: none` passes.
 * Runs under the `touch` project only (see playwright.config.ts).
 */

type Session = Record<string, unknown>;

type DndCase = {
  element: string;
  demoId?: string;
  /** Opens the delivery view; the default opens the demo's deliver route. */
  open?: (page: Page) => Promise<void>;
  /** The element's root, where the default is the delivery container. */
  root?: (page: Page) => Locator;
  /** Every choice a finger can pick up, in a stable order. */
  choices: (root: Locator) => Locator;
  /** Where the first choice is dropped. */
  target: (root: Locator) => Locator;
  /** Another place a choice can be dropped, which the second finger heads for. */
  otherTarget: (root: Locator) => Locator;
  /** Set when dnd-kit's default autoscroll applies; Venn's own pointer code has none. */
  autoscroll?: boolean;
  /** How many choices the session holds as placed. */
  placed: (session: Session) => number;
  /**
   * Set when a touch drag in this element is a confirmed defect: the mechanism and the ticket. Every
   * test of the element becomes `test.fixme` and carries both in its report annotations.
   */
  defect?: { mechanism: string; ticket: string };
};

const JIRA = 'https://illuminate.atlassian.net/browse/';

function annotateDefect(testInfo: TestInfo, item: DndCase): void {
  if (!item.defect) return;
  testInfo.annotations.push(
    { type: 'fixme', description: item.defect.mechanism },
    { type: 'issue', description: `${JIRA}${item.defect.ticket}` }
  );
}

const DRAGGABLE = '[aria-roledescription="draggable"][aria-disabled="false"]';

const CASES: DndCase[] = [
  {
    element: 'categorize',
    open: async (page) => {
      await openDeliverRoute(page, 'categorize', undefined, { layout: 'page' });
      await waitForMathRendering(page);
    },
    choices: (root) => root.locator(DRAGGABLE),
    target: (root) => root.getByRole('group', { name: 'True', exact: true }),
    otherTarget: (root) => root.getByRole('group', { name: 'False', exact: true }),
    autoscroll: true,
    placed: (session) =>
      ((session?.answers ?? []) as { choices?: unknown[] }[]).reduce(
        (total, answer) => total + (answer.choices?.length ?? 0),
        0
      ),
  },
  {
    element: 'match-list',
    choices: (root) => root.locator(DRAGGABLE),
    target: (root) => root.locator('[role="group"][tabindex="-1"]').first(),
    otherTarget: (root) => root.locator('[role="group"][tabindex="-1"]').nth(1),
    autoscroll: true,
    placed: (session) =>
      Object.values((session?.value ?? {}) as Record<string, unknown>).filter(Boolean).length,
  },
  {
    element: 'placement-ordering',
    open: async (page) => {
      // The default demo has no placement area, so a drag only reorders the pool; this one drops
      // into a slot, as dnd-release-outside.spec.ts does.
      await page.goto('/placement-ordering/source?demo=default');
      await page.locator('[data-testid="source-editor"]').waitFor({ timeout: 60_000 });
      const model = await getModelFromSource(page);
      await updateModelInSource(page, {
        ...model,
        placementArea: true,
        choiceLabel: '',
        targetLabel: '',
      });
      await switchTab(page, 'deliver');
      // A reload would drop the edited model, so the layout changes through the router: a click on
      // a link, which SvelteKit handles without leaving the page.
      await page.evaluate(() => {
        const url = new URL(location.href);
        url.searchParams.set('layout', 'page');
        const link = document.createElement('a');
        link.href = url.pathname + url.search;
        document.body.append(link);
        link.click();
        link.remove();
      });
      await expect(page).toHaveURL(/layout=page/);
    },
    choices: (root) => root.locator(DRAGGABLE),
    target: (root) => root.locator('[data-tile-id$=":target-0"]'),
    otherTarget: (root) => root.locator('[data-tile-id$=":target-1"]'),
    autoscroll: true,
    placed: (session) => ((session?.value ?? []) as unknown[]).filter(Boolean).length,
  },
  {
    element: 'image-cloze-association',
    choices: (root) => root.locator(DRAGGABLE),
    target: (root) => root.locator('[role="button"]:not([aria-roledescription])').first(),
    otherTarget: (root) => root.locator('[role="button"]:not([aria-roledescription])').nth(1),
    autoscroll: true,
    placed: (session) => ((session?.answers ?? []) as unknown[]).length,
  },
  {
    element: 'drag-in-the-blank',
    choices: (root) => root.locator(DRAGGABLE),
    target: (root) => root.locator('[role="button"]:not([aria-roledescription])').first(),
    otherTarget: (root) => root.locator('[role="button"]:not([aria-roledescription])').nth(1),
    autoscroll: true,
    placed: (session) => Object.keys((session?.value ?? {}) as object).length,
  },
  {
    element: 'venn-classification',
    demoId: 'reptile-egg-layer',
    root: (page) => page.locator('.venn-root').first(),
    choices: (root) => root.locator('[data-region-key="tray"] [data-tile-id]'),
    target: (root) => root.locator('[data-region-key="1"]').first(),
    otherTarget: (root) => root.locator('[data-region-key="0"]').first(),
    placed: (session) =>
      Object.values((session?.placements ?? {}) as Record<string, unknown>).filter((region) =>
        Array.isArray(region)
      ).length,
  },
];

async function openForTouch(page: Page, item: DndCase): Promise<Locator> {
  if (item.open) {
    await item.open(page);
  } else {
    // `layout=page` makes the document scroll, as on a host page. Without it nothing can be
    // panned, Chromium never claims the gesture, and a handle missing `touch-action: none` passes.
    await openDeliverRoute(page, item.element, item.demoId, { layout: 'page' });
  }
  await assertTouchEnabled(page);
  const root = item.root ? item.root(page) : deliveryContainer(page);
  await expect(item.choices(root).first()).toBeVisible({ timeout: 20_000 });
  await expect(item.target(root)).toBeVisible();
  // A page that cannot scroll cannot be panned, which would make every pass below vacuous.
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight),
    'the page does not scroll, so Chromium has no pan to claim from a drag'
  ).toBeGreaterThan(100);
  return root;
}

type PointerLog = { count: number; seen: Set<number> };
type WithPointerLog = Window & { __pointers: PointerLog };

/** Counts the touch pointer events of one type that reach the page, and the pointers behind them. */
async function recordPointers(page: Page, type: 'pointerdown' | 'pointercancel') {
  await page.evaluate((type) => {
    const seen = new Set<number>();
    (window as unknown as WithPointerLog).__pointers = { count: 0, seen };
    window.addEventListener(
      type,
      (event) => {
        if ((event as PointerEvent).pointerType !== 'touch') return;
        (window as unknown as WithPointerLog).__pointers.count += 1;
        seen.add((event as PointerEvent).pointerId);
      },
      true
    );
  }, type);
}

const pointersSeen = (page: Page) =>
  page.evaluate(() => ({
    count: (window as unknown as WithPointerLog).__pointers.count,
    ids: (window as unknown as WithPointerLog).__pointers.seen.size,
  }));

const signature = async (page: Page) => JSON.stringify((await getSessionState(page)) ?? {});

test.describe('drag-and-drop elements under touch', () => {
  for (const item of CASES) {
    const title = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;

    test.describe(title, () => {
      const run = item.defect ? test.fixme : test;

      run('a finger can drag a choice into a target', async ({ page }, testInfo) => {
        annotateDefect(testInfo, item);
        const root = await openForTouch(page, item);
        const before = await signature(page);
        const placedBefore = item.placed(await getSessionState(page));

        const choice = item.choices(root).first();
        await centreInViewport(choice, item.target(root));
        await touchDragBetween(page, choice, item.target(root), {
          settleMs: 150,
        });

        await expect.poll(() => signature(page), { timeout: 10_000 }).not.toBe(before);
        expect(item.placed(await getSessionState(page))).toBe(placedBefore + 1);
      });

      run(
        'a drag the system cancels places nothing and leaves nothing stuck',
        async ({ page }, testInfo) => {
          annotateDefect(testInfo, item);
          const root = await openForTouch(page, item);
          const before = await signature(page);
          const placedBefore = item.placed(await getSessionState(page));

          const choice = item.choices(root).first();
          await centreInViewport(choice, item.target(root));
          const start = await centerOf(choice);
          await recordPointers(page, 'pointercancel');
          await touchDragCancelled(page, start, await centerOf(item.target(root)));
          // The cancel reached the page; otherwise "nothing happened" proves nothing.
          expect((await pointersSeen(page)).count).toBeGreaterThan(0);

          // Past the 50ms in which dnd-kit swallows clicks after a drop, and any settle animation.
          await page.waitForTimeout(500);
          expect(await signature(page)).toBe(before);
          // dnd-kit marks a held draggable `aria-pressed`; venn has no such attribute, so for every
          // element the choice is also checked for a leftover drag transform.
          await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
          expect(await choice.evaluate((el) => getComputedStyle(el).transform)).toMatch(
            /^(none|matrix\(1, 0, 0, 1, 0, 0\))$/
          );
          const end = await centerOf(choice);
          expect(Math.abs(end.x - start.x) + Math.abs(end.y - start.y)).toBeLessThan(4);

          // Not wedged: the same choice can still be dragged in.
          await touchDragBetween(page, choice, item.target(root), {
            settleMs: 150,
          });
          await expect.poll(() => signature(page), { timeout: 10_000 }).not.toBe(before);
          expect(item.placed(await getSessionState(page))).toBe(placedBefore + 1);
        }
      );

      run('a second finger during a drag starts no second drag', async ({ page }, testInfo) => {
        annotateDefect(testInfo, item);
        const root = await openForTouch(page, item);
        const placedBefore = item.placed(await getSessionState(page));

        const choices = item.choices(root);
        await centreInViewport(choices.first(), item.target(root), item.otherTarget(root));
        await recordPointers(page, 'pointerdown');
        // The second finger picks up another choice and heads for another target, so a drag
        // started under it would place a second choice.
        await touchDragWithSecondFinger(
          page,
          await centerOf(choices.first()),
          await centerOf(item.target(root)),
          {
            from: await centerOf(choices.nth(1)),
            to: await centerOf(item.otherTarget(root)),
          }
        );

        // Both fingers landed, as two touch pointers.
        expect((await pointersSeen(page)).ids).toBe(2);
        await expect
          .poll(async () => item.placed(await getSessionState(page)), {
            timeout: 10_000,
          })
          .toBe(placedBefore + 1);
        // Settled: no late second placement, and nothing left held.
        await page.waitForTimeout(500);
        expect(item.placed(await getSessionState(page))).toBe(placedBefore + 1);
        await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
      });

      if (item.autoscroll) {
        run(
          'a drag held at the bottom edge scrolls the page, and cancelling it places nothing',
          async ({ page }, testInfo) => {
            annotateDefect(testInfo, item);
            const root = await openForTouch(page, item);
            const before = await signature(page);

            const choice = item.choices(root).first();
            await centreInViewport(choice);
            const scrollY = () => page.evaluate(() => window.scrollY);
            const startedAt = await scrollY();

            const viewport = await page.evaluate(() => ({
              width: window.innerWidth,
              height: window.innerHeight,
            }));
            const start = await centerOf(choice);
            const touch = await touchHold(page, start);
            await touch.moveTo({ x: start.x, y: viewport.height - 12 });
            // Autoscroll acts on a held finger that is not moving.
            await expect.poll(scrollY, { timeout: 5_000 }).toBeGreaterThan(startedAt + 50);
            // The system takes the touch, so the drop lands nowhere.
            await touch.cancel();
            await page.waitForTimeout(300);
            expect(await signature(page)).toBe(before);
          }
        );
      }
    });
  }
});
