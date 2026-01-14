import { expect, test } from '@playwright/test';

test.describe('ESM Player Initialization', () => {
  test('should load the page and initialize the player', async ({ page }) => {
    await page.goto('/');

    // Check that the page title is correct
    await expect(page).toHaveTitle('ESM Player Test App');

    // Wait for the player to initialize
    await expect(page.locator('#status')).toContainText(
      'PIE ESM player loaded from local workspace'
    );

    // Check that status shows ready
    await expect(page.locator('#status')).toContainText('Ready to load and render items');

    // Verify load button is enabled
    const loadBtn = page.locator('#load-btn');
    await expect(loadBtn).toBeEnabled();
  });

  test('should display sample items list', async ({ page }) => {
    await page.goto('/');

    // Wait for sample items to render
    await page.waitForSelector('[data-item-id]');

    // Check that we have multiple sample items
    const items = page.locator('.item-button');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // Check that item titles are visible
    await expect(items.first()).toBeVisible();
  });

  test('should handle player initialization failure gracefully', async ({ page }) => {
    // Test error handling by checking UI state when player fails to load
    // This is a canary test - if the player package is missing, we should see an error

    await page.goto('/');

    // Either we see success or error, but not a stuck loading state
    const status = page.locator('#status');
    await expect(status).not.toBeEmpty({ timeout: 5000 });

    // If it failed, the load button should be disabled
    const hasError = await status.locator('.status-message.error').count();
    if (hasError > 0) {
      const loadBtn = page.locator('#load-btn');
      await expect(loadBtn).toBeDisabled();
    }
  });
});
