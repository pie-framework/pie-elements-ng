/**
 * Manual Test: Local Player with Local Elements
 *
 * This test validates that the local pie-esm-player can successfully
 * load and render a local multiple-choice element.
 */

import { expect, test } from '@playwright/test';

test.describe('Local Player with Local Elements', () => {
  test('should load local player and render local multiple-choice element', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for app to initialize
    await expect(page.locator('#status')).toContainText('Ready to load player', { timeout: 10000 });

    // Verify local player build is detected
    await expect(page.locator('#status')).toContainText('Local player build detected');

    // Select "Multiple Choice - Simple" item
    await page.click('button[data-item-id="multiple-choice-simple"]');

    // Wait for status to update
    await expect(page.locator('#status')).toContainText('Selected item: Multiple Choice - Simple');

    // Verify element version controls are shown
    await expect(page.locator('.element-version-control h4')).toContainText('multiple-choice');

    // Switch element to Local Build
    const localRadio = page.locator('input[name="element-multiple-choice"][value="local:local"]');
    await localRadio.check();

    // Verify radio is checked
    await expect(localRadio).toBeChecked();

    // Click Load Player button
    await page.click('#load-btn');

    // Wait for loading to start
    await expect(page.locator('#player-mount')).toContainText('Loading player...', {
      timeout: 2000,
    });

    // Wait for player to load successfully
    await expect(page.locator('#status')).toContainText('Player loaded successfully (local)', {
      timeout: 15000,
    });

    // Wait for elements to load
    await expect(page.locator('#status')).toContainText('Loaded 1 element(s)', { timeout: 10000 });

    // Wait for rendering
    await expect(page.locator('#status')).toContainText('Rendering player...', { timeout: 5000 });

    // Verify player web component is present
    const playerElement = page.locator('pie-esm-player');
    await expect(playerElement).toBeVisible({ timeout: 10000 });

    // Wait for final success message
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 15000,
    });

    // Take a screenshot for visual verification
    await page.screenshot({ path: '/tmp/local-player-local-element.png', fullPage: true });

    console.log('✅ Test passed! Screenshot saved to /tmp/local-player-local-element.png');
  });

  test('should render the multiple-choice question content', async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');

    // Wait for initialization
    await page.waitForSelector('#status:has-text("Ready to load player")', { timeout: 10000 });

    // Select item and switch to local
    await page.click('button[data-item-id="multiple-choice-simple"]');
    const localRadio = page.locator('input[name="element-multiple-choice"][value="local:local"]');
    await localRadio.check();

    // Load player
    await page.click('#load-btn');

    // Wait for success
    await page.waitForSelector('#status:has-text("Item loaded and rendered successfully")', {
      timeout: 30000,
    });

    // Wait a bit for the element to fully render
    await page.waitForTimeout(2000);

    // Check for the question prompt "What is 2 + 2?"
    const playerContent = page.locator('pie-esm-player');
    await expect(playerContent).toContainText('What is 2 + 2?', { timeout: 5000 });

    // Verify choices are rendered
    await expect(playerContent).toContainText('3');
    await expect(playerContent).toContainText('4');
    await expect(playerContent).toContainText('5');
    await expect(playerContent).toContainText('6');

    console.log('✅ Multiple choice question content is fully rendered!');
  });
});
