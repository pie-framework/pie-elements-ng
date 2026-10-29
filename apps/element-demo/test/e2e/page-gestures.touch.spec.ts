import { expect, test, type Locator, type Page } from '@playwright/test';
import {
  CENTER,
  firstDragHandle,
  type GraphPoint,
  graphSvg,
  selectFirstTool,
  TWO_POINTS,
  tapGraph,
} from './graph-helpers';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';
import { assertTouchEnabled, touchDrag, touchPinch } from './touch-helpers';

/**
 * Can a learner still scroll the page, and zoom it, with a finger over an element?
 *
 * The touch fixes for dragging work by setting `touch-action: none`, so the
 * browser hands the gesture to the element instead of panning the page. Where
 * that covers more than the handles, a swipe that starts on the element no
 * longer scrolls the page and a pinch over it no longer zooms - on a phone, or a
 * tablet showing a long item, the learner can get stuck, and losing pinch-zoom is
 * an accessibility concern (WCAG 1.4.4, 1.4.10).
 *
 * So, for each element, on the deliver route laid out as a scrolling host page
 * (`layout=page`), under the `touch` project only (see playwright.config.ts):
 *
 * - a vertical swipe that starts on a surface of the element, away from any
 *   handle, scrolls the page and leaves the session alone;
 * - a two-finger pinch over that surface zooms the page (`visualViewport.scale`);
 * - a drag on a handle still moves it and changes the session, without
 *   scrolling the page.
 *
 * A surface whose `touch-action` blocks a gesture is marked `test.fixme` with the
 * cause; see `BLOCKS`. Real iOS Safari treats `touch-action` and pinch-zoom
 * differently and still needs a device.
 */

const DRAGGABLE = '[aria-roledescription="draggable"]';

type Point = { x: number; y: number };

/** Why a gesture is blocked on a surface: the `touch-action` that blocks it, and its ticket. */
type Block = { cause: string; ticket: string };

type Surface = {
  /** What a learner would call this part of the element. */
  name: string;
  locate: (root: Locator) => Locator | Promise<Locator>;
  /** Where on the surface to start, as a fraction of its box; the nearest point off a handle is used. */
  prefer?: GraphPoint;
  scrollBlock?: Block;
  zoomBlock?: Block;
};

type GestureCase = {
  element: string;
  demoId?: string;
  /** What counts as a handle: a gesture must start clear of these. */
  handles: string;
  surfaces: Surface[];
  /**
   * Readies a handle drag - in view, seeded where the graph starts empty - and
   * returns where the finger goes down and where it lifts.
   */
  handleDrag: (page: Page, root: Locator) => Promise<{ from: Point; to: Point }>;
};

const JIRA = 'https://illuminate.atlassian.net/browse/';

/**
 * The confirmed blocks, one per cause. Each blocks both gestures: `touch-action:
 * none` allows neither panning nor `pinch-zoom`. A fix has to keep the handles'
 * drag - plain `pan-y` would bring back scrolling but still block pinch-zoom,
 * which needs `pan-y pinch-zoom`.
 */
const BLOCKS = {
  plot: {
    cause:
      "`@pie-lib/plot`'s root (lib-react/plot/src/root.tsx) sets `touch-action: none` on the whole " +
      'graph, so a touch anywhere on it neither scrolls nor zooms the page, not only on a handle.',
    ticket: 'PIE-1420',
  },
  numberLine: {
    cause:
      'number-line sets `touch-action: none` on its outer `<svg>` ' +
      '(elements-react/number-line/src/delivery/number-line/graph/index.tsx), because Chrome ' +
      'ignores it on inner SVG shapes (PIE-1104), so the whole line blocks scrolling and zooming.',
    ticket: 'PIE-1421',
  },
  dragBoard: {
    cause:
      "`@pie-lib/drag`'s choices board (lib-react/drag/src/placeholder.tsx, its `board` and " +
      '`categorizeBoard` variants) sets `touch-action: none` on the whole pool, not only on the ' +
      'choices in it.',
    ticket: 'PIE-1422',
  },
  categorize: {
    cause:
      "categorize's drop zones (elements-react/categorize/src/delivery/categorize/" +
      'droppable-placeholder.tsx) set `touch-action: none` on every category, and its choices ' +
      "wrapper (choices.tsx) on the pool, which also sits on `@pie-lib/drag`'s board.",
    ticket: 'PIE-1423',
  },
} satisfies Record<string, Block>;

