import { expect, type Locator, type Page, test } from '@playwright/test';
import { keypad, mathResponse } from './math-keypad-helpers';
import { mountedElement, waitForElementReady } from './test-helpers';

/**
 * Against real MathLive, the learner's focus on the answer field opens the keypad, as in
 * math-templated. The focus hook's does not (math-inline-focus-first-input.spec.ts).
 */

/**
 * Native focus, as Tab gives it, then a pause: MathLive focuses its keyboard sink again 60ms after
 * the field takes focus, which would pull focus back out of a keypad an ArrowDown moved it into.
 */
async function focusAsTab(field: Locator) {
  await field.evaluate((el) => HTMLElement.prototype.focus.call(el));
  await field.page().waitForTimeout(150);
}

async function openMathInline(page: Page) {
  await page.goto('/math-inline/deliver?mode=gather&role=student');
  await waitForElementReady(page);
}

test.describe('math-inline keypad on focus', () => {
  test('opens when the answer field takes focus, and ArrowDown moves into it', async ({ page }) => {
    await openMathInline(page);
    const field = mathResponse(mountedElement(page));

    await focusAsTab(field);
    await expect(field).toBeFocused();
    await expect(keypad(page)).toHaveCount(1);

    await page.keyboard.press('ArrowDown');
    await expect(keypad(page).getByRole('button').first()).toBeFocused();
  });

  test('closes on Escape with focus left in the field, and ArrowDown opens it again', async ({
    page,
  }) => {
    await openMathInline(page);
    const field = mathResponse(mountedElement(page));

    await focusAsTab(field);
    await expect(keypad(page)).toHaveCount(1);

    await page.keyboard.press('Escape');
    await expect(keypad(page)).toHaveCount(0);
    await expect(field).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(keypad(page)).toHaveCount(1);
    await expect(keypad(page).getByRole('button').first()).toBeFocused();
  });

  // The keypad instructions the field is described by: ArrowDown moves into the keypad, Tab moves
  // between its buttons, and Escape closes it and returns to the field.
  test('follows the keypad instructions', async ({ page }) => {
    await openMathInline(page);
    const field = mathResponse(mountedElement(page));
    const keys = keypad(page).getByRole('button');

    await focusAsTab(field);
    await page.keyboard.press('ArrowDown');
    await expect(keys.nth(0)).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(keys.nth(1)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(keypad(page)).toHaveCount(0);
    await expect(field).toBeFocused();
    // MathLive's own focus of the field, 60ms on, does not open the keypad again.
    await page.waitForTimeout(150);
    await expect(keypad(page)).toHaveCount(0);
    await expect(field).toBeFocused();
  });

  test('a click on the field opens it after focusFirstInput left it closed', async ({ page }) => {
    await openMathInline(page);
    const field = mathResponse(mountedElement(page));

    expect(await mountedElement(page).evaluate((node: any) => node.focusFirstInput())).toBe(true);
    await expect(field).toBeFocused();
    await expect(keypad(page)).toHaveCount(0);

    await field.click();
    await expect(keypad(page)).toHaveCount(1);
  });
});
