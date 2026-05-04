/**
 * Interaction tests for mc-populated-blank.
 *
 * Covers the shared interaction contract across all CQT variants:
 * radio selection, session emission, evaluate-mode feedback,
 * show/hide correct-answer toggle, and audio-completion gating.
 *
 * Uses `variant-sr-vic` (no audio) as the default fixture because it lets
 * interaction tests run without network dependencies. Audio-gated tests use
 * `variant-sel-vic` (has audio, completeAudioEnabled=true, autoplayAudioEnabled=true).
 */

import { expect, test } from '@playwright/test';
import {
  deliveryContainer,
  getSessionState,
  openDeliverRoute,
  waitForMathRendering,
} from './test-helpers';

const NO_AUDIO_DEMO = 'variant-sr-vic';
const AUDIO_DEMO = 'variant-sel-vic';
// Pre-seeded evaluate fixtures (session has choiceId already set)
const EVALUATE_CORRECT_DEMO = 'evaluate-correct'; // choiceId=distractor_1 (correct)
const EVALUATE_WRONG_DEMO = 'evaluate-wrong'; // choiceId=distractor_2 (wrong)

// sr-vic: choices=[distractor_1, distractor_2, distractor_3, distractor_4], correctChoiceId=distractor_1
const CORRECT_INDEX = 0; // distractor_1 — correct
const WRONG_INDEX = 1; // distractor_2 — wrong
const CORRECT_VALUE = 'distractor_1';
const WRONG_VALUE = 'distractor_2';

// sel-vic: choices=[distractor_1, distractor_2, distractor_3], correctChoiceId=distractor_1
const AUDIO_CORRECT_INDEX = 0; // distractor_1
const AUDIO_WRONG_INDEX = 1; // distractor_2

type TestPage = Parameters<typeof test>[0]['page'];

async function openNoAudioRoute(page: TestPage) {
  await openDeliverRoute(page, 'mc-populated-blank', NO_AUDIO_DEMO);
  await waitForMathRendering(page);
}

async function openAudioRoute(page: TestPage) {
  await openDeliverRoute(page, 'mc-populated-blank', AUDIO_DEMO);
  await waitForMathRendering(page);
}

