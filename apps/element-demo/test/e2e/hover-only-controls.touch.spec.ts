import { expect, test, type Page } from '@playwright/test';
import { expectSessionValue, key, openKeypad } from './math-keypad-helpers';
import {
  deliveryContainer,
  getSessionState,
  openDeliverRoute,
  waitForMathRendering,
} from './test-helpers';
import { assertTouchEnabled, centerOf, touchTap, waitForSettled } from './touch-helpers';

/**
 * Can a scorer reach a control that the desktop opens on hover, when the device has no hover?
 *
 * A touchscreen has no pointer to rest on a control, so anything that opens only on `mouseenter` or
 * `:hover` has to give a finger another way in. These specs reach each such control by tap alone,
 * under the `touch` and `touch-phone` projects (see playwright.config.ts).
 *
 * Survey of the delivery code for hover-opened content (`onMouseEnter`/`onMouseOver`, MUI
 * `Tooltip`, `title`):
 *
 * - math-inline: in evaluate, the correct-answer toggle sits in an MUI `Tooltip` on the response
 *   (`StyledTooltip`, shown when `disabled && correctness`), and the existing specs open it with
 *   `hover()`. The same tooltip holds the teacher instructions, rationale and feedback, so a
 *   scorer who cannot open it loses those too. The tooltip sets `enterTouchDelay={0}`, but one tap
 *   does not open it; the second does (see the `fixme` below). Covered below.
 * - hotspot: in evaluate, each shape's correct/incorrect icon shows its text ("Correct", "Incorrect"
 *   and so on) in a Konva tooltip that opens on `mouseenter` only
 *   (hotspot/src/delivery/hotspot/image-konva-tooltip.tsx). Covered below.
 * - math-templated: its `Tooltip` holds the keypad and is opened by tapping the response, which
 *   `math-keypad.touch.spec.ts` covers. It carries no hover-only content.
 * - charting, fraction-model, categorize, match-list, placement-ordering, image-cloze-association,
 *   multiple-choice, hotspot shapes and `@pie-lib/mask-markup` blanks: `onMouseEnter` only sets a
 *   hover style or the cursor. Nothing is shown that a learner could not see otherwise, so there is
 *   nothing to reach. charting's line and bar handles also set the same state on `touchstart`.
 * - number-line's point chooser buttons, match-list answers and the graph titles carry a `title`
 *   attribute that repeats text already on screen.
 *
 * Elements are kept to the ones the survey found; a control that turns up later needs a case here.
 */

type Rect = { x: number; y: number; width: number; height: number };

const JIRA = 'https://illuminate.atlassian.net/browse/';

/**
 * Moves to evaluate as the scorer does on a tablet: by tapping the Scorer toggle.
 *
 * Not by `switchToEvaluate`, which clicks it with the mouse and so leaves a mouse pointer parked
 * over that button. After the next tap, Chromium moves its mouse back there, which sends `mouseout`
 * to the control under test and closes a tooltip a touch had just opened. A tablet has no such
 * pointer, so the specs here use none.
 */
async function switchToEvaluateByTouch(page: Page) {
  await touchTap(page, page.locator('[data-testid="role-instructor"]'));
  await page.waitForURL((url) => url.searchParams.get('mode') === 'evaluate', { timeout: 10_000 });
  await waitForMathRendering(page);
}

/** Types `1` into a math-inline response by tapping its keypad, then waits for the session to hold it. */
async function answerByTap(page: Page) {
  await openKeypad(page, 'math-inline');
  await touchTap(page, key(page, 'one'), { holdMs: 100 });
  await expectSessionValue(page, '1');
}

