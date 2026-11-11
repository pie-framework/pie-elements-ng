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
 *   drag starts under the other. The choice placed is the first finger's, in its target, and the
 *   second finger's stays unplaced; a count of placed choices would pass either.
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

type TestKey = 'drag' | 'cancel' | 'second-finger' | 'autoscroll';

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
  /**
   * For an element whose placed choices do not sit in the DOM under their target (venn's tiles are
   * drawn over the diagram, its regions empty): where the session holds the choice with this
   * `data-tile-id`, as a string, or null when it is unplaced. `targetKey` is what `target` gives.
   */
  landedIn?: (session: Session, tileId: string) => string | null;
  targetKey?: string;
  /** How many choices the session holds as placed. */
  placed: (session: Session) => number;
  /**
   * Set where a touch gesture in this element is a confirmed defect, by test: the mechanism, and the
   * ticket once it has one. That test becomes `test.fixme` and carries both in its report
   * annotations; the element's other tests still run.
   */
  defects?: Partial<Record<TestKey, { mechanism: string; ticket?: string }>>;
};

const JIRA = 'https://illuminate.atlassian.net/browse/';

/** `test.fixme` for a test with a confirmed defect, else `test`, and its annotations. */
function forDefect(item: DndCase, key: TestKey) {
  const defect = item.defects?.[key];
  const annotate = (testInfo: TestInfo) => {
    if (!defect) return;
    testInfo.annotations.push(
      { type: 'fixme', description: defect.mechanism },
      {
        type: 'issue',
        description: defect.ticket ? `${JIRA}${defect.ticket}` : 'defect ticket to be linked',
      }
    );
  };
  return { run: defect ? test.fixme : test, annotate };
}

const DRAGGABLE = '[aria-roledescription="draggable"][aria-disabled="false"]';
const ICA_AREA = ':is([role="button"], [role="group"])[aria-label]:not([aria-roledescription])';

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
    // A named response area: a group while nothing is selected, a button once one is and it is empty.
    target: (root) => root.locator(ICA_AREA).first(),
    otherTarget: (root) => root.locator(ICA_AREA).nth(1),
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
    landedIn: (session, tileId) => {
      const region = ((session?.placements ?? {}) as Record<string, unknown>)[tileId];
      return Array.isArray(region) ? region.join(',') : null;
    },
    targetKey: '1',
    defects: {
      'second-finger': {
        mechanism:
          "A second finger landing during a drag drops the first finger's drag. `onTilePointerDown` " +
          '(venn-classification/src/delivery/VennClassification.svelte) calls `detachPointerDrag()` ' +
          "on every pointerdown, which removes the first drag's window listeners, and the listeners " +
          'it adds for the new drag do not check `pointerId`, so any finger lifting ends it. The ' +
          "session still gains one placement, which is why a count passes: the second finger's " +
          "choice is the one placed - observed in region 1, the first finger's target - and the " +
          "first finger's choice stays in the tray.",
        ticket: 'PIE-1510',
      },
    },
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

/**
 * What a choice shows, which tells it from the others: its text, or the source of its image. A
 * placed choice shows the same, wherever it ends up.
 */
const fingerprint = (choice: Locator): Promise<string> =>
  choice.evaluate(
    (el) => (el.textContent ?? '').trim() || el.querySelector('img')?.getAttribute('src') || ''
  );

type Box = { x: number; y: number; width: number; height: number };

async function boxOf(target: Locator): Promise<Box> {
  const box = await target.boundingBox();
  if (!box) throw new Error('a drop target has no bounding box');
  return box;
}

/**
 * Where, on the page, each choice that shows `print` now is: the centre of every such element.
 * Placed choices keep their element, which moves into the target, so their centre follows them.
 */
const centresOf = (choices: Locator, print: string) =>
  choices.evaluateAll(
    (els, print) =>
      els
        .filter(
          (el) =>
            ((el.textContent ?? '').trim() ||
              el.querySelector('img')?.getAttribute('src') ||
              '') === print
        )
        .map((el) => {
          const box = el.getBoundingClientRect();
          return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
        }),
    print
  );

/**
 * The centre of an element in its layout: its place on screen plus how far the page and every
 * container around it are scrolled, so scrolling alone does not move it.
 */
const layoutPosition = (el: Locator) =>
  el.evaluate((node) => {
    const box = node.getBoundingClientRect();
    let x = box.x + box.width / 2;
    let y = box.y + box.height / 2;
    // The page's own scroll is the root element's, so the walk covers it.
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      x += parent.scrollLeft;
      y += parent.scrollTop;
    }
    return { x, y };
  });

const DROP_MARK = 'data-e2e-drop-target';

/** Tags a drop target, so it can be found again after a drop whatever the locator then finds. */
const markDropTarget = (target: Locator, name: string) =>
  target.evaluate((el, [attr, value]) => el.setAttribute(attr, value), [DROP_MARK, name] as const);

