/**
 * Picture choices on the imageUrl field, as the Star Math items carry them. An r1 variant
 * shows every picture in the CQT's 150px box whatever its intrinsic size, an SVG with a
 * viewBox and no width or height included, and a picked picture keeps that size in the
 * blank. pie-players wraps every image an element paints in a scroll wrapper, which shows
 * a scroll bar when the picture is wider than its tile; the second test wraps the
 * pictures the same way.
 */

import { type Page, expect, test } from '@playwright/test';
import { waitForMathRendering } from './test-helpers';

const DEMO = 'variant-sel-r1-plusggg-image-url';

async function openDemo(page: Page) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll<HTMLImageElement>('.pie-choices img')];
    return imgs.length === 3 && imgs.every((img) => img.complete);
  });
}

// pie-players' wrapper as its theme styles it (packages/theme/src/components.css), with
// the block class its render pass gives an image laid out as a block.
const wrapImages = (page: Page) =>
  page.evaluate(() => {
    const style = document.createElement('style');
    style.textContent =
      '.pie-image-scroll{display:block;max-width:100%;overflow-x:auto;overflow-y:hidden}' +
      '.pie-image-scroll>img{display:block;max-width:none;height:auto}';
    document.head.append(style);
    for (const img of document.querySelectorAll('.pie-choices img')) {
      const wrapper = document.createElement('span');
      wrapper.className = 'pie-image-scroll pie-image-scroll-block';
      img.replaceWith(wrapper);
      wrapper.append(img);
    }
  });

const tiles = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('.pie-choice-tile-content')].map((content) => {
      const img = content.querySelector('img') as HTMLImageElement;
      const wrapper = img.parentElement?.classList.contains('pie-image-scroll')
        ? img.parentElement
        : null;
      const { width, height } = img.getBoundingClientRect();
      return {
        width: Math.round(width),
        height: Math.round(height),
        room: Math.round((content as HTMLElement).clientWidth),
        scrolls: !!wrapper && wrapper.scrollWidth > wrapper.clientWidth,
      };
    })
  );

// The tile's 149.2px of room narrows the 150px box.
const expectPictures = (shown: Awaited<ReturnType<typeof tiles>>) => {
  expect(shown).toHaveLength(3);
  for (const tile of shown) {
    expect(tile.width).toBe(tile.room);
    expect(tile.height).toBe(150);
    expect(tile.scrolls).toBe(false);
  }
};

test('every picture choice fills the 150px box within its tile', async ({ page }) => {
  await openDemo(page);
  expectPictures(await tiles(page));
});

test('a picked picture shows in the blank at its tile size', async ({ page }) => {
  await openDemo(page);
  await page.locator('.pie-choices input[type="radio"]').nth(2).check();
  const answer = page.locator('.pie-blank-slot > img.pie-blank-image');
  await expect(answer).toBeVisible();
  const box = await answer.boundingBox();
  expect(Math.round(box?.width ?? 0)).toBe(150);
  expect(Math.round(box?.height ?? 0)).toBe(150);
});

test('picture choices in a host scroll wrapper show without a scroll bar', async ({ page }) => {
  await openDemo(page);
  await wrapImages(page);
  expectPictures(await tiles(page));
});
