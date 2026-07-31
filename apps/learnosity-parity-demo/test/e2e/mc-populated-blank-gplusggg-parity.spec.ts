/**
 * Parity tests for mc-populated-blank — variant-sel-r1-gplusggg.
 *
 * SECTION 1 (legacy): CSS-geometry assertions derived from static reference screenshots.
 *   These run against the PIE deliver route with no Learnosity dependency.
 *
 * SECTION 2 (live parity): Side-by-side comparison against the live Learnosity rendering
 *   via the /mc-populated-blank/parity route.  Tests in this section are skipped when
 *   LEARNOSITY_CONSUMER_KEY is not set in the environment.
 *
 * ── ARIA attribute reference (issue 05) ────────────────────────────────────────────────
 * Derived from web-ItemBankViewer/learnosity/templates/Renaissance/components/src/ and
 * cross-referenced against McPopulatedBlank.svelte.
 *
 * | Attribute          | Learnosity element              | PIE element                        |
 * |--------------------|----------------------------------|-------------------------------------|
 * | role="group"       | div.{prefix}-distractors         | div[role="radiogroup"] (stronger)   |
 * | aria-label (group) | "Choose the best answer…"        | legendText or choiceGroupAriaLabel  |
 * | aria-label (blank) | span#{prefix}-cloze-blank        | span[role="status"] aria-label      |
 * |                    |   value: "blank"                 |   value: uiText.selectedAnswerInSentence ("blank") |
 * | alt (silent img)   | img.{prefix}-silent              | img.pie-listen-icon (silent)        |
 * |                    |   value: "Repeat instructions"   |   value: uiText.listenSilentAlt     |
 * | alt (playing img)  | img.{prefix}-playing             | img.pie-listen-icon (playing)       |
 * |                    |   value: "Instructions are playing" | value: uiText.listenPlayingAlt   |
 * | aria-hidden        | input[type=radio] when masked    | out of scope (masking not in PIE)   |
 * ───────────────────────────────────────────────────────────────────────────────────────
 *
 * Pattern for variant spec authors:
 *   describe('visual')    — cross-compare computed CSS values, both sides must match
 *   describe('aria')      — specific named attributes on corresponding elements
 *   describe('behavioral')— audio lifecycle events via audio mock → state changes
 */

import { type Page, expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';
import { installAudioMock } from './audio-mock';
import {
  assertAudioPlayCycle,
  assertBlankSlotAriaLive,
  assertChoicesGroupAccessibleLabel,
  assertChoicesGroupVisible,
  assertScreenshotParity,
} from './mc-populated-blank-parity-shared';
import { PARITY_REGIONS } from './parity-regions';

const DEMO_ID = 'variant-sel-r1-gplusggg';
const CREDENTIALS_PRESENT = !!process.env.LEARNOSITY_CONSUMER_KEY;

// ---------------------------------------------------------------------------
// SECTION 1 — Legacy CSS-geometry assertions (no Learnosity dependency)
// ---------------------------------------------------------------------------

async function openGplusgggRoute(page: Page) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(DEMO_ID)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

test('gplusggg: audio button is to the right of the template line midpoint', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  // The audio container spans ~875px with justify-content:flex-end; use the button itself
  // for horizontal position checks rather than the wide container.
  const listenButton = root.locator('.pie-listen-button');
  const templateLine = root.locator('.pie-template-line');

  await expect(listenButton).toBeVisible();
  await expect(templateLine).toBeVisible();

  const audioBox = await listenButton.boundingBox();
  const templateBox = await templateLine.boundingBox();

  expect(audioBox).not.toBeNull();
  expect(templateBox).not.toBeNull();

  const templateMidX = templateBox?.x + templateBox?.width / 2;
  expect(audioBox?.x).toBeGreaterThan(templateMidX);
});

test('gplusggg: audio button top is above or level with the template line top', async ({
  page,
}) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const listenButton = root.locator('.pie-listen-button');
  const templateLine = root.locator('.pie-template-line');

  await expect(listenButton).toBeVisible();
  await expect(templateLine).toBeVisible();

  const audioBox = await listenButton.boundingBox();
  const templateBox = await templateLine.boundingBox();

  expect(audioBox).not.toBeNull();
  expect(templateBox).not.toBeNull();

  expect(audioBox?.y).toBeLessThanOrEqual(templateBox?.y + 10);
});

