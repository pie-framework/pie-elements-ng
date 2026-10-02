/**
 * Menu settings saved in localStorage, in a real browser. MathJax 3 and 4 read them back on every
 * load; the MathJax the adapter loads keeps its own, and its configuration decides hidden MathML
 * and the tab order whatever is stored.
 */
import { expect, type Page, test } from '@playwright/test';
import { openPage, renderWithAdapter } from './harness';

const SHARED_KEY = 'MathJax-Menu-Settings';
const OWN_KEY = 'PIE-MathJax-Menu-Settings';

const BODY = `<body><div id="v4">\\(\\frac{1}{2} + x^2\\)</div></body>`;

function storeSettings(page: Page, key: string, settings: Record<string, unknown>) {
  return page.addInitScript(
    ([name, value]) => localStorage.setItem(name, value),
    [key, JSON.stringify(settings)]
  );
}

/** Renders `#v4` and waits for what the menu queued at startup, a renderer switch included. */
async function render(page: Page) {
  await renderWithAdapter(page, 'v4');
  await page.evaluate(() => {
    const mathJax = (window as { MathJax?: any }).MathJax;
    return mathJax.startup.document.whenReady(() => {});
  });
}

const stored = (page: Page) => page.evaluate(() => ({ ...localStorage }));

const menuSetting = (page: Page, name: string) =>
  page.evaluate((setting) => {
    const mathJax = (window as { MathJax?: any }).MathJax;
    return mathJax.startup.document.menu.settings[setting];
  }, name);

const conflicts = (page: Page) =>
  page.evaluate(() => (window as { conflicts?: string[] }).conflicts);

test('settings MathJax 3 saved leave MathJax 4 output alone', async ({ page }) => {
  const legacy = { assistiveMml: false, renderer: 'SVG' };
  await storeSettings(page, SHARED_KEY, legacy);
  const { unserved, errors } = await openPage(page, BODY);

  await render(page);

  await expect(page.locator('#v4 mjx-container')).toHaveAttribute('jax', 'CHTML');
  await expect(page.locator('#v4 mjx-assistive-mml math')).toHaveCount(1);
  expect(await stored(page)).toEqual({ [SHARED_KEY]: JSON.stringify(legacy) });
  expect(errors).toEqual([]);
  expect(await conflicts(page)).toEqual([]);
  expect(unserved).toEqual([]);
});

test('a student keeps their settings, hidden MathML excepted, under its own key', async ({
  page,
}) => {
  await storeSettings(page, OWN_KEY, { assistiveMml: false, zoom: 'Click' });
  const { unserved, errors } = await openPage(page, BODY);

  await render(page);

  expect(await menuSetting(page, 'zoom')).toBe('Click');
  await expect(page.locator('#v4 mjx-assistive-mml math')).toHaveCount(1);
  expect(await stored(page)).toEqual({ [OWN_KEY]: JSON.stringify({ zoom: 'Click' }) });

  await page.evaluate(() => {
    const mathJax = (window as { MathJax?: any }).MathJax;
    mathJax.startup.document.menu.menu.pool.lookup('zoom').setValue('DoubleClick');
  });
  expect(await stored(page)).toEqual({ [OWN_KEY]: JSON.stringify({ zoom: 'DoubleClick' }) });
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});

test('math stays out of the tab order with speech on', async ({ page }) => {
  await storeSettings(page, OWN_KEY, { enrich: true });
  const { unserved, errors } = await openPage(page, BODY);

  await render(page);

  // The explorer attaches to enriched math only.
  expect(await page.locator('#v4 [data-semantic-type]').count()).toBeGreaterThan(0);
  await expect(page.locator('#v4 mjx-container')).toHaveAttribute('tabindex', '-1');
  expect(errors).toEqual([]);
  expect(unserved).toEqual([]);
});