/** A graph's handle drag, seeded and tooled as in graph-elements.touch.spec.ts. */
function graphHandleDrag({
  selectTool = false,
  seedTaps,
  delta = { y: -120 },
}: {
  selectTool?: boolean;
  seedTaps?: GraphPoint[];
  delta?: Partial<Point>;
}) {
  return async (page: Page, root: Locator) => {
    const svg = await graphSvg(root);
    await centreInViewport(svg);
    if (selectTool) {
      await selectFirstTool(root);
    }
    if (seedTaps) {
      await tapGraph(page, root, seedTaps);
      await expect.poll(() => firstDragHandle(root), { timeout: 10_000 }).not.toBeNull();
    }
    const handle = await firstDragHandle(root);
    expect(handle, 'no visible drag handle found in the graph SVG').not.toBeNull();
    const from = await centreOf(handle as Locator);
    return { from, to: { x: from.x + (delta.x ?? 0), y: from.y + (delta.y ?? 0) } };
  };
}

/** The first draggable choice onto `target`. */
function choiceDragTo(target: (root: Locator) => Locator, choice = DRAGGABLE) {
  return async (_page: Page, root: Locator) => {
    const from = root.locator(choice).first();
    const to = target(root);
    await centreInViewport(from, to);
    return { from: await centreOf(from), to: await centreOf(to) };
  };
}

const graphSurface = (overrides: Partial<Surface> = {}): Surface => ({
  name: 'graph',
  locate: graphSvg,
  ...overrides,
});
const GRAPH_HANDLES = 'circle, ellipse, button, [role="button"]';

const CASES: GestureCase[] = [
  {
    element: 'number-line',
    handles: GRAPH_HANDLES,
    // Above the axis, clear of the ticks a tap would place a point on.
    surfaces: [
      graphSurface({
        prefer: { fx: 0.5, fy: 0.2 },
        scrollBlock: BLOCKS.numberLine,
        zoomBlock: BLOCKS.numberLine,
      }),
    ],
    handleDrag: graphHandleDrag({ seedTaps: CENTER, delta: { x: 120 } }),
  },
  {
    element: 'charting',
    handles: GRAPH_HANDLES,
    surfaces: [graphSurface({ scrollBlock: BLOCKS.plot, zoomBlock: BLOCKS.plot })],
    handleDrag: graphHandleDrag({}),
  },
  {
    element: 'graphing',
    handles: GRAPH_HANDLES,
    surfaces: [graphSurface({ scrollBlock: BLOCKS.plot, zoomBlock: BLOCKS.plot })],
    handleDrag: graphHandleDrag({ selectTool: true, seedTaps: CENTER }),
  },
  {
    element: 'graphing-solution-set',
    handles: GRAPH_HANDLES,
    surfaces: [graphSurface({ scrollBlock: BLOCKS.plot, zoomBlock: BLOCKS.plot })],
    handleDrag: graphHandleDrag({ selectTool: true, seedTaps: TWO_POINTS }),
  },
  {
    element: 'categorize',
    handles: DRAGGABLE,
    surfaces: [
      {
        name: 'choices pool',
        locate: (root) => root.locator('[role="group"][aria-labelledby$="choices-label"]').first(),
        scrollBlock: BLOCKS.categorize,
        zoomBlock: BLOCKS.categorize,
      },
      {
        name: 'category',
        locate: (root) => root.locator('[role="group"][aria-labelledby*="category-label"]').first(),
        scrollBlock: BLOCKS.categorize,
        zoomBlock: BLOCKS.categorize,
      },
    ],
    handleDrag: choiceDragTo((root) =>
      root.locator('[role="group"][aria-labelledby*="category-label"]').first()
    ),
  },
  {
    element: 'match-list',
    handles: DRAGGABLE,
    surfaces: [
      { name: 'prompt', locate: (root) => root.locator('[id*="prompt-label"]').first() },
      {
        name: 'answer pool',
        locate: (root) => root.locator('.board').first(),
        scrollBlock: BLOCKS.dragBoard,
        zoomBlock: BLOCKS.dragBoard,
      },
    ],
    handleDrag: choiceDragTo((root) =>
      root.locator('[role="group"][aria-labelledby*="prompt-label"]').first()
    ),
  },
  {
    element: 'drag-in-the-blank',
    // A blank is a drop target and, once filled, a handle.
    handles: `${DRAGGABLE}, [role="button"], .MuiChip-root`,
    surfaces: [
      { name: 'text', locate: (root) => root.locator('p').first() },
      {
        name: 'choices pool',
        locate: (root) => root.locator('.board').first(),
        scrollBlock: BLOCKS.dragBoard,
        zoomBlock: BLOCKS.dragBoard,
      },
    ],
    handleDrag: choiceDragTo((root) => root.getByRole('button', { name: 'Blank 1', exact: true })),
  },
  {
    element: 'venn-classification',
    handles: '[data-tile-id]',
    surfaces: [
      { name: 'diagram', locate: (root) => graphSvg(root.locator('.venn-root')) },
      { name: 'tray', locate: (root) => root.locator('[data-region-key="tray"]').first() },
    ],
    // Region `0` is a 1x1 anchor at the centre of the first set's own area.
    handleDrag: choiceDragTo(
      (root) => root.locator('[data-region-key="0"]').first(),
      '[data-region-key="tray"] [data-tile-id]'
    ),
  },
];