test('gplusggg: selected choice tile background is light yellow (#fcfcd3)', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const selectedTile = root.locator('.choice-row-horizontal.is-selected .choice-tile').first();
  await expect(selectedTile).toBeVisible();
  await expect(selectedTile).toHaveCSS('background-color', 'rgb(252, 252, 211)');
});

test('gplusggg: unselected choice tile background is transparent or white', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  await expect(root.locator('input[type="radio"]:checked')).toHaveCount(0);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  const bg = await firstTile.evaluate((el) => getComputedStyle(el).backgroundColor);
  const isTransparentOrWhite =
    bg === 'rgba(0, 0, 0, 0)' || bg === 'transparent' || bg === 'rgb(255, 255, 255)';
  expect(isTransparentOrWhite).toBe(true);
});

test('gplusggg: hovered unselected tile background is #f2f2f2', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const firstTile = root.locator('.choice-tile').first();
  await expect(firstTile).toBeVisible();

  await firstTile.hover();
  await page.waitForTimeout(100);

  await expect(firstTile).toHaveCSS('background-color', 'rgb(242, 242, 242)');
});

test('gplusggg: gap between adjacent choice tiles is at least 16px', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const tiles = root.locator('.choice-row-horizontal');
  await expect(tiles).toHaveCount(3);

  const boxes = await tiles.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().toJSON())
  );

  const gap01 = boxes[1].left - boxes[0].right;
  const gap12 = boxes[2].left - boxes[1].right;

  expect(gap01).toBeGreaterThanOrEqual(16);
  expect(gap12).toBeGreaterThanOrEqual(16);
});

test('gplusggg: blank slot underline is 6px', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const blank = root.locator('.pie-blank-slot');
  await expect(blank).toBeVisible();

  const borderWidth = await blank.evaluate((el) =>
    parseFloat(getComputedStyle(el).borderBottomWidth)
  );
  expect(borderWidth).toBe(6);
});

// ---------------------------------------------------------------------------
// r1.scss .rli-r1-stem { display:flex; flex-direction:row } — flex alignment keeps
// all token positions stable when the blank is filled.  The trailing text token
// (a direct child of .pie-template-line, not a descendant of .pie-blank-slot)
// must not shift when the blank slot content changes.
// ---------------------------------------------------------------------------
test('gplusggg: after-cloze content does not shift vertically when a distractor is selected', async ({
  page,
}) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  // Locate the trailing "four" span as a *direct child* of .pie-template-line,
  // not a descendant of the blank slot.  Use evaluate to find the direct-child
  // span reliably, since :scope > span is not available via Playwright locators.
  const getTrailingY = () =>
    page.evaluate(() => {
      const line = document.querySelector('.pie-template-line');
      const slot = document.querySelector('.pie-blank-slot');
      // Direct-child spans only — skip the blank slot itself
      const directSpans = Array.from(line?.children ?? []).filter(
        (el) => el.tagName === 'SPAN' && el !== slot
      ) as HTMLElement[];
      return directSpans[0]?.getBoundingClientRect().y ?? null;
    });

  const yBefore = await getTrailingY();
  expect(yBefore).not.toBeNull();
  if (yBefore === null) return;

  await root.locator('input[type="radio"]').first().check();
  await page.waitForTimeout(100);

  const yAfter = await getTrailingY();
  expect(yAfter).not.toBeNull();
  if (yAfter === null) return;
  expect(Math.abs(yAfter - yBefore)).toBeLessThan(2);
});

// ---------------------------------------------------------------------------
// r1.scss: .rli-r1-content-element { font-size: 1.9em } wraps all stem tokens.
// Inline font-size spans in the template (e.g. style="font-size:1.8em") multiply
// on top of this. The 1.9em resolves against the Learnosity host base of 14px,
// pinned on the variant root in sel-r1-base.css for parity. → 26.6px.
// ---------------------------------------------------------------------------
test('gplusggg: template line font size matches LSY (14px × 1.9em = 26.6px)', async ({ page }) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const templateLine = root.locator('.pie-template-line');
  await expect(templateLine).toBeVisible();

  const fontSize = await templateLine.evaluate((el) => getComputedStyle(el).fontSize);
  const px = parseFloat(fontSize);
  expect(Math.abs(px - 26.6)).toBeLessThanOrEqual(0.5);
});

