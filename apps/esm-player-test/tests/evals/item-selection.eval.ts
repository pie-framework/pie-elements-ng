import { expect, test } from '@playwright/test';

test.describe('Item Selection and Configuration', () => {
  test('should select an item and show element version controls', async ({ page }) => {
    await page.goto('/');

    // Wait for items to load
    await page.waitForSelector('[data-item-id="multiple-choice-simple"]');

    // Click on the multiple choice item
    await page.click('[data-item-id="multiple-choice-simple"]');

    // Check that the item is marked as active
    const activeItem = page.locator('[data-item-id="multiple-choice-simple"]');
    await expect(activeItem).toHaveClass(/active/);

    // Check that status shows the selected item
    await expect(page.locator('#status')).toContainText('Selected item: Multiple Choice - Simple');

    // Check that element version controls appear
    const elementVersions = page.locator('#element-versions');
    await expect(elementVersions).toContainText('multiple-choice');

    // Verify version options are available
    await expect(elementVersions).toContainText('NPM Latest');
    await expect(elementVersions).toContainText('Local Build');
  });

  test('should handle multi-element items', async ({ page }) => {
    await page.goto('/');

    // Wait for items to load
    await page.waitForSelector('[data-item-id="multi-element-math"]');

    // Select multi-element item
    await page.click('[data-item-id="multi-element-math"]');

    // Check that multiple element controls appear
    const elementVersions = page.locator('#element-versions');
    await expect(elementVersions).toContainText('multiple-choice');
    await expect(elementVersions).toContainText('number-line');

    // Each element should have its own version selector
    const multipleChoiceRadios = page.locator('input[name="element-multiple-choice"]');
    const numberLineRadios = page.locator('input[name="element-number-line"]');

    expect(await multipleChoiceRadios.count()).toBeGreaterThan(0);
    expect(await numberLineRadios.count()).toBeGreaterThan(0);
  });

  test('should persist selected item in URL', async ({ page }) => {
    await page.goto('/');

    // Select an item
    await page.waitForSelector('[data-item-id="multiple-choice-checkbox"]');
    await page.click('[data-item-id="multiple-choice-checkbox"]');

    // Wait a bit for URL to update
    await page.waitForTimeout(500);

    // Check that URL contains the item parameter
    const url = page.url();
    expect(url).toContain('item=multiple-choice-checkbox');
  });

  test('should restore item selection from URL', async ({ page }) => {
    // Navigate directly to a URL with item parameter
    await page.goto('/?item=hotspot-basic');

    // Wait for the app to initialize
    await page.waitForSelector('[data-item-id="hotspot-basic"]');

    // Check that the item is selected
    const activeItem = page.locator('[data-item-id="hotspot-basic"]');
    await expect(activeItem).toHaveClass(/active/);

    // Check that element controls show the right element
    await expect(page.locator('#element-versions')).toContainText('hotspot');
  });

  test('should switch between version sources', async ({ page }) => {
    await page.goto('/');

    // Select an item
    await page.waitForSelector('[data-item-id="multiple-choice-simple"]');
    await page.click('[data-item-id="multiple-choice-simple"]');

    // Switch to local build
    await page.click('input[name="element-multiple-choice"][value="local:local"]');

    // Wait for state to update
    await page.waitForTimeout(500);

    // Verify the local radio is checked
    const localRadio = page.locator('input[name="element-multiple-choice"][value="local:local"]');
    await expect(localRadio).toBeChecked();

    // Switch back to npm
    await page.click('input[name="element-multiple-choice"][value="npm:latest"]');

    // Verify npm radio is checked
    const npmRadio = page.locator('input[name="element-multiple-choice"][value="npm:latest"]');
    await expect(npmRadio).toBeChecked();
  });
});
