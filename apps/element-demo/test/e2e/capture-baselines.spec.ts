/**
 * One-time baseline capture script.
 *
 * Navigates to the parity page for each variant, waits for Learnosity to
 * render, crops the Learnosity panel into stem / choices / audio regions,
 * and writes them to test/e2e/snapshots/learnosity/<variant>/<region>.png.
 *
 * IMPORTANT: Requires LEARNOSITY_CONSUMER_KEY in the environment.
 * Run once per variant when first setting up parity coverage, then commit
 * the resulting screenshots. Re-run only if a variant is added or if PIE
 * deliberately diverges from the reference (update the override in
 * parity-regions.ts and re-capture the affected variant).
 *
 * Usage:
 *   LEARNOSITY_CONSUMER_KEY=<key> npx playwright test test/e2e/capture-baselines.spec.ts --project=chromium
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Page, test } from '@playwright/test';
import { PARITY_REGIONS } from './parity-regions';

const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;
// Must match snapshotDir in playwright.config.ts + the sub-path used in toHaveScreenshot().
const SNAPSHOTS_DIR = path.join(fileURLToPath(import.meta.url), '..', 'snapshots', 'learnosity');

async function openParityPage(page: Page, demoId: string) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(demoId)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
  // Extra settle time for font loading and layout stabilisation.
  await page.waitForTimeout(1_000);
}

async function captureRegion(
  page: Page,
  containerSelector: string,
  regionSelector: string,
  variantId: string,
  regionName: string
) {
  const container = page.locator(containerSelector);
  const region = container.locator(regionSelector);
  await region.waitFor({ state: 'visible', timeout: 10_000 });
  const buffer = await region.screenshot();
  // Flat filename matching snapshotPathTemplate: '{snapshotDir}/{arg}{ext}'
  const outPath = path.join(SNAPSHOTS_DIR, `learnosity-${variantId}-${regionName}.png`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
}

test.describe('capture Learnosity baselines', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  for (const [variantId, regions] of Object.entries(PARITY_REGIONS)) {
    test(`capture baseline: ${variantId}`, async ({ page }) => {
      test.setTimeout(60_000);
      await openParityPage(page, variantId);

      const lrn = '#learnosity-container';

      await captureRegion(page, lrn, regions.stem.learnosity, variantId, 'stem');
      await captureRegion(page, lrn, regions.choices.learnosity, variantId, 'choices');

      if (regions.audio) {
        await captureRegion(page, lrn, regions.audio.learnosity, variantId, 'audio');
      }

      test.info().annotations.push({
        type: 'baseline-captured',
        description: `${variantId} → ${SNAPSHOTS_DIR}`,
      });
    });
  }
});
