/**
 * Automated WCAG 2.2 Level AA checks for mc-populated-blank.
 *
 * Scans three meaningfully distinct DOM states:
 *   - gather mode (student, no selection)
 *   - evaluate mode, correct answer pre-seeded
 *   - evaluate mode, wrong answer pre-seeded
 *
 * Uses @axe-core/playwright scoped to the delivery container so that
 * demo-app chrome (toolbars, panels) does not pollute the results.
 *
 * Fixture: variant-sr-vic (vertical choices, no audio) for gather mode.
 * Evaluate fixtures: evaluate-correct / evaluate-wrong (pre-seeded session).
 */

import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import {
  deliveryContainer,
  openDeliverRoute,
  switchRole,
  waitForMathRendering,
} from './test-helpers';

const NO_AUDIO_DEMO = 'variant-sr-vic';
const EVALUATE_CORRECT_DEMO = 'evaluate-correct';
const EVALUATE_WRONG_DEMO = 'evaluate-wrong';

async function openGatherRoute(page: Parameters<typeof test>[0]['page']) {
  await openDeliverRoute(page, 'mc-populated-blank', NO_AUDIO_DEMO);
  await waitForMathRendering(page);
}

async function openEvaluateRoute(page: Parameters<typeof test>[0]['page'], demo: string) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=evaluate&role=instructor&demo=${encodeURIComponent(demo)}&player=esm`
  );
  await page.waitForLoadState('networkidle');
  await waitForMathRendering(page);
}

// ---------------------------------------------------------------------------
// Gather mode
// ---------------------------------------------------------------------------

test('axe: no violations in gather mode (no selection)', async ({ page }) => {
  await openGatherRoute(page);
  const container = deliveryContainer(page);
  await container.waitFor({ state: 'visible' });

  const results = await new AxeBuilder({ page })
    .include('mc-populated-blank-element')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('axe: no violations in gather mode after selecting a choice', async ({ page }) => {
  await openGatherRoute(page);
  const container = deliveryContainer(page);

  await container.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const results = await new AxeBuilder({ page })
    .include('mc-populated-blank-element')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

// ---------------------------------------------------------------------------
// Evaluate mode
// ---------------------------------------------------------------------------

test('axe: no violations in evaluate mode with correct answer', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_CORRECT_DEMO);
  const container = deliveryContainer(page);
  await container.waitFor({ state: 'visible' });

  const results = await new AxeBuilder({ page })
    .include('mc-populated-blank-element')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('axe: no violations in evaluate mode with wrong answer', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);
  const container = deliveryContainer(page);
  await container.waitFor({ state: 'visible' });

  const results = await new AxeBuilder({ page })
    .include('mc-populated-blank-element')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

test('axe: no violations in evaluate mode after toggling show-correct-answer', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);
  const container = deliveryContainer(page);

  const toggle = container.locator('[data-testid="show-correct-answer"]');
  await toggle.click();

  const results = await new AxeBuilder({ page })
    .include('mc-populated-blank-element')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});

// ---------------------------------------------------------------------------
// Colour schemes
//
// The CQT variants paint fixed light surfaces on hovered and selected choices
// (#f2f2f2, #fcfcd3) and colour the vic blank's answer #cc3333. Under the dark
// scheme each has to carry the other side of its pair: the inherited text is
// near-white, and the page behind the answer is dark. sel-r1-plusggg covers the
// horizontal tiles, sr-vic the inline rows. Choosing the second choice before
// scoring leaves a selected choice marked incorrect in both fixtures. The scan
// waits out the tile's background transition, which axe would otherwise sample
// half-painted.
// ---------------------------------------------------------------------------

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`${colorScheme} scheme`, () => {
    test.use({ colorScheme });

    for (const demo of ['variant-sel-r1-plusggg', 'variant-sr-vic']) {
      test(`axe: ${demo} contrast when selected, hovered and scored`, async ({ page }) => {
        await openDeliverRoute(page, 'mc-populated-blank', demo);
        await waitForMathRendering(page);
        const choices = deliveryContainer(page).locator('.pie-choice');

        const scan = async () => {
          await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
          return new AxeBuilder({ page })
            .include('mc-populated-blank-element')
            .withRules(['color-contrast'])
            .analyze();
        };

        await choices.nth(0).locator('input[type="radio"]').check();
        await choices.nth(1).hover();
        expect((await scan()).violations).toEqual([]);

        await choices.nth(0).hover();
        expect((await scan()).violations).toEqual([]);

        // Scoring repaints the selected choice with a correctness background.
        await choices.nth(1).locator('input[type="radio"]').check();
        await switchRole(page, 'instructor');
        await page.mouse.move(0, 0);
        await expect(choices.and(page.locator('.is-selected'))).toHaveClass(/choice-incorrect/);
        expect((await scan()).violations).toEqual([]);
      });
    }
  });
}
