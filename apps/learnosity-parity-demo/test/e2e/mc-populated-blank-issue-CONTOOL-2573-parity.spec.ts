/**
 * Live parity test for CONTOOL-2573:
 * https://illuminate.atlassian.net/browse/CONTOOL-2573
 *
 * Reported by content: on the sel_vic variant, when the viewport is narrow
 * enough that the template sentence wraps to a second line, PIE renders the
 * second line center-aligned while Learnosity renders it left-aligned. The
 * reported reference item is 0d6e94d3-b8d7-486c-803f-b037e49bbd9c (v2.0).
 *
 * The reproduction reuses the variant-sel-vic-cloze-punct sample (registered
 * for CONTOOL-2572) but extends the template via JS to a length that forces a
 * wrap at the test viewport. The test then measures the leftmost glyph of the
 * second visible line in the stem and asserts that it sits at (or very close
 * to) the stem container's content-box left edge — i.e. the line is
 * left-aligned, not centered.
 *
 * The PIE side is the only side asserted because the LSY side already renders
 * left-aligned wrapped lines. Asserting absolute pixel parity between sides
 * would couple the test to the exact stem text used in the live LSY item;
 * since the symptom is purely about alignment, an alignment-only assertion is
 * sufficient and item-content independent.
 */

import { expect, test } from '@playwright/test';

const DEMO_ID = 'variant-sel-vic-cloze-punct';
const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;
// How close to the content-box left the second line must start. A center-
// aligned wrap leaves tens of px of slack on the left; left alignment puts
// the first glyph within a few px of the content-box edge.
const ALIGNMENT_TOLERANCE_PX = 6;

async function openParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

/**
 * Replaces the leading text of the PIE template <p> so the sentence is long
 * enough to force a wrap at the constrained viewport, while preserving the
 * cloze marker and trailing period that follow it. We do not touch the LSY
 * side because the symptom is PIE-side and the LSY content already wraps in
 * its own way at narrow widths.
 */
async function lengthenPieStemToForceWrap(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const p = document.querySelector('#pie-container .pie-template-line p') as HTMLElement | null;
    if (!p) return;
    const long =
      'When the screen is narrow enough that the prompt does not fit on a single line, the wrapped second line should remain left aligned and not snap back to the center of the container — please pick the right word for the missing slot:';
    // Replace the original "Choose the right word:" text node with the long
    // prompt; preserve the trailing nodes (cloze + " .") untouched.
    const firstChild = p.firstChild;
    if (firstChild && firstChild.nodeType === Node.TEXT_NODE) {
      firstChild.nodeValue = `${long} `;
    }
  });
}

/**
 * Returns the line-by-line first-glyph x positions inside the stem element.
 * Uses Range.getClientRects() over each text node so we get one rect per
 * visual line, then groups rects by their integer top to identify lines.
 * For each line we record both the leftmost and rightmost glyph edge so the
 * caller can reason about indent vs. leftover space.
 */
function measureLineLeftsFn() {
  return (selector: string) => {
    const stem = document.querySelector(selector) as HTMLElement | null;
    if (!stem) return null;
    const stemRect = stem.getBoundingClientRect();
    const stemStyles = getComputedStyle(stem);
    const padLeft = parseFloat(stemStyles.paddingLeft) || 0;
    const padRight = parseFloat(stemStyles.paddingRight) || 0;
    const contentLeft = stemRect.left + padLeft;
    const contentRight = stemRect.right - padRight;
    const contentWidth = contentRight - contentLeft;

    const lineLefts = new Map<number, number>();
    const lineRights = new Map<number, number>();
    const walker = document.createTreeWalker(stem, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode() as Text | null;
    while (node) {
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        if (r.width === 0 && r.height === 0) continue;
        const key = Math.round(r.top);
        const prevL = lineLefts.get(key);
        if (prevL === undefined || r.left < prevL) lineLefts.set(key, r.left);
        const prevR = lineRights.get(key);
        if (prevR === undefined || r.right > prevR) lineRights.set(key, r.right);
      }
      node = walker.nextNode() as Text | null;
    }
    const tops = Array.from(lineLefts.keys()).sort((a, b) => a - b);
    return {
      contentLeft,
      contentWidth,
      lines: tops.map((top) => {
        const left = lineLefts.get(top) as number;
        const right = lineRights.get(top) as number;
        return {
          top,
          left,
          right,
          width: right - left,
          deltaFromContentLeft: left - contentLeft,
          // How much horizontal space is leftover on the line; this is what
          // a center alignment would split between left and right margins.
          leftover: contentWidth - (right - left),
        };
      }),
    };
  };
}

test.describe('CONTOOL-2573 — sel-vic wrapped-line alignment parity', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE: when stem text wraps, the second line starts at the left edge (not centered)', async ({
    page,
  }) => {
    // Constrain viewport so the lengthened stem must wrap.
    await page.setViewportSize({ width: 760, height: 900 });
    await openParityRoute(page);
    await lengthenPieStemToForceWrap(page);
    // Allow re-layout after text mutation.
    await page.waitForTimeout(150);

    const measured = await page.evaluate(
      measureLineLeftsFn(),
      '#pie-container .pie-template-line'
    );
    expect(measured, 'PIE stem not measurable').not.toBeNull();
    const m = measured as NonNullable<typeof measured>;
    expect(
      m.lines.length,
      `PIE stem must wrap to at least 2 lines (got ${m.lines.length}); test setup did not produce a wrap. measured=${JSON.stringify(m)}`
    ).toBeGreaterThanOrEqual(2);

    // Pick the wrapped line with the most leftover space — that's where a
    // center alignment is most visible. A line whose width nearly fills the
    // stem has almost no leftover and won't reveal the symptom regardless of
    // the alignment rule.
    const wrappedLines = m.lines.slice(1);
    const symptomLine = wrappedLines.reduce((a, b) => (a.leftover >= b.leftover ? a : b));
    // For a left-aligned line, the indent should be small regardless of how
    // much leftover space the line has. For a center-aligned line, the indent
    // is approximately leftover/2 — we use that as the "centered" predicate.
    const expectedCenteredIndent = symptomLine.leftover / 2;
    expect(
      symptomLine.deltaFromContentLeft,
      `Wrapped line at top=${symptomLine.top} has indent=${symptomLine.deltaFromContentLeft}px with leftover=${symptomLine.leftover}px (centered would be ~${expectedCenteredIndent}px). Expected left-aligned (≤ ${ALIGNMENT_TOLERANCE_PX}px). All lines: ${JSON.stringify(m.lines)}`
    ).toBeLessThanOrEqual(ALIGNMENT_TOLERANCE_PX);
  });
});
