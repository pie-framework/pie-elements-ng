/**
 * Live parity test for CONTOOL-2569:
 * https://illuminate.atlassian.net/browse/CONTOOL-2569
 *
 * Reported by content: when a distractor is selected on the
 * sel_r1-_ggplusggg variant, the visible whitespace between the cloze
 * marker (filled blank) and the first trailing stem token does not match
 * the Learnosity reference. PIE renders a noticeably larger gap than LSY.
 *
 * Variant: variant-sel-r1-ggplus (token_sequence layout, horizontal choices).
 * The reported reference item (f522383b-8f50-4014-b557-f1b1acd678f3) is a
 * different sample of the same customType; the gap divergence is at the
 * customType layer, not item-content specific.
 *
 * The test asserts that the horizontal gap from the cloze marker's right
 * edge to the first trailing stem token's left edge matches the same gap
 * on the Learnosity side, within ±2px to absorb sub-pixel rendering noise.
 */

import { expect, test } from '@playwright/test';

const DEMO_ID = 'variant-sel-r1-ggplus';
const GAP_TOLERANCE_PX = 2;
const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

/**
 * Measures the horizontal gap (in px) between the cloze marker's right edge
 * and the first trailing stem token's left edge on the given side. The
 * trailing token is the first descendant of the stem container that is NOT
 * inside the cloze marker itself — Learnosity wraps trailing tokens in
 * .rli-r1-content-element (siblings of .rli-r1-cloze), and PIE renders them
 * as direct-child spans of .pie-template-line outside .pie-blank-slot.
 */
function measureGapFn() {
  return (args: { stemSelector: string; clozeSelector: string; tokenSelector: string }) => {
    const stem = document.querySelector(args.stemSelector) as HTMLElement | null;
    const cloze = document.querySelector(args.clozeSelector) as HTMLElement | null;
    if (!stem || !cloze) return null;
    const tokenCandidates = Array.from(stem.querySelectorAll(args.tokenSelector)) as HTMLElement[];
    const token = tokenCandidates.find((el) => !cloze.contains(el));
    if (!token) return null;
    const clozeRight = cloze.getBoundingClientRect().right;
    const tokenLeft = token.getBoundingClientRect().left;
    return tokenLeft - clozeRight;
  };
}

test.describe('CONTOOL-2569 — cloze-to-token gap parity (ggplus)', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('cloze→trailing-token gap matches Learnosity within ±2px after selection', async ({
    page,
  }) => {
    await openParityRoute(page);

    // Select the first distractor on each side so the cloze renders a value.
    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.locator('#learnosity-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);

    const piePx = await page.evaluate(measureGapFn(), {
      stemSelector: '#pie-container .pie-template-line',
      clozeSelector: '#pie-container .pie-blank-slot',
      // Direct-child classless spans: trailing tokens from {@html} template content.
      tokenSelector: ':scope > span:not([class])',
    });
    const lrnPx = await page.evaluate(measureGapFn(), {
      stemSelector: '#learnosity-container .rli-r1-stem',
      clozeSelector: '#learnosity-container .rli-r1-cloze',
      tokenSelector: '.rli-r1-content-element',
    });

    expect(piePx, 'PIE cloze/token not found').not.toBeNull();
    expect(lrnPx, 'Learnosity cloze/token not found').not.toBeNull();
    expect(Math.abs((piePx as number) - (lrnPx as number))).toBeLessThanOrEqual(GAP_TOLERANCE_PX);
  });
});
