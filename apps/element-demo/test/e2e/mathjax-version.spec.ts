import { expect, test, type Page } from '@playwright/test';

// The prompt and every choice of this demo hold TeX, so the delivery view typesets math on mount.
const DELIVER_URL = '/multiple-choice/deliver?mode=gather&role=student&demo=math-algebra-quadratic';

type PageMath = {
  version: string | null;
  legacyRendererLoaded: boolean;
  globalIsLegacyRenderer: boolean;
  conflicts: string[];
};

async function openTypesetDelivery(page: Page, player: 'esm' | 'iife'): Promise<PageMath> {
  await page.addInitScript(() => {
    const conflicts: string[] = [];
    (window as any).__mathjaxConflicts = conflicts;
    window.addEventListener('pie-mathjax-version-conflict', (event) => {
      conflicts.push((event as CustomEvent).detail?.condition);
    });
  });
  await page.goto(`${DELIVER_URL}&player=${player}`);

  const host = page.locator('pie-element-player');
  await expect(host).toHaveAttribute('strategy', player, { timeout: 30_000 });
  // IIFE bundles can build on first request.
  await expect(host.locator('mjx-container').first()).toBeAttached({ timeout: 180_000 });
  await expect
    .poll(() => host.evaluate((node) => node.textContent?.includes('\\(') ?? true), {
      timeout: 30_000,
    })
    .toBe(false);

  return page.evaluate(() => {
    const win = window as any;
    const legacy = win._dll_pie_lib__math_rendering;
    return {
      version: win.MathJax?.version ?? null,
      legacyRendererLoaded: legacy !== undefined,
      globalIsLegacyRenderer: legacy !== undefined && win['@pie-lib/math-rendering'] === legacy,
      conflicts: win.__mathjaxConflicts,
    };
  });
}

test.describe('MathJax version per player type', () => {
  test('iife pages typeset with MathJax 3 and load no MathJax 4', async ({ page }) => {
    test.setTimeout(240_000);
    const math = await openTypesetDelivery(page, 'iife');

    expect(math.version).toMatch(/^3\./);
    expect(math.globalIsLegacyRenderer).toBe(true);
    await expect(page.locator('head style#MJX-CHTML-styles')).toHaveCount(1);
    await expect(page.locator('head style#PIE-MJX-CHTML-styles')).toHaveCount(0);
    expect(math.conflicts).toEqual([]);
  });

  test('esm pages typeset with MathJax 4 and load no MathJax 3', async ({ page }) => {
    test.setTimeout(240_000);
    const math = await openTypesetDelivery(page, 'esm');

    expect(math.version).toMatch(/^4\./);
    expect(math.legacyRendererLoaded).toBe(false);
    await expect(page.locator('head style#PIE-MJX-CHTML-styles')).toHaveCount(1);
    await expect(page.locator('head style#MJX-CHTML-styles')).toHaveCount(0);
    expect(math.conflicts).toEqual([]);
  });
});
