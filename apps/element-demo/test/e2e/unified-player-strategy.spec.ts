import { expect, test, type Page } from '@playwright/test';

const ELEMENT = process.env.UNIFIED_PLAYER_E2E_ELEMENT?.trim() || 'multiple-choice';
const DEMO_ID =
  process.env.UNIFIED_PLAYER_E2E_DEMO?.trim() ||
  (ELEMENT === 'multiple-choice'
    ? 'math-algebra-quadratic'
    : ELEMENT === 'graphing'
      ? 'parabola-vertex'
      : '');
const DEMO_QUERY = DEMO_ID ? `&demo=${DEMO_ID}` : '';
const STRATEGIES = (process.env.UNIFIED_PLAYER_E2E_STRATEGIES?.trim() || 'esm,iife')
  .split(',')
  .map((s) => s.trim())
  .filter((s): s is 'esm' | 'iife' => s === 'esm' || s === 'iife');

async function waitForHostSettled(page: Page) {
  await page.waitForFunction(
    () => {
      const host = document.querySelector('pie-element-player');
      if (!host) {
        return false;
      }
      const error = host.querySelector('.error');
      if (error) {
        return false;
      }
      const loading = host.querySelector('.loading');
      return !loading;
    },
    undefined,
    { timeout: 45_000 }
  );
}

test.describe('Unified element player strategy host', () => {
  test('delivery uses one host for esm and iife', async ({ page }) => {
    test.setTimeout(120_000);

    for (const strategy of STRATEGIES) {
      await page.goto(
        `/${ELEMENT}/deliver?mode=gather&role=student&player=${strategy}${DEMO_QUERY}`
      );
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('pie-element-player', { timeout: 30_000 });

      const host = page.locator('pie-element-player').first();
      await expect(host).toBeVisible();
      await expect(host).toHaveAttribute('strategy', strategy);
      await expect(host).toHaveAttribute('view', 'delivery');
      await waitForHostSettled(page);

      if (strategy === 'iife') {
        await page.waitForSelector(`pie-iife-${ELEMENT}`, { timeout: 45_000 });
      } else {
        // ESM path can render through non-web-component internals for some elements.
        // Ensure unified host finished loading without error.
        await expect(page.locator('pie-element-player .error')).toHaveCount(0);
      }
    }
  });

  test('author and print mount through one host', async ({ page }) => {
    test.setTimeout(120_000);

    for (const strategy of STRATEGIES) {
      await page.goto(`/${ELEMENT}/author?player=${strategy}`);
      await page.waitForSelector('pie-element-player[view="author"]', { timeout: 45_000 });
      await waitForHostSettled(page);
      await page.waitForSelector(`${ELEMENT}-configure`, { timeout: 45_000 });

      await page.goto(`/${ELEMENT}/print?role=student&player=${strategy}`);
      await page.waitForSelector('pie-element-player[view="print"]', { timeout: 45_000 });
      await waitForHostSettled(page);
      await page.waitForSelector(`${ELEMENT}-print`, { timeout: 45_000 });
    }
  });
});
