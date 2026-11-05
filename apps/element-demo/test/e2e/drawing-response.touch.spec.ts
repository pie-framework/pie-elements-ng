import { expect, test, type Locator, type Page } from '@playwright/test';
import { deliveryContainer, getSessionState, openDeliverRoute } from './test-helpers';
import { assertTouchEnabled, touchDrag, touchTap } from './touch-helpers';

/**
 * Can a learner draw with a finger?
 *
 * drawing-response draws on a Konva stage. Its delivery code listens for `touchstart`,
 * `touchmove` and `touchend` next to the mouse events (drawing-response/src/delivery/
 * drawing-response/drawable-main.tsx, drawable-text.tsx), and the stage container sets
 * `touch-action: none` so the browser leaves the gesture to it. Every other drawing-response spec
 * drives the stage with `page.mouse`, which reaches none of those listeners.
 *
 * Under the `touch` and `touch-phone` projects (see playwright.config.ts), this draws with a finger and asserts
 * what lands in the session:
 *
 * - a line, and two shapes, each as exactly one new drawable whose ends are where the finger went;
 * - text: adding a text entry puts it in the session, and a double-tap opens it for editing so that
 *   what is typed is saved. Typing itself is the keyboard's; the system on-screen keyboard is not
 *   shown by Chromium emulation.
 */

type Point = { x: number; y: number };

/** Where the finger goes down and lifts, from the stage's top-left corner, in CSS pixels. */
const FROM: Point = { x: 80, y: 80 };
const TO: Point = { x: 300, y: 200 };

type ShapeCase = {
  /** The palette button's accessible name. */
  tool: string;
  /** What the session records the drawable as. */
  type: string;
};

const SHAPES: ShapeCase[] = [
  { tool: 'Line', type: 'LineDrawable' },
  { tool: 'Rectangle', type: 'RectangleDrawable' },
  { tool: 'Circle', type: 'CircleDrawable' },
];

async function openStage(page: Page): Promise<{ root: Locator; stage: Locator }> {
  await assertTouchEnabled(page);
  await openDeliverRoute(page, 'drawing-response');
  const root = deliveryContainer(page);
  await expect(root).toBeVisible();
  const stage = root.locator('canvas').first();
  await expect(stage).toBeVisible({ timeout: 15_000 });
  return { root, stage };
}

async function stagePoint(stage: Locator, at: Point): Promise<Point> {
  const box = await stage.boundingBox();
  if (!box) throw new Error('drawing-response: stage canvas has no bounding box');
  return { x: box.x + at.x, y: box.y + at.y };
}

const drawables = async (page: Page): Promise<any[]> =>
  (await getSessionState(page))?.drawables ?? [];

const texts = async (page: Page): Promise<any[]> => (await getSessionState(page))?.texts ?? [];

test.describe('drawing-response under touch', () => {
  for (const { tool, type } of SHAPES) {
    test(`a finger can draw a ${tool.toLowerCase()}`, async ({ page }) => {
      const { root, stage } = await openStage(page);
      expect(await drawables(page)).toHaveLength(0);

      await touchTap(page, root.getByRole('button', { name: tool, exact: true }));
      await touchDrag(page, await stagePoint(stage, FROM), await stagePoint(stage, TO), {
        settleMs: 100,
      });

      // One drag is one drawable: a handler fed by touch and by the mouse events that follow it
      // would add a second.
      await expect.poll(async () => (await drawables(page)).length, { timeout: 10_000 }).toBe(1);
      const [drawn] = await drawables(page);
      expect(drawn.type).toBe(type);
      // It starts where the finger went down and ends where it lifted.
      expect(drawn.startx).toBeCloseTo(FROM.x, 0);
      expect(drawn.starty).toBeCloseTo(FROM.y, 0);
      if (type !== 'CircleDrawable') {
        // A circle is recorded by its centre and radius, the others by the far corner or end.
        expect(drawn.x).toBeCloseTo(TO.x, 0);
        expect(drawn.y).toBeCloseTo(TO.y, 0);
      }
    });
  }

  test('a finger can add text and edit it with a double-tap', async ({ page }) => {
    const { root, stage } = await openStage(page);
    expect(await texts(page)).toHaveLength(0);

    await touchTap(page, root.getByRole('button', { name: 'Text Entry', exact: true }));
    await expect.poll(async () => (await texts(page)).length, { timeout: 10_000 }).toBe(1);

    // A double-tap, two taps in quick succession on the same spot, opens the entry for editing. Aim
    // inside its placeholder label, a little in from the top-left corner the session records.
    const [entry] = await texts(page);
    const at = await stagePoint(stage, { x: entry.x + 25, y: entry.y + 7 });
    await touchTap(page, at);
    await page.waitForTimeout(90);
    await touchTap(page, at);
    const textarea = root.locator('textarea:visible');
    await expect(textarea).toBeFocused({ timeout: 10_000 });

    await page.keyboard.type('hello');
    await page.keyboard.press('Enter');
    await expect(textarea).toBeHidden();
    await expect.poll(async () => (await texts(page))[0]?.value, { timeout: 10_000 }).toBe('hello');
  });
});
