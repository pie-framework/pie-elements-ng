/**
 * Live parity test for CONTOOL-2571:
 * https://illuminate.atlassian.net/browse/CONTOOL-2571
 *
 * Reported by content: distractor labels and the filled cloze on the
 * sel_r1-s3_plusggg variant render in a different weight in PIE than they do
 * in Learnosity. The reported reference item is
 * b924b8b7-0ce2-4a03-bf10-3f9647e23025.
 *
 * Variant: variant-sel-r1-s3 (stimulus_image_blank, horizontal text choices,
 * distractor labels wrapped in <span style="font-size:1.8em">). LSY's
 * sel_r1-s3_plusggg/question.css has no font-weight rule for distractors or
 * the cloze content-element, so both fall through to the host root weight 400.
 * PIE adds a font-weight:500 rule on .pie-choice-label that does not exist in
 * LSY, so PIE renders the same content visibly heavier.
 *
 * The test reads the computed font-weight of the deepest text-bearing span
 * (the inner author span) on both sides and asserts they match.
 */

import { expect, test } from '@playwright/test';

const DEMO_ID = 'variant-sel-r1-s3';
const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

function fontWeightOf() {
  return (selector: string) => {
    const el = document.querySelector(selector) as HTMLElement | null;
    if (!el) return null;
    return getComputedStyle(el).fontWeight;
  };
}

test.describe('CONTOOL-2571 — distractor/cloze font weight parity (s3)', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('distractor inner span font weight matches Learnosity', async ({ page }) => {
    await openParityRoute(page);

    // The inner author <span style="font-size:1.8em"> carries the visible text
    // on both sides; if PIE applies any weight override on its ancestor, the
    // inner span inherits it.
    const piePartialSel = '#pie-container .pie-choice-label span[style*="font-size"]';
    const lrnPartialSel = '#learnosity-container .rli-s3-content-element span[style*="font-size"]';
    const pieWeight = await page.evaluate(fontWeightOf(), piePartialSel);
    const lrnWeight = await page.evaluate(fontWeightOf(), lrnPartialSel);

    expect(pieWeight, 'PIE distractor inner span').not.toBeNull();
    expect(lrnWeight, 'LSY distractor inner span').not.toBeNull();
    expect(pieWeight).toBe(lrnWeight);
  });

  test('filled cloze inner span font weight matches Learnosity', async ({ page }) => {
    await openParityRoute(page);

    // Select the first distractor on each side so the cloze fills with the
    // selected label; only then does the filled cloze span appear.
    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.locator('#learnosity-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);

    const pieClozeSel = '#pie-container .pie-blank-value span[style*="font-size"]';
    const lrnClozeSel = '#learnosity-container .rli-s3-cloze span[style*="font-size"]';
    const pieWeight = await page.evaluate(fontWeightOf(), pieClozeSel);
    const lrnWeight = await page.evaluate(fontWeightOf(), lrnClozeSel);

    expect(pieWeight, 'PIE filled cloze inner span').not.toBeNull();
    expect(lrnWeight, 'LSY filled cloze inner span').not.toBeNull();
    expect(pieWeight).toBe(lrnWeight);
  });
});
