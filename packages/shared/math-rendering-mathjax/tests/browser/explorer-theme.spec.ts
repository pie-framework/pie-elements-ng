/**
 * The explorer theme stylesheet against MathJax 4's own explorer styles, in a real browser: a
 * document-scoped purple-on-light-green theme, as pie-players sets it, and no theme at all.
 */
import { expect, type Page, test } from '@playwright/test';
import { type Build, openPage, renderWithAdapter } from './harness';

const THEME =
  'style="--pie-text: #8e2464; --pie-background: #cce8d4; --pie-border-dark: #4f1237; ' +
  '--pie-button-focus-outline: #6d1a4c"';
const math = `<div id="v4">\\(\\frac{1}{2} + x^2\\)</div>`;

/** Speech on, with its subtitles shown in the speech region, as a student sets it in the menu. */
function speechWithSubtitles(page: Page) {
  return page.addInitScript(() =>
    localStorage.setItem(
      'PIE-MathJax-Menu-Settings',
      JSON.stringify({ enrich: true, subtitles: true })
    )
  );
}

/** Renders `#v4` and explores its first part. */
async function exploreRendered(page: Page) {
  await renderWithAdapter(page, 'v4');
  // Enrichment runs in the speech worker after the typeset.
  await expect(page.locator('#v4 [data-semantic-type]').first()).toBeAttached();
  // Arrow keys move the explorer from the expression into its parts.
  await page.locator('#v4 mjx-container').focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
}

const styleOf = (page: Page, selector: string, properties: string[]) =>
  page.evaluate(
    ([sel, props]) => {
      const el = document.querySelector(sel as string);
      if (!el) return null;
      const style = getComputedStyle(el);
      return Object.fromEntries((props as string[]).map((p) => [p, style.getPropertyValue(p)]));
    },
    [selector, properties] as const
  );

for (const build of ['npm', 'browser'] as Build[]) {
  test(`the ${build} build themes the explorer highlight and regions from the document theme`, async ({
    page,
  }) => {
    await speechWithSubtitles(page);
    const { errors } = await openPage(page, `<body ${THEME}>${math}</body>`, build);
    await exploreRendered(page);

    const selected = '#v4 .mjx-selected';
    await expect(page.locator(selected)).toHaveCount(1);
    expect(
      await styleOf(page, selected, ['color', 'outline-color', 'outline-style', 'background-color'])
    ).toEqual({
      color: 'rgb(142, 36, 100)',
      'outline-color': 'rgb(109, 26, 76)',
      'outline-style': 'solid',
      'background-color': 'color(srgb 0.427451 0.101961 0.298039 / 0.15)',
    });

    const region = '.MJX_LiveRegion.MJX_LiveRegion_Show';
    await expect(page.locator(region)).toHaveCount(1);
    expect(await styleOf(page, region, ['background-color', 'border-top-color'])).toEqual({
      'background-color': 'rgb(204, 232, 212)',
      'border-top-color': 'rgb(79, 18, 55)',
    });
    expect(await styleOf(page, `${region} > div`, ['color'])).toEqual({
      color: 'rgb(142, 36, 100)',
    });
    expect(errors).toEqual([]);
  });
}

test('the explorer takes the no-theme fallbacks', async ({ page }) => {
  await speechWithSubtitles(page);
  await openPage(page, `<body>${math}</body>`);
  await exploreRendered(page);

  expect(await styleOf(page, '#v4 .mjx-selected', ['color', 'outline-color'])).toEqual({
    color: 'rgb(0, 0, 0)',
    'outline-color': 'rgb(21, 101, 192)',
  });
  expect(
    await styleOf(page, '.MJX_LiveRegion.MJX_LiveRegion_Show', [
      'background-color',
      'border-top-color',
    ])
  ).toEqual({ 'background-color': 'rgb(255, 255, 255)', 'border-top-color': 'rgb(102, 104, 106)' });
});
