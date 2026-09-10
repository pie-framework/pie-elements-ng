/**
 * Regression test for CONTOOL-3159.
 *
 * The blank/cloze slot in token_sequence layouts (cqt-css/sel-r1-base.css) has two
 * distinct residual-shift bugs, both triggered by selecting an image choice:
 *
 * 1. `.pie-template-line` uses `display:flex; align-items:baseline` to line up
 *    inline stem tokens with the blank. .pie-blank-slot has no baseline-participating
 *    child of its own (ClozeMarker.svelte's .cloze-marker centers internally,
 *    align-items:center), so it contributes a *synthesized* baseline back to the
 *    row based on its own box geometry — which differs wildly between an empty
 *    placeholder and a selected choice's image (up to 150x150). Selecting a choice
 *    recomputed the row's shared baseline, visibly shifting sibling stem tokens
 *    like "Pick the shape." down by dozens of pixels, even though the token itself
 *    never changed. Fixed via align-self, removing the blank from that shared
 *    computation entirely.
 *
 * 2. Once (1) was fixed, a smaller, residual shift remained *in the blank itself*:
 *    .pie-blank-slot is box-sizing:border-box with a permanent 6px border-bottom
 *    (the underline) and min-height:150px. min-height:150px only leaves 144px for
 *    content, so an empty blank (content ~0px, clamped to the 150px floor) and a
 *    blank showing a 150px choice image (150 + 6 border = 156px, exceeding the
 *    floor) render at two different total heights (150 vs 156). Since the blank is
 *    bottom-anchored in its row, that 6px difference shows up as the blank/image
 *    itself shifting a few pixels every time a choice is selected or cleared.
 *    min-height:156px keeps the total box height constant regardless of content.
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

const DEMO_ID = 'variant-sel-r1-image-cap-150';

async function openRoute(page: Page) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

test('image-cap-shift: selecting a choice does not shift the stem token before the blank', async ({
  page,
}) => {
  await openRoute(page);
  const root = deliveryContainer(page);

  const stemToken = root.locator('.pie-template-line p > span').first();
  await expect(stemToken).toBeVisible();

  const before = await stemToken.boundingBox();
  expect(before).not.toBeNull();

  await root.locator('input[type="radio"]').nth(1).check(); // distractor_2 ("7")
  await page.waitForTimeout(150);

  const after = await stemToken.boundingBox();
  expect(after).not.toBeNull();

  // Pre-fix (bug 1): selecting a choice recomputed .pie-template-line's shared
  // align-items:baseline from the blank's new (image-containing) geometry,
  // shifting the stem token down by ~69px.
  expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(2);
});

test('image-cap-shift: the blank itself does not shift when switching between selected choices', async ({
  page,
}) => {
  await openRoute(page);
  const root = deliveryContainer(page);

  const blankSlot = root.locator('.pie-blank-slot');
  await expect(blankSlot).toBeVisible();

  const emptyBox = await blankSlot.boundingBox();
  expect(emptyBox).not.toBeNull();

  const radios = root.locator('input[type="radio"]');
  const boxesByChoice: Array<{ top: number; height: number }> = [];
  for (let i = 0; i < 3; i++) {
    await radios.nth(i).check();
    await page.waitForTimeout(150);
    const box = await blankSlot.boundingBox();
    expect(box).not.toBeNull();
    boxesByChoice.push({ top: box?.y ?? 0, height: box?.height ?? 0 });
  }

  // Selecting between choices with the same-sized image must not shift anything.
  for (const box of boxesByChoice) {
    expect(box.height).toBeCloseTo(boxesByChoice[0].height, 0);
    expect(box.top).toBeCloseTo(boxesByChoice[0].top, 0);
  }

  // Pre-fix (bug 2): min-height:150px didn't account for the blank's permanent
  // 6px border-bottom (box-sizing:border-box), so the empty blank clamped to a
  // total height of 150px while a blank showing a 150px choice image grew to
  // 156px — shifting the blank (bottom-anchored in its row) by that 6px
  // difference the moment a choice was selected or cleared.
  expect(boxesByChoice[0].height).toBeCloseTo(emptyBox?.height ?? 0, 0);
  expect(boxesByChoice[0].top).toBeCloseTo(emptyBox?.y ?? 0, 0);
});
