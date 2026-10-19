import { expect, test, type Locator, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';
import { assertTouchEnabled, touchSelect, touchTap } from './touch-helpers';

/**
 * Can a finger operate the elements a learner taps rather than drags?
 *
 * `graph-elements.touch.spec.ts` covers dragging. Most elements are operated by
 * a tap instead, and a tap is not a click: the browser sends pointer and touch
 * events, then compatibility mouse events, then a click, and on a touchscreen
 * `:hover` stays on whatever was tapped last. So these specs check, under the
 * `touch` project only (see playwright.config.ts):
 *
 * - a tap selects, and commits exactly one session change - a handler bound to
 *   both `mousedown` and `click` would toggle twice and land back where it was;
 * - a second tap deselects (or, for a radio, keeps the selection);
 * - once deselected, the choice looks exactly as it did before it was touched.
 */

type TapCase = {
  element: string;
  demoId?: string;
  /** The control a finger taps. */
  target: (root: Locator) => Locator;
  /** Taps that make one selection; defaults to one tap on `target`. */
  select?: (page: Page, root: Locator, target: Locator) => Promise<void>;
  /** How many selections the session records. */
  selections: (session: any) => number;
  /** A second tap on the same control deselects it, as a checkbox does; a radio stays selected. */
  toggles: boolean;
  /** The area whose look is compared before and after a select-deselect round trip. */
  look?: (target: Locator) => Locator;
  /** Set when the round-trip look is a confirmed touch defect; names the mechanism. */
  lookDefect?: string;
};

const visibleFirst = (root: Locator, selector: string) =>
  root.locator(selector).filter({ visible: true }).first();

const labelOf = (input: Locator) => input.locator('xpath=ancestor::label[1]');
const CASES: TapCase[] = [
  {
    element: 'multiple-choice',
    demoId: 'radio-simple',
    target: (root) => visibleFirst(root, 'input[type="radio"]'),
    selections: (session) => session?.value?.length ?? 0,
    toggles: false,
  },
  {
    element: 'multiple-choice',
    demoId: 'basic-checkbox',
    target: (root) => visibleFirst(root, 'input[type="checkbox"]'),
    selections: (session) => session?.value?.length ?? 0,
    toggles: true,
    look: labelOf,
  },
  {
    element: 'select-text',
    // Hidden sample tokens precede the selectable ones.
    target: (root) => visibleFirst(root, '.tokenRootClass[data-indexkey]'),
    selections: (session) => session?.selectedTokens?.length ?? 0,
    toggles: true,
    look: (token) => token,
  },
  {
    element: 'ebsr',
    // Part A's first choice.
    target: (root) => visibleFirst(root, 'input[type="checkbox"], input[type="radio"]'),
    selections: (session) => session?.value?.partA?.value?.length ?? 0,
    toggles: true,
    look: labelOf,
  },
  {
    element: 'inline-dropdown',
    target: (root) => visibleFirst(root, 'button[aria-haspopup="listbox"]'),
    // One tap opens the menu, a second picks an option from it.
    select: async (page, _root, target) => {
      await touchTap(page, target);
      const option = page
        .locator('[role="menuitem"], [role="option"]')
        .filter({ visible: true })
        .first();
      await touchTap(page, option);
    },
    selections: (session) => Object.keys(session?.value ?? {}).length,
    toggles: false,
  },
  {
    element: 'matrix',
    target: (root) => visibleFirst(root, 'input[type="radio"]'),
    selections: (session) => Object.keys(session?.value ?? {}).length,
    toggles: false,
  },
  {
    element: 'likert',
    target: (root) => visibleFirst(root, 'input[type="radio"]'),
    selections: (session) => (session?.value === undefined ? 0 : 1),
    toggles: false,
  },
  {
    element: 'hotspot',
    // The shapes are drawn on one canvas; the demo has a hotspot under its centre.
    target: (root) => visibleFirst(root, 'canvas'),
    selections: (session) => session?.answers?.length ?? 0,
    toggles: true,
    look: (canvas) => canvas,
  },
];

/** Counts the session changes the player reports, so a double toggle shows as two. */
async function countSessionChanges(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __sessionChanges: number };
    w.__sessionChanges = 0;
    document.addEventListener(
      'session-changed',
      (event) => {
        if ((event.target as Element | null)?.tagName === 'PIE-ELEMENT-PLAYER') {
          w.__sessionChanges++;
        }
      },
      true
    );
  });
}

const sessionChanges = (page: Page) =>
  page.evaluate(() => (window as unknown as { __sessionChanges: number }).__sessionChanges);
const resetSessionChanges = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { __sessionChanges: number }).__sessionChanges = 0;
  });

/** Lets a stray second change arrive before the count is read. */
const SETTLE_MS = 750;

async function openForTouch(
  page: Page,
  item: TapCase
): Promise<{ root: Locator; target: Locator }> {
  await countSessionChanges(page);
  await openDeliverRoute(page, item.element, item.demoId);
  await assertTouchEnabled(page);
  const root = deliveryContainer(page);
  await expect(root).toBeVisible();
  const target = item.target(root);
  await target.waitFor({ state: 'visible', timeout: 15_000 });
  await resetSessionChanges(page);
  return { root, target };
}

async function select(page: Page, item: TapCase, root: Locator, target: Locator) {
  await (item.select ? item.select(page, root, target) : touchTap(page, target));
}

async function expectSelections(page: Page, item: TapCase, count: number) {
  await expect
    .poll(async () => item.selections(await getSessionState(page)), { timeout: 10_000 })
    .toBe(count);
}

