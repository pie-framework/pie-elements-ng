/**
 * Live parity test for CONTOOL-2572:
 * https://illuminate.atlassian.net/browse/CONTOOL-2572
 *
 * Reported by content: on the sel_vic variant, when the cloze marker is
 * immediately followed by a piece of punctuation (e.g. a period), the
 * horizontal gap between the filled cloze value and the punctuation is not
 * the same in PIE as it is in Learnosity. Reported reference item is
 * 0d6e94d3-b8d7-486c-803f-b037e49bbd9c.
 *
 * The reproduction sample registered for this case is `variant-sel-vic-cloze-punct`,
 * which uses a generic `Choose the right word: {{blank}}.` template so the
 * leading text doesn't affect the cloze→period adjacency we are measuring.
 *
 * The test selects a distractor on each side, then measures the px gap from
 * the cloze marker's right edge to the leading edge of the trailing
 * punctuation node. PIE and LSY must agree within ±2px.
 */

import { expect, test } from '@playwright/test';

const DEMO_ID = 'variant-sel-vic-cloze-punct';
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
 * Returns the horizontal gap (in CSS px) from the right edge of the cloze
 * marker to the leading edge of the first trailing punctuation glyph. We use
 * a Range over the trailing text node so the measurement is glyph-accurate
 * rather than including any container padding/margin past the punctuation.
 */
function measureClozeToPunctGapFn() {
  return (args: { stemSelector: string; clozeSelector: string }) => {
    const stem = document.querySelector(args.stemSelector) as HTMLElement | null;
    const cloze = document.querySelector(args.clozeSelector) as HTMLElement | null;
    if (!stem || !cloze) return null;
    const clozeRect = cloze.getBoundingClientRect();

    // Find the first punctuation glyph that sits to the right of the cloze on
    // the same line. We walk every text node in the stem (skipping the cloze
    // contents themselves) and for each punctuation char build a Range and
    // measure its rect.
    const walker = document.createTreeWalker(stem, NodeFilter.SHOW_TEXT);
    let best: { left: number; rect: DOMRect } | null = null;
    let node = walker.nextNode() as Text | null;
    while (node) {
      if (cloze.contains(node)) {
        node = walker.nextNode() as Text | null;
        continue;
      }
      const text = node.nodeValue ?? '';
      for (let i = 0; i < text.length; i += 1) {
        if (!/[.,!?;:]/.test(text[i])) continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        // Same-line: punctuation top is within the cloze's vertical extent.
        const sameLine = rect.top < clozeRect.bottom - 1 && rect.bottom > clozeRect.top + 1;
        if (!sameLine) continue;
        // Must be to the right of the cloze.
        if (rect.left < clozeRect.right) continue;
        if (!best || rect.left < best.left) {
          best = { left: rect.left, rect };
        }
      }
      node = walker.nextNode() as Text | null;
    }
    if (!best) return null;
    return best.left - clozeRect.right;
  };
}

test.describe('CONTOOL-2572 — sel-vic cloze→punctuation gap parity', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('cloze→trailing-period gap matches Learnosity within ±2px after selection', async ({
    page,
  }) => {
    await openParityRoute(page);

    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.locator('#learnosity-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);

    const piePx = await page.evaluate(measureClozeToPunctGapFn(), {
      stemSelector: '#pie-container .pie-template-line',
      clozeSelector: '#pie-container .pie-blank-slot',
    });
    const lrnPx = await page.evaluate(measureClozeToPunctGapFn(), {
      stemSelector: '#learnosity-container .rli-vic-stem, #learnosity-container .rli-vic-answer',
      clozeSelector: '#learnosity-container .rli-vic-cloze',
    });

    expect(piePx, 'PIE cloze/punct not found').not.toBeNull();
    expect(lrnPx, 'Learnosity cloze/punct not found').not.toBeNull();
    expect(
      Math.abs((piePx as number) - (lrnPx as number)),
      `PIE gap=${piePx} LSY gap=${lrnPx}`
    ).toBeLessThanOrEqual(GAP_TOLERANCE_PX);
  });
});
