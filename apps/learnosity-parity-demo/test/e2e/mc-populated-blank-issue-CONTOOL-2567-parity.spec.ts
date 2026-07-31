/**
 * Live parity test for CONTOOL-2567:
 * https://illuminate.atlassian.net/browse/CONTOOL-2567
 *
 * Reported by content: McPopulatedBlank renders larger text than the
 * Learnosity reference, and the rendered text runs together in the
 * distractors and in the stem after a selection is made.
 *
 * Root cause hypothesis: McPopulatedBlank's stem/distractor cascade is
 * em-based, while the Learnosity Custom Question type sizes the equivalent
 * spans in px. Author content uses inline `font-size:1.8em;` on the same
 * spans on both sides — Learnosity's px-based parents resolve the em
 * relative to a smaller base, so the visible glyph is ~14% smaller than PIE's.
 *
 * The test asserts that the visible 1.8em span inside the stem and the first
 * distractor renders at the same computed font-size as the corresponding
 * Learnosity span, within ±0.5px to absorb sub-pixel rendering noise.
 *
 * Variant: variant-sel-r1-g-stem (token_sequence layout, horizontal choices).
 * The reported reference item (1d45e2d4-...) is a different item of the same
 * customType; the bug is at the customType layer, not item-content specific.
 */

import { expect, test } from '@playwright/test';

const DEMO_ID = 'variant-sel-r1-g-stem';
const FONT_SIZE_TOLERANCE_PX = 0.5;
const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

/**
 * Find the deepest descendant of `root` whose own (non-nested) text content
 * includes `text`. Used to locate the leaf <span style="font-size:1.8em"> that
 * directly wraps the visible token, regardless of intervening wrappers.
 */
function deepestTextSpanFn() {
  return (args: { rootSelector: string; text: string }) => {
    const root = document.querySelector(args.rootSelector);
    if (!root) return null;
    let candidate: Element | null = null;
    const walk = (el: Element) => {
      const ownText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE)
        .map((n) => n.textContent ?? '')
        .join('');
      if (ownText.includes(args.text)) candidate = el;
      for (const child of Array.from(el.children)) walk(child);
    };
    walk(root);
    if (!candidate) return null;
    return parseFloat(getComputedStyle(candidate).fontSize);
  };
}

test.describe('CONTOOL-2567 — font-size parity', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('stem token (1.8em span) matches Learnosity computed font-size', async ({ page }) => {
    await openParityRoute(page);

    const piePx = await page.evaluate(deepestTextSpanFn(), {
      rootSelector: '#pie-container .pie-template-line',
      text: 'will',
    });
    const lrnPx = await page.evaluate(deepestTextSpanFn(), {
      rootSelector: '#learnosity-container .rli-r1-stem',
      text: 'will',
    });

    expect(piePx, 'PIE stem span not found').not.toBeNull();
    expect(lrnPx, 'Learnosity stem span not found').not.toBeNull();
    expect(Math.abs((piePx as number) - (lrnPx as number))).toBeLessThanOrEqual(
      FONT_SIZE_TOLERANCE_PX
    );
  });

  test('first distractor (1.8em span) matches Learnosity computed font-size', async ({ page }) => {
    await openParityRoute(page);

    const piePx = await page.evaluate(deepestTextSpanFn(), {
      rootSelector: '#pie-container .pie-choices-fieldset .pie-choice',
      text: 'fill',
    });
    const lrnPx = await page.evaluate(deepestTextSpanFn(), {
      rootSelector: '#learnosity-container .rli-r1-distractors .rli-r1-distractor',
      text: 'fill',
    });

    expect(piePx, 'PIE distractor span not found').not.toBeNull();
    expect(lrnPx, 'Learnosity distractor span not found').not.toBeNull();
    expect(Math.abs((piePx as number) - (lrnPx as number))).toBeLessThanOrEqual(
      FONT_SIZE_TOLERANCE_PX
    );
  });
});
