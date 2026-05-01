/**
 * Structural contract tests for mc-populated-blank choice row rendering.
 *
 * These tests are a REFACTORING HARNESS for the choice row extraction work
 * (Q3 in the architecture review). They pin the DOM contracts that any
 * snippet or ChoiceRow.svelte component must preserve:
 *
 *   Horizontal tile:  <label> wraps tile content + radio (radio is a descendant)
 *   Vertical row:     <input> and <label> are siblings (radio NOT inside label)
 *   Both layouts:     outer .pie-choice row gains is-selected on selection
 *   Both layouts:     correctness badge lives inside the outer row in evaluate mode
 *
 * These tests do NOT test visual styling — they test structural invariants.
 * If a refactor breaks any of these, the change altered observable DOM behaviour.
 *
 * Horizontal demo: variant-sel-r1-plusggg  (token_sequence / horizontal tiles)
 * Vertical demo:   variant-sr-vic          (inline_sentence / vertical rows)
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, switchRole, switchMode, waitForMathRendering } from './test-helpers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function openRoute(
  page: Parameters<typeof test>[0]['page'],
  demoId: string,
  mode: string = 'gather'
) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=${mode}&role=student&demo=${encodeURIComponent(demoId)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

const HORIZONTAL_DEMO = 'variant-sel-r1-plusggg';
const VERTICAL_DEMO = 'variant-sr-vic';

// ===========================================================================
// HORIZONTAL TILE LAYOUT
// ===========================================================================

// ---------------------------------------------------------------------------
// H1. Radio input is a descendant of the label (label wraps the tile)
//     The tile pattern is: <label class="choice-tile"> … <input type="radio"> </label>
//     This is what makes the entire tile surface clickable without JS.
//     If extracted to a snippet/component, the radio MUST stay inside the label.
// ---------------------------------------------------------------------------
test('choice-row/horizontal: radio is a descendant of the tile label', async ({ page }) => {
  await openRoute(page, HORIZONTAL_DEMO);
  const root = deliveryContainer(page);

  // A radio nested inside a label with class choice-tile must exist.
  const tileRadio = root.locator('label.pie-choice-tile input[type="radio"]').first();
  await expect(tileRadio).toBeAttached();
});

// ---------------------------------------------------------------------------
// H2. Radio has the bottom-positioning class (not the inline class)
//     class="choice-radio-bottom pie-choice-radio pie-choice-radio-bottom"
//     Distinguishes the horizontal tile from the vertical radio-inline pattern.
// ---------------------------------------------------------------------------
test('choice-row/horizontal: radio has choice-radio-bottom class', async ({ page }) => {
  await openRoute(page, HORIZONTAL_DEMO);
  const root = deliveryContainer(page);

  const radio = root.locator('input.pie-choice-radio').first();
  await expect(radio).toHaveClass(/choice-radio-bottom/);
  await expect(radio).not.toHaveClass(/choice-radio-inline/);
});

// ---------------------------------------------------------------------------
// H3. Tile content wrapper exists between the label and the choice label span
//     Structure: label.choice-tile > span.choice-tile-content > span.pie-choice-label
//     The content wrapper controls min-height and alignment independent of the radio.
// ---------------------------------------------------------------------------
test('choice-row/horizontal: tile content wrapper wraps the choice label', async ({ page }) => {
  await openRoute(page, HORIZONTAL_DEMO);
  const root = deliveryContainer(page);

  const contentWrapper = root
    .locator('label.pie-choice-tile .pie-choice-tile-content .pie-choice-label')
    .first();
  await expect(contentWrapper).toBeAttached();
});

// ---------------------------------------------------------------------------
// H4. Selecting a choice adds is-selected to the outer .pie-choice row
//     The outer row (not the label/tile) owns the selection class so that
//     variant CSS can apply full-row backgrounds.
// ---------------------------------------------------------------------------
test('choice-row/horizontal: selecting a choice adds is-selected to outer row', async ({
  page,
}) => {
  await openRoute(page, HORIZONTAL_DEMO);
  const root = deliveryContainer(page);

  await expect(root.locator('.pie-choice.is-selected')).toHaveCount(0);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedRow = root.locator('.pie-choice.is-selected');
  await expect(selectedRow).toHaveCount(1);
  // The selected row must be the horizontal variant.
  await expect(selectedRow).toHaveClass(/pie-choice-horizontal/);
});

// ---------------------------------------------------------------------------
// H5. Correctness badge is a direct child of the outer .pie-choice row
//     Not inside the label/tile — the badge sits alongside the tile, inside
//     the row wrapper. This placement must survive snippet/component extraction.
// ---------------------------------------------------------------------------
test('choice-row/horizontal: correctness badge is inside outer pie-choice row in evaluate mode', async ({
  page,
}) => {
  await openRoute(page, HORIZONTAL_DEMO);
  const root = deliveryContainer(page);

  // Select any choice before switching to evaluate.
  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  await switchRole(page, 'instructor');

  // A feedback badge must exist somewhere in the choices.
  const badge = root.locator('.pie-choice .pie-choice-feedback-badge').first();
  await expect(badge).toBeAttached();

  // The badge must NOT be inside the tile label (it sits alongside it).
  const badgeInsideTile = root.locator('label.pie-choice-tile .pie-choice-feedback-badge').first();
  await expect(badgeInsideTile).not.toBeAttached();
});

// ===========================================================================
// VERTICAL ROW LAYOUT
// ===========================================================================

// ---------------------------------------------------------------------------
// V1. Radio is NOT a descendant of the label (they are siblings)
//     Vertical structure: <input> … <label class="pie-choice-label-wrap"> …
//     The radio and label are adjacent siblings inside the outer row div.
//     This is the inverse of the horizontal contract and must stay intact.
// ---------------------------------------------------------------------------
test('choice-row/vertical: radio is NOT inside the label (siblings, not nested)', async ({
  page,
}) => {
  await openRoute(page, VERTICAL_DEMO);
  const root = deliveryContainer(page);

  // If radio were inside label, this locator would find it.
  const radioNestedInLabel = root
    .locator('label.pie-choice-label-wrap input[type="radio"]')
    .first();
  await expect(radioNestedInLabel).not.toBeAttached();

  // The standalone inline radio must exist.
  const inlineRadio = root.locator('input.pie-choice-radio-inline').first();
  await expect(inlineRadio).toBeAttached();
});

// ---------------------------------------------------------------------------
// V2. Label has pie-choice-label-wrap class (not choice-tile)
//     Distinguishes vertical from horizontal — the label is not a tile wrapper.
// ---------------------------------------------------------------------------
test('choice-row/vertical: label has pie-choice-label-wrap class', async ({ page }) => {
  await openRoute(page, VERTICAL_DEMO);
  const root = deliveryContainer(page);

  const labelWrap = root.locator('label.pie-choice-label-wrap').first();
  await expect(labelWrap).toBeAttached();

  // Must not use the horizontal tile class.
  await expect(labelWrap).not.toHaveClass(/choice-tile/);
});

// ---------------------------------------------------------------------------
// V3. Selecting a choice adds is-selected to the outer .pie-choice row
//     Same contract as horizontal — the outer row owns the selection state.
// ---------------------------------------------------------------------------
test('choice-row/vertical: selecting a choice adds is-selected to outer row', async ({ page }) => {
  await openRoute(page, VERTICAL_DEMO);
  const root = deliveryContainer(page);

  await expect(root.locator('.pie-choice.is-selected')).toHaveCount(0);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedRow = root.locator('.pie-choice.is-selected');
  await expect(selectedRow).toHaveCount(1);
  // The selected row must NOT be the horizontal variant.
  await expect(selectedRow).not.toHaveClass(/pie-choice-horizontal/);
});

// ---------------------------------------------------------------------------
// V4. Correctness badge is a direct child of the outer .pie-choice row
//     Same placement contract as horizontal — badge sits inside the row,
//     not inside the label wrapper.
// ---------------------------------------------------------------------------
test('choice-row/vertical: correctness badge is inside outer pie-choice row in evaluate mode', async ({
  page,
}) => {
  await openRoute(page, VERTICAL_DEMO);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  await switchRole(page, 'instructor');

  const badge = root.locator('.pie-choice .pie-choice-feedback-badge').first();
  await expect(badge).toBeAttached();

  // Badge must NOT be inside the label wrapper.
  const badgeInsideLabel = root
    .locator('label.pie-choice-label-wrap .pie-choice-feedback-badge')
    .first();
  await expect(badgeInsideLabel).not.toBeAttached();
});

// ===========================================================================
// SHARED: radio checked state mirrors is-selected class
// ===========================================================================

// ---------------------------------------------------------------------------
// S1. Checked radio and is-selected row always correspond (horizontal)
//     After selection: exactly one radio is checked, exactly one row is selected,
//     and they refer to the same choice id.
// ---------------------------------------------------------------------------
test('choice-row/horizontal: checked radio id matches is-selected row', async ({ page }) => {
  await openRoute(page, HORIZONTAL_DEMO);
  const root = deliveryContainer(page);

  const radios = root.locator('input[type="radio"]');
  const count = await radios.count();
  expect(count).toBeGreaterThan(0);

  // Check the last radio (least likely to be the default).
  await radios.last().check();
  await page.waitForTimeout(100);

  const checkedId = await radios.last().getAttribute('id');
  const selectedRow = root.locator('.pie-choice.is-selected');
  await expect(selectedRow).toHaveCount(1);

  // The for= attribute on the tile label must match the checked radio id.
  const labelFor = await root
    .locator('.pie-choice.is-selected label.pie-choice-tile')
    .getAttribute('for');
  expect(labelFor).toBe(checkedId);
});

// ---------------------------------------------------------------------------
// S2. Checked radio id matches is-selected row (vertical)
// ---------------------------------------------------------------------------
test('choice-row/vertical: checked radio id matches is-selected row', async ({ page }) => {
  await openRoute(page, VERTICAL_DEMO);
  const root = deliveryContainer(page);

  const radios = root.locator('input[type="radio"]');
  await radios.last().check();
  await page.waitForTimeout(100);

  const checkedId = await radios.last().getAttribute('id');
  const selectedRow = root.locator('.pie-choice.is-selected');
  await expect(selectedRow).toHaveCount(1);

  const labelFor = await root
    .locator('.pie-choice.is-selected label.pie-choice-label-wrap')
    .getAttribute('for');
  expect(labelFor).toBe(checkedId);
});