test.describe('hover-only controls under touch', () => {
  /**
   * math-inline in evaluate, with a response entered by tap. A wrong answer is what makes evaluate
   * offer the correct one. Returns the response and the point a finger lands on.
   */
  async function openMathInlineEvaluate(page: Page) {
    await answerByTap(page);
    await switchToEvaluateByTouch(page);

    // Evaluate swaps the response for a `.block-response` target that the tooltip wraps; tap it
    // once it has stopped moving.
    const target = deliveryContainer(page).locator('.block-response').first();
    await expect(target).toBeVisible({ timeout: 10_000 });
    await waitForSettled(target);
    return { at: await centerOf(target) };
  }

  // A learner's finger rests for about this long. An instant tap, which `touchTap` sends by
  // default, never opens the tooltip at all: MUI starts the open on a timer that `touchend` cancels.
  const FINGER_DOWN_MS = 150;

  test.describe('math-inline correct-answer toggle', () => {
    const MECHANISM =
      'The first tap on the response in evaluate does not open the tooltip that holds the ' +
      'correct-answer toggle, teacher instructions, rationale and feedback; the second does. ' +
      "Logged on the first tap: the compatibility `mousedown` focuses the response's textarea " +
      '(focusin), and `focusout` follows about 8ms later with no related target - something blurs ' +
      "it. MUI Tooltip's `handleBlur` reads that as the pointer leaving and closes the tooltip " +
      'the touch had just opened (enterTouchDelay is 0). The second tap moves no focus, so the ' +
      'tooltip stays open. Hover is unaffected because it moves no focus. With `touchend` inside ' +
      'about 100ms the touch timer is cancelled and the tooltip never opens, however many taps. ' +
      'Not traced to the call that blurs the field: look at math-inline/src/delivery/main.tsx ' +
      '`onBlur` / `onFocus` and the math-input mq/static.tsx `blur()`.';
    const TICKET = 'PIE-1470';

    test.fixme('one tap on the response opens the toggle', async ({ page }, testInfo) => {
      testInfo.annotations.push(
        { type: 'fixme', description: MECHANISM },
        { type: 'issue', description: `${JIRA}${TICKET}` }
      );
      const { at } = await openMathInlineEvaluate(page);

      await touchTap(page, at, { holdMs: FINGER_DOWN_MS });
      await expect(page.getByText('Show correct answer')).toBeVisible({ timeout: 5_000 });
    });

    // What works today: tapping again. It guards the toggle itself, so the case above can be
    // un-fixme'd without a gap.
    test('a second tap reaches the toggle, and tapping it shows the correct answer', async ({
      page,
    }) => {
      const { at } = await openMathInlineEvaluate(page);
      const toggle = page.getByText('Show correct answer');
      await expect(toggle).toHaveCount(0);

      await touchTap(page, at, { holdMs: FINGER_DOWN_MS });
      // The first tap's focus change has settled once the response no longer holds focus.
      await expect(page.locator('.block-response textarea:focus')).toHaveCount(0);
      await touchTap(page, at, { holdMs: FINGER_DOWN_MS });
      await expect(toggle).toBeVisible({ timeout: 5_000 });

      await touchTap(page, toggle, { holdMs: FINGER_DOWN_MS });
      await expect(page.getByText('Hide correct answer')).toBeVisible({ timeout: 5_000 });
    });
  });

  test.describe('hotspot evaluate icon', () => {
    // Konva draws the icon on a canvas, so a screenshot of the area under it is the only way to see
    // the tooltip: it adds a white tag with text below the icon.
    const MECHANISM =
      "The evaluate icon's tooltip opens on Konva's `mouseenter` only " +
      '(hotspot/src/delivery/hotspot/image-konva-tooltip.tsx: `onMouseEnter`/`onMouseLeave`, no ' +
      'touch handler). A tap sends `touchstart`/`touchend`, which Konva does not turn into ' +
      '`mouseenter`, so a scorer on a tablet cannot read why a shape is marked wrong.';
    const TICKET = 'PIE-1474';

    /** The rectangle the spec selects and marks: the demo's second one. */
    const RECTANGLE_ID = '4';

    /** A screenshot that has stopped changing: two in a row are identical. */
    async function settledScreenshot(page: Page, clip: Rect): Promise<Buffer> {
      let latest = await page.screenshot({ clip });
      await expect
        .poll(async () => {
          const next = await page.screenshot({ clip });
          const same = next.equals(latest);
          latest = next;
          return same;
        })
        .toBe(true);
      return latest;
    }

    /**
     * Selects the demo's rectangle by tap, moves to evaluate, and returns where evaluate puts that
     * rectangle's icon (its centre) and whether the area around the tooltip has changed since.
     */
    async function openEvaluate(page: Page) {
      await assertTouchEnabled(page);
      await openDeliverRoute(page, 'hotspot');
      const root = deliveryContainer(page);
      const canvas = root.locator('canvas').first();
      await expect(canvas).toBeVisible();

      const rect = await page.evaluate((id) => {
        const host: any = document.querySelector('pie-element-player');
        const found = (host?.model?.shapes?.rectangles ?? []).find((r: any) => r.id === id);
        return found ? JSON.parse(JSON.stringify(found)) : undefined;
      }, RECTANGLE_ID);
      if (!rect) {
        throw new Error(`hotspot: the demo has no rectangle ${RECTANGLE_ID}; pick another one`);
      }
      const stage = async () => {
        const box = await canvas.boundingBox();
        if (!box) throw new Error('hotspot: stage canvas has no bounding box');
        return box;
      };

      let box = await stage();
      await touchTap(page, {
        x: box.x + rect.x + rect.width / 2,
        y: box.y + rect.y + rect.height / 2,
      });
      await expect
        .poll(async () => (await getSessionState(page))?.answers?.length ?? 0, { timeout: 10_000 })
        .toBe(1);

      await switchToEvaluateByTouch(page);
      // Evaluate adds a row above the stage and redraws it, so wait for the stage to settle and
      // measure again.
      await waitForSettled(canvas);
      box = await stage();
      const icon = { x: box.x + rect.x + rect.width / 2, y: box.y + rect.y + rect.height / 2 };
      const clip = { x: icon.x - 80, y: icon.y - 20, width: 160, height: 90 };
      const base = await settledScreenshot(page, clip);
      const changed = async () => !(await page.screenshot({ clip })).equals(base);
      return { icon, changed };
    }

    // The control: it shows the screenshot can see the tooltip and that the icon is where this spec
    // thinks it is, so a failure of the tap case below points at the element and not at the spec.
    test('a mouse hover on the icon shows its tooltip', async ({ page }) => {
      const { icon, changed } = await openEvaluate(page);

      await page.mouse.move(icon.x, icon.y);
      await expect.poll(changed).toBe(true);
    });

    test.fixme('a tap on the icon shows its tooltip', async ({ page }, testInfo) => {
      testInfo.annotations.push(
        { type: 'fixme', description: MECHANISM },
        { type: 'issue', description: `${JIRA}${TICKET}` }
      );
      const { icon, changed } = await openEvaluate(page);

      await touchTap(page, icon);
      await expect.poll(changed).toBe(true);
    });
  });
});
