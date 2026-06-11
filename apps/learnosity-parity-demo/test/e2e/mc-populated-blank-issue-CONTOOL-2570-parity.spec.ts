/**
 * Live parity test for CONTOOL-2570:
 * https://illuminate.atlassian.net/browse/CONTOOL-2570
 *
 * Reported by content: on every plusggg variant that uses image content
 * (graphic stem tokens or graphic distractors), images render smaller in PIE
 * than they do in Learnosity. The reported reference item is
 * 69d73376-ab3c-4ec6-8453-5b4e88e8977a (sel_r1-_ggplusggg, graphic).
 *
 * Variant: variant-sel-r1-ggplus-graphic — stem has two graphic tokens (woman,
 * girl) and three graphic distractors. Authored width/height attributes are
 * 108×108. LSY normalizes these to 150×150 (it rewrites the attributes server
 * side, and r1.scss applies .rli-r1-content-element { min/max:150px }), so
 * every image in the stem and the choice tiles renders at 150×150.
 *
 * The test asserts PIE renders the same image size as LSY, within ±2px to
 * absorb sub-pixel rendering noise. Without the fix PIE renders the authored
 * 108×108 box, which is the visible regression.
 */

import { expect, test } from '@playwright/test';

const DEMO_ID = 'variant-sel-r1-ggplus-graphic';
const SIZE_TOLERANCE_PX = 2;
const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

async function openParityRoute(page: import('@playwright/test').Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

function imageSizesFn() {
  return (selector: string) => {
    const imgs = Array.from(document.querySelectorAll(selector)) as HTMLImageElement[];
    return imgs.map((img) => {
      const rect = img.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    });
  };
}

test.describe('CONTOOL-2570 — graphic image size parity (ggplus-graphic)', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('stem graphic images render at the same size as Learnosity within ±2px', async ({
    page,
  }) => {
    await openParityRoute(page);

    const pieSizes = await page.evaluate(
      imageSizesFn(),
      '#pie-container .pie-template-line img'
    );
    const lrnSizes = await page.evaluate(imageSizesFn(), '#learnosity-container .rli-r1-stem img');

    expect(pieSizes.length, 'PIE stem images').toBeGreaterThan(0);
    expect(pieSizes.length, 'PIE/LSY stem image count mismatch').toBe(lrnSizes.length);

    for (let i = 0; i < pieSizes.length; i += 1) {
      expect(
        Math.abs(pieSizes[i].width - lrnSizes[i].width),
        `stem image #${i} width drift`
      ).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
      expect(
        Math.abs(pieSizes[i].height - lrnSizes[i].height),
        `stem image #${i} height drift`
      ).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
    }
  });

  test('distractor graphic images render at the same size as Learnosity within ±2px', async ({
    page,
  }) => {
    await openParityRoute(page);

    const pieSizes = await page.evaluate(
      imageSizesFn(),
      '#pie-container .pie-choice-label img'
    );
    const lrnSizes = await page.evaluate(
      imageSizesFn(),
      '#learnosity-container .rli-r1-distractors img'
    );

    expect(pieSizes.length, 'PIE distractor images').toBeGreaterThan(0);
    expect(pieSizes.length, 'PIE/LSY distractor image count mismatch').toBe(lrnSizes.length);

    for (let i = 0; i < pieSizes.length; i += 1) {
      expect(
        Math.abs(pieSizes[i].width - lrnSizes[i].width),
        `distractor image #${i} width drift`
      ).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
      expect(
        Math.abs(pieSizes[i].height - lrnSizes[i].height),
        `distractor image #${i} height drift`
      ).toBeLessThanOrEqual(SIZE_TOLERANCE_PX);
    }
  });
});
