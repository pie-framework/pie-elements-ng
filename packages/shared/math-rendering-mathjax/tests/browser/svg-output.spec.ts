/**
 * SVG output of the MathJax the adapter loads, in a real browser: from the menu's renderer choice
 * or from an SVG build. Its stylesheet carries its own id, so it is not taken for another
 * MathJax's, and another MathJax's SVG stylesheet is still reported.
 */
import { expect, type Page, test } from '@playwright/test';
import { openPage } from './harness';

const SVG_BUILD = 'https://cdn.jsdelivr.net/npm/mathjax@4.1.3/tex-svg.js';

const BODY = `<body><div id="v4">\\(\\frac{1}{2} + x^2\\)</div></body>`;

/** Renders `#v4` and waits for what the menu queued at startup, a renderer switch included. */
async function render(page: Page, srcUrl?: string) {
  await page.evaluate(async (src) => {
    const url = '/adapter.js';
    const adapter = await import(url);
    await adapter.createMathjaxRenderer({ srcUrl: src })(document.getElementById('v4'));
    const mathJax = (window as { MathJax?: any }).MathJax;
    await mathJax.startup.document.whenReady(() => {});
  }, srcUrl);
}

const headStylesheetIds = (page: Page) =>
  page.evaluate(() => [...document.head.querySelectorAll('style')].map((style) => style.id));

const conflicts = (page: Page) =>
  page.evaluate(() => (window as { conflicts?: string[] }).conflicts);

async function expectOwnSvgOutput(page: Page, errors: string[], unserved: string[]) {
  await expect(page.locator('#v4 mjx-container')).toHaveAttribute('jax', 'SVG');
  expect(await headStylesheetIds(page)).toContain('PIE-MJX-SVG-styles');
  expect(await headStylesheetIds(page)).not.toContain('MJX-SVG-styles');
  expect(errors).toEqual([]);
  expect(await conflicts(page)).toEqual([]);
  expect(unserved).toEqual([]);
}

test('SVG output a student picks in the menu is not reported', async ({ page }) => {
  const { unserved, errors } = await openPage(page, BODY);
  await render(page);

  await page.evaluate(() => {
    const mathJax = (window as { MathJax?: any }).MathJax;
    mathJax.startup.document.menu.menu.pool.lookup('renderer').setValue('SVG');
  });

  await expectOwnSvgOutput(page, errors, unserved);
});

test('SVG output a student picked on an earlier load is not reported', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('PIE-MathJax-Menu-Settings', '{"renderer":"SVG"}')
  );
  const { unserved, errors } = await openPage(page, BODY);

  await render(page);

  await expectOwnSvgOutput(page, errors, unserved);
});

test('a MathJax 4 SVG build from srcUrl is not reported', async ({ page }) => {
  const { unserved, errors } = await openPage(page, BODY);

  await render(page, SVG_BUILD);

  await expectOwnSvgOutput(page, errors, unserved);
});

test("another MathJax's SVG stylesheet is still reported", async ({ page }) => {
  const { errors } = await openPage(page, BODY);
  await render(page);

  await page.evaluate(() => {
    const sheet = document.createElement('style');
    sheet.id = 'MJX-SVG-styles';
    document.head.append(sheet);
  });

  await expect.poll(() => conflicts(page)).toEqual(['foreign-output-stylesheet']);
  expect(errors).toHaveLength(1);
  expect(errors[0]).toContain('another MathJax added <style id="MJX-SVG-styles">');
});