async function centreOf(target: Locator): Promise<Point> {
  const box = await target.boundingBox();
  if (!box) {
    throw new Error('Target has no bounding box');
  }
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/** Scrolls the page so the targets' joint box is centred vertically in the viewport. */
async function centreInViewport(...targets: Locator[]) {
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const target of targets) {
    await target.waitFor({ state: 'visible', timeout: 15_000 });
    const box = await target.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
    });
    top = Math.min(top, box.top);
    bottom = Math.max(bottom, box.bottom);
  }
  const page = targets[0].page();
  await page.evaluate(
    ({ top, bottom }) =>
      window.scrollTo({ top: (top + bottom) / 2 - window.innerHeight / 2, behavior: 'instant' }),
    { top, bottom }
  );
}

/** Half the gap between the pinch's two fingers as they land. */
const FINGER_OFFSET = 30;

/**
 * A point on `surface` where both pinch fingers, and a swipe's one, land on the
 * surface itself and clear of any handle: the nearest such point to `prefer`.
 */
async function freePoint(
  surface: Locator,
  handles: string | null,
  prefer: GraphPoint
): Promise<Point> {
  const point = await surface.evaluate(
    (el, { handles, prefer, offset }) => {
      /** The innermost element at a point, through open shadow roots. */
      const hitAt = (x: number, y: number) => {
        let hit = document.elementFromPoint(x, y);
        while (hit?.shadowRoot) {
          const inner = hit.shadowRoot.elementFromPoint(x, y);
          if (!inner || inner === hit) break;
          hit = inner;
        }
        return hit;
      };
      /** On the surface, and not on or inside a handle. */
      const isFree = (x: number, y: number) => {
        if (x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
        let node: Node | null = hitAt(x, y);
        while (node && node !== el) {
          if (handles && node instanceof Element && node.matches(handles)) return false;
          node = node.parentNode instanceof ShadowRoot ? node.parentNode.host : node.parentNode;
        }
        return node === el;
      };

      const rect = el.getBoundingClientRect();
      const candidates: { x: number; y: number; distance: number }[] = [];
      for (let i = 1; i < 20; i++) {
        for (let j = 1; j < 20; j++) {
          const fx = i / 20;
          const fy = j / 20;
          candidates.push({
            x: rect.left + rect.width * fx,
            y: rect.top + rect.height * fy,
            distance: Math.hypot(fx - prefer.fx, fy - prefer.fy),
          });
        }
      }
      candidates.sort((a, b) => a.distance - b.distance);
      const free = candidates.find(
        ({ x, y }) => isFree(x, y) && isFree(x - offset, y) && isFree(x + offset, y)
      );
      return free ? { x: free.x, y: free.y } : null;
    },
    { handles, prefer, offset: FINGER_OFFSET }
  );
  if (!point) {
    throw new Error('No point on the surface clear of its handles, for one finger or two');
  }
  return point;
}

const scrollY = (page: Page) => page.evaluate(() => window.scrollY);
const zoom = (page: Page) => page.evaluate(() => window.visualViewport?.scale ?? 1);
const sessionSignature = (page: Page) =>
  getSessionState(page).then((session) => JSON.stringify(session ?? {}));

async function openOnPage(page: Page, item: GestureCase): Promise<Locator> {
  await openDeliverRoute(page, item.element, item.demoId, { layout: 'page' });
  await assertTouchEnabled(page);
  const root = deliveryContainer(page);
  await expect(root).toBeVisible();
  // The page must be able to scroll further down, or a blocked swipe and a
  // working one would look the same.
  expect(
    await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight * 1.5)
  ).toBe(true);
  return root;
}