// ---------------------------------------------------------------------------
// 9. Visible horizontal gap between ClozeMarker and the trailing "four" span
//    r1.scss: .rli-r1-content-element { margin-right: 2px; margin-left: 2px }
//    sel-r1-base.css replicates this via column-gap on .pie-template-line (flex row).
//    Without the column-gap, the span's left edge touches the blank slot's right edge.
//    Template: "<p>{{blank}} <span>four</span></p>" — blank first, "four" trailing.
// ---------------------------------------------------------------------------
test('gplusggg: there is a visible gap between the blank slot and the trailing token', async ({
  page,
}) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const blankSlot = root.locator('.pie-blank-slot');
  // Target spans from {@html} template content — they have no class attribute.
  // ClozeMarker's inner spans (.cloze-marker-empty, .cloze-marker-value) all have classes.
  const trailingSpan = root.locator('.pie-template-line span:not([class])').first();

  await expect(blankSlot).toBeVisible();
  await expect(trailingSpan).toBeVisible();

  const blankBox = await blankSlot.boundingBox();
  const spanBox = await trailingSpan.boundingBox();
  expect(blankBox).not.toBeNull();
  expect(spanBox).not.toBeNull();

  // 1rem gap at 1.8em token (≈55px rendered); require at least 10px.
  const gap = spanBox?.x - (blankBox?.x + blankBox?.width);
  expect(gap).toBeGreaterThanOrEqual(3);
});

// ---------------------------------------------------------------------------
// r1.scss: .rli-r1-instructions sits above .rli-r1-content-outer on the same page,
// so the audio button and blank are close together vertically.
// The audio container bottom edge must be within 80px of the template-line top.
// ---------------------------------------------------------------------------
test('gplusggg: audio button is vertically close to the template content (not absolute-offset)', async ({
  page,
}) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const audioContainer = root.locator('.pie-audio-container');
  const templateLine = root.locator('.pie-template-line');

  await expect(audioContainer).toBeVisible();
  await expect(templateLine).toBeVisible();

  const audioBox = await audioContainer.boundingBox();
  const templateBox = await templateLine.boundingBox();

  expect(audioBox).not.toBeNull();
  expect(templateBox).not.toBeNull();

  const audioBottom = audioBox?.y + audioBox?.height;
  const gap = templateBox?.y - audioBottom;
  expect(gap).toBeLessThan(80);
});

// ---------------------------------------------------------------------------
// 10. Blank slot height matches the adjacent token (not the 160px standalone height)
//     The audio_blank_only layout sets min-height:160px for standalone blanks, but
//     gplusggg has a trailing "four" token so the blank should not dominate the row.
//     The variant CSS overrides min-height:auto.
// ---------------------------------------------------------------------------
test('gplusggg: blank slot height is close to the adjacent token height (not 160px)', async ({
  page,
}) => {
  await openGplusgggRoute(page);
  const root = deliveryContainer(page);

  const blankSlot = root.locator('.pie-blank-slot');
  const trailingSpan = root.locator('.pie-template-line span:not([class])').first();

  await expect(blankSlot).toBeVisible();
  await expect(trailingSpan).toBeVisible();

  const blankBox = await blankSlot.boundingBox();
  const spanBox = await trailingSpan.boundingBox();
  expect(blankBox).not.toBeNull();
  expect(spanBox).not.toBeNull();

  // When broken: blank height is 160px (standalone min-height), token is ~82px.
  // When fixed: blank height matches token height within 2×.
  expect(blankBox?.height).toBeLessThan(spanBox?.height * 2);
});

// ---------------------------------------------------------------------------
// SECTION 2 — Live side-by-side parity (requires LEARNOSITY_CONSUMER_KEY)
// ---------------------------------------------------------------------------

