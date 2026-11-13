import { expect, type Page, test } from '@playwright/test';
import { expectSessionValue, keypad, mathResponse } from './math-keypad-helpers';
import { mountedElement, waitForElementReady } from './test-helpers';

/**
 * `focusFirstInput()` is the element's half of the item player's `focus()` (Focus Hook in
 * docs/PIE_ELEMENT_CONTRACT.md). Against real MathLive the field takes focus as Tab gives it: the
 * next key typed lands in the first answer block, and no keypad opens.
 */

const focusFirstInput = (page: Page, options?: FocusOptions) =>
  mountedElement(page).evaluate((node: any, opts) => node.focusFirstInput(opts), options);

async function openMathInline(page: Page, mode: 'gather' | 'evaluate', query = '') {
  // The demo's evaluate view is the scorer's.
  const role = mode === 'gather' ? 'student' : 'instructor';
  await page.goto(`/math-inline/deliver?mode=${mode}&role=${role}${query}`);
  await waitForElementReady(page);
}

test.describe('math-inline focusFirstInput', () => {
  test('focuses the answer field, ready to type into the first block, with the keypad closed', async ({
    page,
  }) => {
    await openMathInline(page, 'gather');

    expect(await focusFirstInput(page)).toBe(true);
    await expect(mathResponse(mountedElement(page))).toBeFocused();
    await expect(keypad(page)).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).mathVirtualKeyboard?.visible ?? false)).toBe(
      false
    );

    await page.keyboard.type('7');
    await expectSessionValue(page, '7');
  });

  for (const preventScroll of [false, true]) {
    test(`scrolls a field below the fold into view unless preventScroll (${preventScroll})`, async ({
      page,
    }) => {
      // Short enough that the scrolling page layout puts the field below the fold.
      await page.setViewportSize({ width: 1280, height: 320 });
      await openMathInline(page, 'gather', '&layout=page');
      const field = mathResponse(mountedElement(page));
      await field.waitFor();
      const top = () => field.evaluate((el) => el.getBoundingClientRect().top);
      const before = await top();
      expect(before, 'the page layout puts the field below the fold').toBeGreaterThan(320);

      expect(await focusFirstInput(page, { preventScroll })).toBe(true);
      await expect(field).toBeFocused();
      // MathLive renders its caret a moment after focus, which could scroll; measure after that.
      await page.waitForTimeout(200);
      if (preventScroll) {
        expect(await top()).toBe(before);
      } else {
        expect(await top()).toBeLessThan(320);
      }
    });
  }

  test('resolves false in evaluate, where the response is static math', async ({ page }) => {
    await openMathInline(page, 'evaluate');

    expect(await focusFirstInput(page)).toBe(false);
    await expect(mountedElement(page).locator('math-field')).toHaveCount(0);
  });
});