/** Finger travel for a swipe, upward, which scrolls the page down. */
const SWIPE = 200;

async function expectSwipeToScroll(page: Page, at: Point) {
  const before = await scrollY(page);
  await touchDrag(page, at, { x: at.x, y: at.y - SWIPE });
  await expect.poll(() => scrollY(page), { timeout: 3_000 }).toBeGreaterThan(before);
}

async function expectPinchToZoom(page: Page, at: Point) {
  expect(await zoom(page)).toBe(1);
  await touchPinch(page, at, { fromSpread: FINGER_OFFSET * 2 });
  await expect.poll(() => zoom(page), { timeout: 3_000 }).toBeGreaterThan(1);
}

/** Skips a blocked gesture's test and puts the cause and the ticket in the report. */
function gestureTest(block: Block | undefined) {
  if (!block) {
    return { run: test, details: {} };
  }
  return {
    run: test.fixme,
    details: {
      annotation: [
        { type: 'fixme', description: block.cause },
        { type: 'issue', description: `${JIRA}${block.ticket}` },
      ],
    },
  };
}

test.describe('page gestures under touch', () => {
  // The controls: on the page around the element, a swipe scrolls and a pinch
  // zooms. They prove that a failure on an element is the element, not the
  // gesture helpers or the page layout.
  test.describe('outside any element', () => {
    const control: GestureCase = CASES[0];
    const filler = (page: Page) => page.getByTestId('page-filler-before');

    test('a swipe on the page scrolls it', async ({ page }) => {
      await openOnPage(page, control);
      await expectSwipeToScroll(page, await freePoint(filler(page), null, CENTER[0]));
    });

    test('a pinch on the page zooms it', async ({ page }) => {
      await openOnPage(page, control);
      await expectPinchToZoom(page, await freePoint(filler(page), null, CENTER[0]));
    });
  });

  for (const item of CASES) {
    const title = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;

    test.describe(title, () => {
      for (const surface of item.surfaces) {
        const prefer = surface.prefer ?? CENTER[0];

        async function openAt(page: Page): Promise<Point> {
          const root = await openOnPage(page, item);
          const target = await surface.locate(root);
          await centreInViewport(target);
          return freePoint(target, item.handles, prefer);
        }

        const swipe = gestureTest(surface.scrollBlock);
        swipe.run(
          `a swipe starting on the ${surface.name} scrolls the page`,
          swipe.details,
          async ({ page }) => {
            const at = await openAt(page);
            const session = await sessionSignature(page);
            await expectSwipeToScroll(page, at);
            // A scroll is not an answer.
            expect(await sessionSignature(page)).toBe(session);
          }
        );

        const pinch = gestureTest(surface.zoomBlock);
        pinch.run(
          `a pinch over the ${surface.name} zooms the page`,
          pinch.details,
          async ({ page }) => {
            await expectPinchToZoom(page, await openAt(page));
          }
        );
      }

      test('a finger can still drag a handle, without scrolling the page', async ({ page }) => {
        const root = await openOnPage(page, item);
        const { from, to } = await item.handleDrag(page, root);
        const session = await sessionSignature(page);
        const scrolledTo = await scrollY(page);

        await touchDrag(page, from, to, { steps: 20, settleMs: 150 });

        await expect.poll(() => sessionSignature(page), { timeout: 10_000 }).not.toBe(session);
        // The handle claimed the gesture; the page did not pan under it.
        expect(await scrollY(page)).toBe(scrolledTo);
      });
    });
  }
});
