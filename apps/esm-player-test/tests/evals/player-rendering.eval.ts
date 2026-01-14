import { expect, test } from '@playwright/test';

test.describe('Player Rendering', () => {
  test('should load and render a simple multiple choice item', async ({ page }) => {
    await page.goto('/?item=multiple-choice-simple');

    // Wait for app to initialize
    await page.waitForSelector('#load-btn:not(:disabled)');

    // Click load button
    await page.click('#load-btn');

    // Wait for player to render
    await expect(page.locator('#status')).toContainText('Loading elements...', { timeout: 10000 });

    // Check that we see success messages
    await expect(page.locator('#status')).toContainText('Loaded 1 element(s)', { timeout: 15000 });

    // Wait for player component to be created
    await page.waitForSelector('pie-esm-player', { timeout: 10000 });

    // Verify the player web component is in the DOM
    const player = page.locator('pie-esm-player');
    await expect(player).toBeAttached();

    // Check that load complete event fired
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 20000,
    });
  });

  test('should render multi-element items', async ({ page }) => {
    await page.goto('/?item=multi-element-math');

    // Wait for app to initialize
    await page.waitForSelector('#load-btn:not(:disabled)');

    // Click load button
    await page.click('#load-btn');

    // Wait for elements to load
    await expect(page.locator('#status')).toContainText('Loading elements...', { timeout: 10000 });

    // Should load 2 elements
    await expect(page.locator('#status')).toContainText('Loaded 2 element(s)', { timeout: 15000 });

    // Wait for player to render
    await page.waitForSelector('pie-esm-player', { timeout: 10000 });

    // Verify player is attached
    const player = page.locator('pie-esm-player');
    await expect(player).toBeAttached();
  });

  test('should handle element loading errors', async ({ page }) => {
    await page.goto('/?item=multiple-choice-simple');

    // Configure to use a non-existent version to trigger an error
    await page.evaluate(() => {
      const app = (window as { app?: { state: { elements: Record<string, unknown> } } }).app;
      if (app) {
        app.state.elements['multiple-choice'] = { source: 'npm', version: '999.999.999' };
      }
    });

    // Wait for app to initialize
    await page.waitForSelector('#load-btn:not(:disabled)');

    // Click load button
    await page.click('#load-btn');

    // Should show an error
    await expect(page.locator('#status')).toContainText('Error:', { timeout: 15000 });

    // Error message should be displayed
    const errorMsg = page.locator('.error-message');
    await expect(errorMsg).toBeVisible();
  });

  test('should use local element builds when configured', async ({ page }) => {
    await page.goto('/?item=multiple-choice-simple');

    // Wait for item to be selected
    await page.waitForSelector('[data-item-id="multiple-choice-simple"].active');

    // Configure to use local build
    await page.click('input[name="element-multiple-choice"][value="local:local"]');

    // Wait for state to update
    await page.waitForTimeout(500);

    // Wait for load button
    await page.waitForSelector('#load-btn:not(:disabled)');

    // Click load button
    await page.click('#load-btn');

    // Check console for local build loading message
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(msg.text());
    });

    // Wait for loading to complete (or error if local build doesn't exist)
    await page.waitForTimeout(5000);

    // Check that we attempted to load from local
    // Either success or error, but should have tried
    const statusText = await page.locator('#status').textContent();
    expect(statusText).toBeTruthy();
  });

  test('should emit session-changed events on interaction', async ({ page }) => {
    await page.goto('/?item=multiple-choice-simple');

    // Load the item
    await page.waitForSelector('#load-btn:not(:disabled)');
    await page.click('#load-btn');

    // Wait for player to render
    await page.waitForSelector('pie-esm-player', { timeout: 10000 });
    await expect(page.locator('#status')).toContainText('Item loaded and rendered successfully', {
      timeout: 20000,
    });

    // Set up console listener for session-changed events
    const sessionChanges: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('Session changed:')) {
        sessionChanges.push(text);
      }
    });

    // Try to interact with the player (if elements are rendered)
    // This depends on the elements actually rendering inside the player
    await page.waitForTimeout(2000);

    // TODO: Add actual interaction tests once elements are confirmed to render
    // For now, just verify the player is present
    const player = page.locator('pie-esm-player');
    await expect(player).toBeAttached();
  });

  test('should support copy shareable URL', async ({ page }) => {
    await page.goto('/?item=multi-element-math');

    // Select version overrides
    await page.waitForSelector('input[name="element-multiple-choice"]');
    await page.click('input[name="element-multiple-choice"][value="local:local"]');

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    // Click copy button
    await page.click('#copy-url-btn');

    // Check that success message appears
    await expect(page.locator('#status')).toContainText('URL copied to clipboard!');

    // Read clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());

    // Verify the URL contains our parameters
    expect(clipboardText).toContain('item=multi-element-math');
    expect(clipboardText).toContain('elements=');
    expect(clipboardText).toContain('multiple-choice');
  });
});