const markedDropTarget = (page: Page, name: string) => page.locator(`[${DROP_MARK}="${name}"]`);

/** Whether a point is in the box, give or take what a placed choice overhangs it by. */
const inBox = (point: { x: number; y: number }, box: Box, margin = 24) =>
  point.x >= box.x - margin &&
  point.x <= box.x + box.width + margin &&
  point.y >= box.y - margin &&
  point.y <= box.y + box.height + margin;

const signature = async (page: Page) => JSON.stringify((await getSessionState(page)) ?? {});

test.describe('drag-and-drop elements under touch', () => {
  for (const item of CASES) {
    const title = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;

    test.describe(title, () => {
      const drag = forDefect(item, 'drag');
      drag.run('a finger can drag a choice into a target', async ({ page }, testInfo) => {
        drag.annotate(testInfo);
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

      const cancel = forDefect(item, 'cancel');
      cancel.run(
        'a drag the system cancels places nothing and leaves nothing stuck',
        async ({ page }, testInfo) => {
          cancel.annotate(testInfo);
          const root = await openForTouch(page, item);
          const before = await signature(page);
          const placedBefore = item.placed(await getSessionState(page));

          const choice = item.choices(root).first();
          await centreInViewport(choice, item.target(root));
          const start = await centerOf(choice);
          const startInLayout = await layoutPosition(choice);
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
          // Where the choice sits in the layout, not on screen: the drag may have autoscrolled the
          // page or a container (match-list scrolls sideways on a phone), and the cancel leaves
          // that scroll as it is.
          const end = await layoutPosition(choice);
          expect(
            Math.abs(end.x - startInLayout.x) + Math.abs(end.y - startInLayout.y)
          ).toBeLessThan(4);

          // Not wedged: the same choice can still be dragged in.
          await touchDragBetween(page, choice, item.target(root), {
            settleMs: 150,
          });
          await expect.poll(() => signature(page), { timeout: 10_000 }).not.toBe(before);
          expect(item.placed(await getSessionState(page))).toBe(placedBefore + 1);
        }
      );

      const secondFinger = forDefect(item, 'second-finger');
      secondFinger.run(
        'a second finger during a drag starts no second drag',
        async ({ page }, testInfo) => {
          secondFinger.annotate(testInfo);
          const root = await openForTouch(page, item);
          const placedBefore = item.placed(await getSessionState(page));

          const choices = item.choices(root);
          // Which choice each finger holds. They must differ, and neither be in a target yet, or the
          // check after the drag would pass whichever landed.
          const firstChoice = await fingerprint(choices.first());
          const secondChoice = await fingerprint(choices.nth(1));
          expect(firstChoice).not.toBe('');
          expect(secondChoice).not.toBe(firstChoice);
          await centreInViewport(choices.first(), item.target(root), item.otherTarget(root));
          // An element whose placed choices are not in the DOM under their target is read from the
          // session, by the id on the tile.
          const firstKey = (await choices.first().getAttribute('data-tile-id')) ?? '';
          const secondKey = (await choices.nth(1).getAttribute('data-tile-id')) ?? '';
          // Mark both targets now: placing a choice can change which element a target locator
          // finds (the first empty blank moves on), and on a phone it reflows the page, so the
          // check after the drop measures these same elements where they then are.
          await markDropTarget(item.target(root), 'target');
          await markDropTarget(item.otherTarget(root), 'other');
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
          // The first finger's choice is the one in its target, and the second finger's is unplaced:
          // in neither target, where the placed count alone would pass either choice.
          if (item.landedIn) {
            const session = await getSessionState(page);
            expect(item.landedIn(session, firstKey), "the first finger's choice").toBe(
              item.targetKey
            );
            expect(item.landedIn(session, secondKey), "the second finger's choice").toBeNull();
          } else {
            const targetBox = await boxOf(markedDropTarget(page, 'target'));
            const otherBox = await boxOf(markedDropTarget(page, 'other'));
            const first = await centresOf(choices, firstChoice);
            const second = await centresOf(choices, secondChoice);
            expect(
              first.some((at) => inBox(at, targetBox)),
              "the first finger's choice is in its target"
            ).toBe(true);
            expect(
              second.some((at) => inBox(at, targetBox) || inBox(at, otherBox)),
              "the second finger's choice is not placed"
            ).toBe(false);
          }
          await expect(root.locator('[aria-pressed="true"]')).toHaveCount(0);
        }
      );

      if (item.autoscroll) {
        const autoscroll = forDefect(item, 'autoscroll');
        autoscroll.run(
          'a drag held at the bottom edge scrolls the page, and cancelling it places nothing',
          async ({ page }, testInfo) => {
            autoscroll.annotate(testInfo);
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
