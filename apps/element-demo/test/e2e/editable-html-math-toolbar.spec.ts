/**
 * Regression tests for the math toolbar in the tip-tap rich-text editor (PIE-1115).
 *
 * The click that inserts a math node used to reach the toolbar's click-outside listener
 * and close it at once, and the deferred autofocus then threw
 * "Cannot read properties of null (reading 'focus')".
 */

import { expect, test, type Page } from '@playwright/test';

const AUTHOR_ROUTE = '/multiple-choice/author';

// Every rich-text field renders its own toolbar, so scope to the prompt's (the second editor).
const insertMathButton = (page: Page) =>
  page
    .locator('[contenteditable="true"]')
    .nth(1)
    .locator('xpath=ancestor::*[.//button[@aria-label="Insert math"]][1]')
    .locator('button[aria-label="Insert math"]');

test.describe('editable-html math toolbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(AUTHOR_ROUTE);
    // the second contenteditable is the prompt (the first is teacher instructions)
    const prompt = page.locator('[contenteditable="true"]').nth(1);
    await prompt.waitFor();
    await prompt.click();
  });

  test('inserting math opens the toolbar and focuses the math input without errors', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await insertMathButton(page).click();

    const toolbar = page.locator('[data-toolbar-for]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator('textarea')).toBeFocused();

    // let the deferred autofocus run before asserting nothing threw
    await page.waitForTimeout(200);
    expect(pageErrors).toEqual([]);
  });

  test('clicking outside the open toolbar closes it', async ({ page }) => {
    await insertMathButton(page).click();
    await expect(page.locator('[data-toolbar-for]')).toBeVisible();

    await page.getByText('Settings', { exact: true }).click();

    await expect(page.locator('[data-toolbar-for]')).toHaveCount(0);
  });

  test('a mousedown outside without a click (scrollbar drag) keeps the toolbar open', async ({
    page,
  }) => {
    await insertMathButton(page).click();
    await expect(page.locator('[data-toolbar-for]')).toBeVisible();

    await page.evaluate(() =>
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
    );

    await expect(page.locator('[data-toolbar-for]')).toBeVisible();
  });

  test('clicking an existing math node reopens the toolbar with focus in the math input', async ({
    page,
  }) => {
    await insertMathButton(page).click();
    await expect(page.locator('[data-toolbar-for]')).toBeVisible();

    await page.getByText('Settings', { exact: true }).click();
    await expect(page.locator('[data-toolbar-for]')).toHaveCount(0);

    await page.locator('[class*="math-node-"]').first().click();

    const toolbar = page.locator('[data-toolbar-for]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar.locator('textarea')).toBeFocused();
  });
});
