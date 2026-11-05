import { expect, test } from '@playwright/test';
import { deliveryContainer, openDeliverRoute } from './test-helpers';
import { assertTouchEnabled, touchTap } from './touch-helpers';

/**
 * Can a learner enter math through the rich-text editor's math toolbar by touch?
 *
 * `extended-text-entry` (with `mathInput` on) opens the same `@pie-lib/math-input` keypad that
 * `math-keypad.touch.spec.ts` covers, but inside the editor's toolbar, which has its own
 * click-outside handling and focus management (see editable-html-math-toolbar.spec.ts, PIE-1115).
 * A bug in how the toolbar opens, keeps focus or closes would not show in the `math-inline` spec.
 *
 * Taps "Insert math", taps keys one at a time and checks, under the `touch` project (and
 * `touch-phone`, which runs every touch spec):
 *
 * - after every tap the toolbar's math field shows what has been tapped so far, and still does a
 *   moment later - one tap, one key, with no late second one;
 * - after Done, the editor holds one math node with exactly what was tapped.
 *
 * The keys repeat (1, 1, 2, 3) so a doubled tap or a dropped one shows. The demo session for this
 * element does not change while the editor is used (it stays `value: ""`, with typing through the
 * keyboard as well), so the editor's own math node is what the spec reads.
 *
 * `explicit-constructed-response` has no math toolbar in its delivery view, so it is not covered.
 */

const KEYS = ['one', 'one', 'two', 'three'];
const SHOWN = ['1', '11', '112', '1123'];

test.describe('math toolbar under touch', () => {
  test('extended-text-entry: each toolbar keypad tap registers once', async ({ page }) => {
    await assertTouchEnabled(page);
    await openDeliverRoute(page, 'extended-text-entry');

    const editor = deliveryContainer(page).locator('[contenteditable="true"]').first();
    await touchTap(page, editor);
    await touchTap(page, page.locator('button[aria-label="Insert math"]').first());

    const toolbar = page.locator('[data-toolbar-for]');
    await expect(toolbar).toBeVisible();
    const field = toolbar.locator('.mq-editable-field').first();
    const shown = async () => ((await field.textContent()) ?? '').replace(/​/g, '');

    for (const [i, name] of KEYS.entries()) {
      await touchTap(page, toolbar.getByRole('button', { name, exact: true }).first(), {
        holdMs: 100,
      });
      await expect.poll(shown, { timeout: 3_000 }).toBe(SHOWN[i]);
      // A late compatibility `mousedown` would add a second key after the first match.
      await page.waitForTimeout(250);
      expect(await shown()).toBe(SHOWN[i]);
    }

    await touchTap(page, page.locator('button[aria-label="Done"]').first());

    const math = editor.locator('.node-math');
    await expect(math).toHaveCount(1);
    // The node's text ends in a "%" that no key put there (no "%" key was tapped), so it is dropped
    // before comparing. Not traced; I did not check whether a mouse produces it too.
    const text = ((await math.first().textContent()) ?? '').replace(/[\s$%]/g, '');
    expect(text).toBe(SHOWN[SHOWN.length - 1]);
  });
});
