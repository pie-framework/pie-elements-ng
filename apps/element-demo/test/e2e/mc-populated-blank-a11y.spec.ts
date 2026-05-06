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
import { deliveryContainer, openDeliverRoute, waitForMathRendering } from './test-helpers';

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