/** Taps land with ripples and transitions still running; screenshot the settled state. */
const settledShot = async (page: Page, area: Locator) => {
  await page.waitForTimeout(SETTLE_MS);
  return area.screenshot({ animations: 'disabled' });
};

test.describe('tap-operated elements under touch', () => {
  for (const item of CASES) {
    const title = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;

    test(`${title}: a tap selects, with one session change`, async ({ page }) => {
      const { root, target } = await openForTouch(page, item);

      await select(page, item, root, target);

      await expectSelections(page, item, 1);
      await page.waitForTimeout(SETTLE_MS);
      expect(await sessionChanges(page)).toBe(1);
    });

    if (item.toggles) {
      test(`${title}: a second tap deselects`, async ({ page }) => {
        const { root, target } = await openForTouch(page, item);

        await select(page, item, root, target);
        await expectSelections(page, item, 1);
        await touchTap(page, target);

        await expectSelections(page, item, 0);
        await page.waitForTimeout(SETTLE_MS);
        expect(await sessionChanges(page)).toBe(2);
      });
    } else if (!item.select) {
      // Only for a control a single tap selects. A custom `select`, as in
      // inline-dropdown, opens a menu first, so a second tap there reopens the
      // menu rather than tapping the selected value again.
      test(`${title}: a second tap keeps the selection`, async ({ page }) => {
        const { root, target } = await openForTouch(page, item);

        await select(page, item, root, target);
        await expectSelections(page, item, 1);
        await touchTap(page, target);

        await page.waitForTimeout(SETTLE_MS);
        await expectSelections(page, item, 1);
        expect(await sessionChanges(page)).toBe(1);
      });
    }

    const look = item.look;
    if (item.toggles && look) {
      const lookTest = item.lookDefect ? test.fixme : test;
      // Puts the defect in the report next to the skipped test, not only here.
      const details = item.lookDefect
        ? { annotation: { type: 'fixme', description: item.lookDefect } }
        : {};

      lookTest(`${title}: a deselected choice looks untouched`, details, async ({ page }) => {
        const { root, target } = await openForTouch(page, item);
        const area = look(target);
        const untouched = await settledShot(page, area);

        await select(page, item, root, target);
        await expectSelections(page, item, 1);
        const selected = await settledShot(page, area);
        // Guards the comparison below: if selecting changed nothing visible,
        // an unchanged deselected look would prove nothing.
        expect(selected.equals(untouched), 'selecting should change how the choice looks').toBe(
          false
        );

        await touchTap(page, target);
        await expectSelections(page, item, 0);
        const deselected = await settledShot(page, area);
        expect(deselected.equals(untouched), 'the deselected choice should look untouched').toBe(
          true
        );
      });
    }
  }
});

/**
 * extended-text-entry's annotations are a scorer's tool: with `annotationsEnabled`
 * they are on in evaluate mode or for an instructor. A scorer selects a passage of
 * the response, and the annotation menu opens over it.
 */
test.describe('extended-text-entry annotations under touch', () => {
  const ANNOTATIONS_ROUTE =
    '/extended-text-entry/deliver?mode=evaluate&role=instructor&demo=annotations';

  async function openAnnotations(page: Page): Promise<Locator> {
    await page.goto(ANNOTATIONS_ROUTE);
    await page.waitForLoadState('networkidle');
    await assertTouchEnabled(page);
    const response = deliveryContainer(page).locator('p', { hasText: 'Plants need water' }).first();
    await response.waitFor({ state: 'visible', timeout: 15_000 });
    return response;
  }

  /** Selects the response's first word, "Plants". */
  const selectFirstWord = (response: Locator) =>
    response.evaluate((paragraph) => {
      const range = document.createRange();
      range.setStart(paragraph.firstChild as Node, 0);
      range.setEnd(paragraph.firstChild as Node, 'Plants'.length);
      const selection = getSelection() as Selection;
      selection.removeAllRanges();
      selection.addRange(range);
    });

  /** The menu lists the predefined annotations, "good" first among them. */
  const annotationMenu = (page: Page) =>
    page.locator('.MuiPopover-paper').filter({ hasText: 'good' });

  // The control for the touch test below: the same menu, the same check, opened
  // with a mouse. It proves the touch failure is the input, not the test.
  test('a mouse selection opens the annotation menu', async ({ page }) => {
    const response = await openAnnotations(page);
    const box = await response.boundingBox();
    if (!box) {
      throw new Error('The response has no bounding box');
    }
    const y = box.y + 8;

    await page.mouse.move(box.x + 2, y);
    await page.mouse.down();
    await page.mouse.move(box.x + 60, y, { steps: 5 });
    await page.mouse.up();

    await expect(annotationMenu(page)).toBeVisible();
  });

  // Selecting text by touch - long-press, then the selection handles - is a moved
  // touch, which gets no compatibility mouse events, so no `mouseup` arrives. The
  // annotation editor therefore also reads the selection once it settles.
  test('a touch selection opens the annotation menu', async ({ page }) => {
    const response = await openAnnotations(page);
    const box = await response.boundingBox();
    if (!box) {
      throw new Error('The response has no bounding box');
    }

    await touchSelect(page, { x: box.x + 20, y: box.y + 8 }, () => selectFirstWord(response));

    expect(await page.evaluate(() => String(getSelection()))).toBe('Plants');
    await expect(annotationMenu(page)).toBeVisible();
  });
});
