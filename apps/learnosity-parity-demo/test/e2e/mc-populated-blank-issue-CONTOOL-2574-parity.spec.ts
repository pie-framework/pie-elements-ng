/**
 * Live parity test for CONTOOL-2574:
 * https://illuminate.atlassian.net/browse/CONTOOL-2574
 *
 * Reported by content: on the sel_vic and sr_vic variants, when screen real
 * estate is limited and the cloze marker would wrap to a new line, the
 * preceding word should wrap with it so the cloze is never the first content
 * on a wrapped line. PIE breaks before the cloze and leaves it dangling alone
 * at the start of a new line; LSY pulls the preceding word along because its
 * cloze.js emits literal `&nbsp;` characters around the cloze span:
 *
 *   `&nbsp;<span id="...-cloze-blank"></span><span class="...-cloze">…</span>&nbsp;`
 *
 * The reproduction reuses the variant-sel-vic-cloze-punct sample (already
 * registered for CONTOOL-2572/2573). To make the wrap-around-cloze symptom
 * deterministic, the test resizes the template-line container and inflates
 * the cloze marker's width so the only feasible break point is between the
 * preceding word and the cloze. With that setup, the buggy code leaves the
 * cloze alone on line 2; the fix mirrors LSY by emitting NBSP next to the
 * cloze so the preceding word wraps with it.
 *
 * The test asserts the PIE side only — LSY satisfies the contract by
 * construction (the &nbsp;s are in its rendered HTML), and the symptom is
 * about within-PIE layout behaviour, not pixel parity.
 */

import { expect, test } from '@playwright/test';

const DEMO_ID = 'variant-sel-vic-cloze-punct';
const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

/**
 * Set up the layout so the cloze marker would naturally wrap with no
 * preceding word on the same line.
 *
 * Approach:
 *   1. Use the as-rendered template text from the demo sample so we don't
 *      perturb the very thing the fix produces (overwriting the rendered text
 *      node would replace any NBSP the fix inserted with whatever character
 *      we wrote).
 *   2. Inflate the cloze marker's width so it cannot share a line with the
 *      preceding word at the clamp width.
 *   3. Clamp the template-line container so the only feasible break is the
 *      space between the preamble's last word and the cloze. With the buggy
 *      code, the cloze ends up alone at the start of line 2; the fix puts
 *      the preceding word with the cloze on line 2 (or makes the whole tail
 *      stay together so no break opportunity exists at all).
 */
async function setUpClozeAtStartOfWrappedLine(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const line = document.querySelector('#pie-container .pie-template-line') as HTMLElement | null;
    if (line) {
      line.style.maxWidth = '14em';
      line.style.width = '14em';
    }
    const cloze = document.querySelector('#pie-container .pie-blank-slot') as HTMLElement | null;
    if (cloze) {
      cloze.style.minWidth = '7em';
      cloze.style.width = '7em';
    }
  });
}

/**
 * Measure the cloze marker's line and report whether any non-whitespace glyph
 * sits to its left on the same visual line.
 *
 * Same-line predicate: we use the cloze's INNER content rect (the displayed
 * answer / placeholder), not the outer cloze bounding box. The outer box is
 * taller than the text height because of the underline border + min-h-1.5em
 * padding, so its rect would overlap with the preceding line and falsely
 * group glyphs as same-line. The inner content rect tracks the text baseline,
 * which is what the eye uses to read "same line".
 */
function measureClozeLineFn() {
  return (args: { stemSelector: string; clozeSelector: string }) => {
    const stem = document.querySelector(args.stemSelector) as HTMLElement | null;
    const cloze = document.querySelector(args.clozeSelector) as HTMLElement | null;
    if (!stem || !cloze) return null;
    const clozeRect = cloze.getBoundingClientRect();
    const innerEl =
      (cloze.querySelector('.pie-blank-value, .cloze-marker-empty') as HTMLElement | null) ?? cloze;
    const innerRect = innerEl.getBoundingClientRect();

    const walker = document.createTreeWalker(stem, NodeFilter.SHOW_TEXT);
    const sameLineRects: { left: number; right: number; top: number; text: string }[] = [];
    const allLineCenters = new Set<number>();
    let node = walker.nextNode() as Text | null;
    while (node) {
      if (cloze.contains(node)) {
        node = walker.nextNode() as Text | null;
        continue;
      }
      const text = node.nodeValue ?? '';
      for (let i = 0; i < text.length; i += 1) {
        const ch = text[i];
        if (/\s/.test(ch)) continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) continue;
        const cy = (rect.top + rect.bottom) / 2;
        allLineCenters.add(Math.round(cy));
        const sameLine = cy >= innerRect.top - 1 && cy <= innerRect.bottom + 1;
        if (!sameLine) continue;
        sameLineRects.push({ left: rect.left, right: rect.right, top: rect.top, text: ch });
      }
      node = walker.nextNode() as Text | null;
    }

    const leftOfCloze = sameLineRects
      .filter((r) => r.right <= clozeRect.left + 0.5)
      .sort((a, b) => a.left - b.left);
    const rightOfCloze = sameLineRects
      .filter((r) => r.left >= clozeRect.right - 0.5)
      .sort((a, b) => a.left - b.left);

    return {
      clozeLeft: clozeRect.left,
      lineCount: allLineCenters.size,
      leftOfClozeCount: leftOfCloze.length,
      rightOfClozeCount: rightOfCloze.length,
      // True when the cloze appears alone at the start of its visual line —
      // i.e. there is no text glyph on the same line whose right edge is at
      // or before the cloze's left edge. This is precisely the buggy state.
      clozeIsLineLeader: leftOfCloze.length === 0,
      firstLeftGlyph: leftOfCloze[leftOfCloze.length - 1]?.text ?? null,
    };
  };
}

test.describe('CONTOOL-2574 — vic cloze wraps with preceding word, never alone', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE sel-vic: when the stem wraps, the cloze line is not led by the cloze itself', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await openParityRoute(page);
    await setUpClozeAtStartOfWrappedLine(page);
    await page.waitForTimeout(150);

    const measured = await page.evaluate(measureClozeLineFn(), {
      stemSelector: '#pie-container .pie-template-line',
      clozeSelector: '#pie-container .pie-blank-slot',
    });
    expect(measured, 'PIE cloze not measurable').not.toBeNull();
    const m = measured as NonNullable<typeof measured>;

    expect(
      m.lineCount,
      `Test setup error: PIE stem did not wrap (lineCount=${m.lineCount}). measured=${JSON.stringify(m)}`
    ).toBeGreaterThanOrEqual(2);

    expect(
      m.clozeIsLineLeader,
      `PIE cloze starts a wrapped line with no preceding word on the same line. measured=${JSON.stringify(m)}. Expected the preceding word (e.g. "is") to wrap together with the cloze (LSY emits &nbsp; on either side of the cloze).`
    ).toBe(false);
  });
});