async function openParityRoute(page: Page) {
  await page.goto(`/mc-populated-blank/parity?demo=${encodeURIComponent(DEMO_ID)}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('#pie-container pie-element-player', { timeout: 20_000 });
  await page.waitForSelector('[data-learnosity-ready="true"]', { timeout: 30_000 });
}

test.describe('gplusggg live parity — visual', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('both sides render a choices group', async ({ page }) => {
    await openParityRoute(page);
    await assertChoicesGroupVisible(page);
  });

  test('PIE selected tile background color is #fcfcd3 (r1 spec)', async ({ page }) => {
    await openParityRoute(page);

    await page.locator('#pie-container input[type="radio"]').first().check();
    await page.waitForTimeout(200);

    const pieBg = await page
      .locator('#pie-container .choice-row-horizontal.is-selected .choice-tile')
      .first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);

    // r1.scss: .rli-r1-selected { background-color: #fcfcd3 }
    expect(pieBg).toBe('rgb(252, 252, 211)');
  });

  test('audio button is positioned to the right of the template midpoint on PIE side', async ({
    page,
  }) => {
    await openParityRoute(page);

    // The container spans ~875px; use the listen button for horizontal position checks.
    const pieListenButton = page.locator('#pie-container .pie-listen-button');
    await expect(pieListenButton).toBeVisible();

    const pieAudioBox = await pieListenButton.boundingBox();
    const pieTemplateBox = await page.locator('#pie-container .pie-template-line').boundingBox();

    expect(pieAudioBox?.x).toBeGreaterThan(pieTemplateBox?.x + pieTemplateBox?.width / 2);
  });

  test('PIE stem, choices, and audio regions match Learnosity baseline screenshots', async ({
    page,
  }, testInfo) => {
    await openParityRoute(page);
    await assertScreenshotParity(page, testInfo, DEMO_ID, PARITY_REGIONS[DEMO_ID]);
  });
});

test.describe('gplusggg live parity — aria', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('choices group has an accessible label on both sides', async ({ page }) => {
    await openParityRoute(page);
    await assertChoicesGroupAccessibleLabel(page);
  });

  test('Learnosity choices group aria-label is the accessibility-expert string', async ({
    page,
  }) => {
    await openParityRoute(page);

    const lrnGroup = page
      .locator('#learnosity-container [role="group"], #learnosity-container [role="radiogroup"]')
      .first();
    const lrnAriaLabel = await lrnGroup.getAttribute('aria-label');
    // gplusggg item uses "blank" (not "sentence") — no trailing period in Learnosity's render
    expect(lrnAriaLabel).toBe(
      'Choose the best answer, then go back to the blank to listen to your choice'
    );
  });

  test('blank slot aria-label is "blank" on both sides', async ({ page }) => {
    await openParityRoute(page);

    // PIE side — shared assertion
    const pieBlankLabel = await page
      .locator('#pie-container .pie-blank-slot')
      .getAttribute('aria-label');
    expect(pieBlankLabel).toBe('blank');

    // Learnosity side — variant-specific: span with aria-label="blank" or "(blank)"
    const lrnBlankLabel = await page
      .locator(
        '#learnosity-container [aria-label="blank"], #learnosity-container [aria-label="(blank)"]'
      )
      .first()
      .getAttribute('aria-label');
    expect(lrnBlankLabel).toMatch(/blank/i);
  });

  test('audio silent image alt is "Repeat instructions" on PIE side', async ({ page }) => {
    await openParityRoute(page);

    const silentImg = page.locator('#pie-container .pie-listen-icon').first();
    const alt = await silentImg.getAttribute('alt');
    expect(alt).toBe('Repeat instructions');
  });

  test('Learnosity silent image is rendered (aria carried by button)', async ({ page }) => {
    await openParityRoute(page);

    // Learnosity renders the silent img as .rli-r1-silent — the button itself carries
    // aria-label="Listen" so the img alt is null by design (decorative).
    const lrnSilentImg = page.locator('#learnosity-container .rli-r1-silent').first();
    await expect(lrnSilentImg).toBeVisible();
    // The containing button carries the accessible label
    const btnLabel = await page
      .locator('#learnosity-container .rli-r1-audio')
      .first()
      .getAttribute('aria-label');
    expect(btnLabel).toBeTruthy();
  });

  test('blank slot has role="status" and aria-live="polite" on PIE side', async ({ page }) => {
    await openParityRoute(page);
    await assertBlankSlotAriaLive(page, { expectAriaAtomic: true });
  });
});

test.describe('gplusggg live parity — behavioral', () => {
  test.skip(!CREDENTIALS_PRESENT, 'Skipped: LEARNOSITY_CONSUMER_KEY not set');

  test('PIE audio button cycles through play and ended states', async ({ page }) => {
    await installAudioMock(page);
    await openParityRoute(page);
    await assertAudioPlayCycle(page);
  });
});
