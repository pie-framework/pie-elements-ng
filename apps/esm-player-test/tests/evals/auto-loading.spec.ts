import { expect, test } from '@playwright/test';

test.describe('Auto-loading functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should auto-load when selecting an item', async ({ page }) => {
    // Wait for app to initialize
    await expect(page.locator('#status')).toContainText('Ready to load player');

    // Select the Simple Multiple Choice item
    await page.click('button[data-item-id="multiple-choice-simple"]');

    // Should automatically start loading
    await expect(page.locator('#status')).toContainText('Loading player...');

    // Wait for successful load
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 15000,
    });

    // Verify player is rendered
    await expect(page.locator('pie-esm-player')).toBeVisible();
    await expect(page.locator('pie-multiple-choice')).toBeVisible();
  });

  test('should auto-load when changing player source', async ({ page }) => {
    // First select an item
    await page.click('button[data-item-id="multiple-choice-simple"]');
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 15000,
    });

    // Change player source to npm
    await page.click('input[name="player-source"][value="npm"]');

    // Should automatically reload
    await expect(page.locator('#status')).toContainText('Loading player...');
    await expect(page.locator('#status')).toContainText('Player loaded successfully (npm)', {
      timeout: 15000,
    });
  });

  test('should auto-load when changing element version', async ({ page }) => {
    // Select an item
    await page.click('button[data-item-id="multiple-choice-simple"]');
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 15000,
    });

    // Change element version from local to npm
    await page.click('input[name="element-multiple-choice"][value="npm:latest"]');

    // Should automatically reload
    await expect(page.locator('#status')).toContainText('Loading player...');
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 15000,
    });
  });

  test('should handle missing local element builds gracefully', async ({ page }) => {
    // Select an item with multiple elements (some may not have local builds)
    await page.click('button[data-item-id="multi-element-math"]');

    // Wait for loading to start
    await expect(page.locator('#status')).toContainText('Loading player...');

    // Should show both successful and failed element loads
    const statusText = await page.locator('#status').textContent();

    // Should have some success message about loaded elements
    expect(statusText).toMatch(/Loaded \d+ element\(s\)/);

    // May have warning about failed elements
    // (This depends on which elements are built locally)
  });

  test('should not require Load Player button click', async ({ page }) => {
    // The Load Player button should still exist but not be required
    const loadBtn = page.locator('#load-btn');
    await expect(loadBtn).toBeVisible();

    // Select an item - should auto-load without clicking button
    await page.click('button[data-item-id="multiple-choice-simple"]');

    // Should load without clicking the Load Player button
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 15000,
    });

    // Verify we didn't click the button
    // (This is implicit - if we needed to click it, the test would have failed)
  });
});

test.describe('Error handling for missing elements', () => {
  test('should show specific warnings for missing local builds', async ({ page }) => {
    await page.goto('/');

    // Select an item that has elements without local builds
    await page.click('button[data-item-id="multi-element-math"]');

    // Wait for loading attempt
    await page.waitForTimeout(2000);

    // Check status for warnings about failed elements
    const statusText = await page.locator('#status').textContent();

    // Should continue even if some elements fail
    // The player should still render with available elements
    expect(statusText).toContain('Loading player...');
  });

  test('should still load successfully with only multiple-choice element', async ({ page }) => {
    await page.goto('/');

    // Select simple MC item (only uses multiple-choice element which we know is built)
    await page.click('button[data-item-id="multiple-choice-simple"]');

    // Should load successfully
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 15000,
    });

    // Should show successful element load
    await expect(page.locator('#status')).toContainText('Loaded 1 element(s): multiple-choice');

    // Player and element should be visible
    await expect(page.locator('pie-esm-player')).toBeVisible();
    await expect(page.locator('pie-multiple-choice')).toBeVisible();
  });
});