async function openEvaluateRoute(page: TestPage, demo: string) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=evaluate&role=instructor&demo=${encodeURIComponent(demo)}&player=esm`
  );
  await page.waitForLoadState('networkidle');
  await waitForMathRendering(page);
}

async function selectChoice(page: TestPage, index: number) {
  const root = deliveryContainer(page);
  const radio = root.locator('input[type="radio"]').nth(index);
  await radio.check();
}

// ---------------------------------------------------------------------------
// Radio selection
// ---------------------------------------------------------------------------

test('selecting a choice checks its radio input', async ({ page }) => {
  await openNoAudioRoute(page);
  const root = deliveryContainer(page);

  await selectChoice(page, CORRECT_INDEX);

  const radio = root.locator('input[type="radio"]').nth(CORRECT_INDEX);
  await expect(radio).toBeChecked();
});

test('selecting a choice applies is-selected class to its row', async ({ page }) => {
  await openNoAudioRoute(page);
  const root = deliveryContainer(page);

  await selectChoice(page, CORRECT_INDEX);

  const selectedRow = root.locator('.pie-choice.is-selected');
  await expect(selectedRow).toHaveCount(1);
  const radio = selectedRow.locator('input[type="radio"]');
  await expect(radio).toHaveAttribute('value', CORRECT_VALUE);
});

test('selecting a different choice moves is-selected to the new row', async ({ page }) => {
  await openNoAudioRoute(page);
  const root = deliveryContainer(page);

  await selectChoice(page, CORRECT_INDEX);
  await selectChoice(page, WRONG_INDEX);

  const selectedRows = root.locator('.pie-choice.is-selected');
  await expect(selectedRows).toHaveCount(1);
  const radio = selectedRows.locator('input[type="radio"]');
  await expect(radio).toHaveAttribute('value', WRONG_VALUE);
});

test('selected choice text appears in the blank slot', async ({ page }) => {
  await openNoAudioRoute(page);
  const root = deliveryContainer(page);

  await selectChoice(page, CORRECT_INDEX);

  const blankValue = root.locator('.pie-blank-value');
  await expect(blankValue).toBeVisible();
  await expect(blankValue).not.toBeEmpty();
});

// ---------------------------------------------------------------------------
// Session emission
// ---------------------------------------------------------------------------

test('selecting a choice emits session with the correct choiceId', async ({ page }) => {
  await openNoAudioRoute(page);

  await selectChoice(page, CORRECT_INDEX);
  await page.waitForTimeout(200);

  const session = await getSessionState(page);
  expect(session?.choiceId).toBe(CORRECT_VALUE);
});

test('selecting a different choice updates session choiceId', async ({ page }) => {
  await openNoAudioRoute(page);

  await selectChoice(page, CORRECT_INDEX);
  await page.waitForTimeout(200);
  await selectChoice(page, WRONG_INDEX);
  await page.waitForTimeout(200);

  const session = await getSessionState(page);
  expect(session?.choiceId).toBe(WRONG_VALUE);
});

// ---------------------------------------------------------------------------
// Evaluate mode — correctness classes
// ---------------------------------------------------------------------------

test('correct choice row gets pie-choice-correct class in evaluate mode', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_CORRECT_DEMO);

  const root = deliveryContainer(page);
  const correctRow = root.locator('.pie-choice.pie-choice-correct');
  await expect(correctRow).toHaveCount(1);
});

test('incorrect choice row gets pie-choice-incorrect class in evaluate mode', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);

  const root = deliveryContainer(page);
  // Wrong selection and the correct answer both get incorrect badge
  const incorrectRows = root.locator('.pie-choice.pie-choice-incorrect');
  await expect(incorrectRows).toHaveCount(2);
});

test('feedback badges appear in evaluate mode', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);

  const root = deliveryContainer(page);
  const badges = root.locator('.pie-choice-feedback-badge');
  const count = await badges.count();
  expect(count).toBeGreaterThan(0);
});

test('choices are disabled in evaluate mode', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);

  const root = deliveryContainer(page);
  const radios = root.locator('input[type="radio"]');
  const count = await radios.count();
  for (let i = 0; i < count; i++) {
    await expect(radios.nth(i)).toBeDisabled();
  }
});

// ---------------------------------------------------------------------------
// Show/hide correct-answer toggle
// ---------------------------------------------------------------------------

test('show-correct-answer toggle appears when wrong answer selected in evaluate mode', async ({
  page,
}) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);

  const root = deliveryContainer(page);
  const toggle = root.locator('[data-testid="show-correct-answer"]');
  await expect(toggle).toBeVisible();
});

test('show-correct-answer toggle does not appear when correct answer selected', async ({
  page,
}) => {
  await openEvaluateRoute(page, EVALUATE_CORRECT_DEMO);

  const root = deliveryContainer(page);
  const toggle = root.locator('[data-testid="show-correct-answer"]');
  await expect(toggle).not.toBeVisible();
});

test('clicking show-correct-answer marks toggle as pressed and shows only correct badge', async ({
  page,
}) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);

  const root = deliveryContainer(page);
  const toggle = root.locator('[data-testid="show-correct-answer"]');
  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-pressed', 'true');

  // In reveal mode only the correct choice gets a badge; wrong selection is suppressed
  const correctBadges = root.locator('.pie-choice-feedback-correct');
  await expect(correctBadges).toHaveCount(1);
  const incorrectBadges = root.locator('.pie-choice-feedback-incorrect');
  await expect(incorrectBadges).toHaveCount(0);
});

test('clicking show-correct-answer toggle again hides the reveal', async ({ page }) => {
  await openEvaluateRoute(page, EVALUATE_WRONG_DEMO);

  const root = deliveryContainer(page);
  const toggle = root.locator('[data-testid="show-correct-answer"]');
  await toggle.click();
  await toggle.click();

  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  // Both wrong selection and missed correct answer get incorrect badges again
  const incorrectBadges = root.locator('.pie-choice-feedback-incorrect');
  await expect(incorrectBadges).toHaveCount(2);
});

// ---------------------------------------------------------------------------
// Audio completion gating
// (variant-sel-vic: hasAudio=true, completeAudioEnabled=true, autoplayAudioEnabled=true)
// ---------------------------------------------------------------------------

test('audio-gated variant: isComplete is false when choice selected but audio not played', async ({
  page,
}) => {
  // Abort audio so it never plays
  await page.route('**/*.mp3', (route) => route.abort());

  await openAudioRoute(page);
  await selectChoice(page, AUDIO_WRONG_INDEX);
  await page.waitForTimeout(300);

  const session = await getSessionState(page);
  expect(session?.choiceId).toBeDefined();

  const isComplete = await page.evaluate(() => {
    const el = document.querySelector('mc-populated-blank-element') as any;
    return el?._isComplete?.() ?? null;
  });
  expect(isComplete).toBe(false);
});

test('audio-gated variant: isComplete is true after audio ends', async ({ page }) => {
  // Abort audio so the element can still be found without network delay
  await page.route('**/*.mp3', (route) => route.abort());

  await openAudioRoute(page);
  await selectChoice(page, AUDIO_CORRECT_INDEX);
  await page.waitForTimeout(300);

  // Simulate audio completion by directly calling onAudioEnded on the element
  // (real audio can't play in headless; this exercises the same code path as a real end event)
  await page.evaluate(() => {
    const el = document.querySelector('mc-populated-blank-element') as any;
    el?.onAudioEnded?.();
  });
  await page.waitForTimeout(100);

  const isComplete = await page.evaluate(() => {
    const el = document.querySelector('mc-populated-blank-element') as any;
    return el?._isComplete?.() ?? null;
  });
  expect(isComplete).toBe(true);
});

// ---------------------------------------------------------------------------
// Keyboard navigation
// ---------------------------------------------------------------------------

test('arrow keys move focus between choices', async ({ page }) => {
  await openNoAudioRoute(page);
  const root = deliveryContainer(page);

  // Click the first radio to give it real interactive focus (programmatic focus()
  // leaves the element in "inactive" focus state, which blocks keyboard navigation)
  const firstRadio = root.locator('input[type="radio"]').first();
  await firstRadio.click();
  await page.keyboard.press('ArrowDown');

  const secondRadio = root.locator('input[type="radio"]').nth(1);
  await expect(secondRadio).toBeFocused();
});
