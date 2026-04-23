import { test, expect, type Page, type Locator } from '@playwright/test';
import {
  getSessionState,
  switchMode,
  switchRole,
  switchTab,
  openDeliverRoute,
  waitForSessionMutation,
  getModelFromSource,
} from './test-helpers';

/**
 * Smoke tests for the venn-classification Svelte element.
 *
 * Covers:
 *  - loading the element on the deliver tab
 *  - author / source / deliver tab round-trip
 *  - one pointer-based drop
 *  - one keyboard-based placement
 *  - one evaluate-mode correctness badge
 */

const ELEMENT = 'venn-classification';
const DEMO_ID = 'reptile-egg-layer';

function vennRoot(page: Page): Locator {
  return page.locator('.venn-root').first();
}

async function waitForVennReady(page: Page) {
  await vennRoot(page).waitFor({ state: 'visible', timeout: 20_000 });
  // A tile and the tray must both render before we start interacting.
  await page
    .locator('.venn-root [data-region-key="tray"] [data-tile-id]')
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 });
}

/**
 * Drop a tile into a named region. The `data-region-key` aria anchor is a
 * visually-hidden 1×1 px div positioned at the geometric center of the
 * drop zone (in viewBox coords) — which is exactly what `hitTest` expects
 * to match on pointerup. We also emit real PointerEvents because the
 * delivery component listens for `pointerdown/move/up` (not `mousedown/...`).
 */
async function dropTileIntoRegion(page: Page, tileId: string, regionKey: string) {
  const tile = page.locator(`.venn-root [data-tile-id="${tileId}"]`).first();
  const target = page.locator(`.venn-root [data-region-key="${regionKey}"]`).first();
  const tileBox = await tile.boundingBox();
  const targetBox = await target.boundingBox();
  if (!tileBox || !targetBox) {
    throw new Error(`Missing bounding box for tile=${tileId} or region=${regionKey}`);
  }
  const sx = tileBox.x + tileBox.width / 2;
  const sy = tileBox.y + tileBox.height / 2;
  const tx = targetBox.x + targetBox.width / 2;
  const ty = targetBox.y + targetBox.height / 2;

  // Use evaluate to dispatch real PointerEvents (Playwright's page.mouse
  // does not always synthesize PointerEvents with setPointerCapture-friendly
  // semantics across headless builds).
  await page.evaluate(
    ({ tileId, sx, sy, tx, ty }) => {
      const tile = document.querySelector(
        `.venn-root [data-tile-id="${tileId}"]`
      ) as HTMLElement | null;
      if (!tile) throw new Error(`tile not found: ${tileId}`);
      const mkEvent = (type: string, x: number, y: number) =>
        new PointerEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          pointerId: 1,
          pointerType: 'mouse',
          isPrimary: true,
          button: 0,
          buttons: type === 'pointerup' ? 0 : 1,
          clientX: x,
          clientY: y,
        });
      tile.dispatchEvent(mkEvent('pointerdown', sx, sy));
      // Drive a handful of intermediate moves so any throttled handlers fire.
      const steps = 8;
      for (let i = 1; i <= steps; i++) {
        const ix = sx + ((tx - sx) * i) / steps;
        const iy = sy + ((ty - sy) * i) / steps;
        window.dispatchEvent(mkEvent('pointermove', ix, iy));
      }
      window.dispatchEvent(mkEvent('pointerup', tx, ty));
    },
    { tileId, sx, sy, tx, ty }
  );
}

test.describe('Venn Classification (Svelte 5) - smoke', () => {
  test.beforeEach(async ({ page }) => {
    await openDeliverRoute(page, ELEMENT, DEMO_ID);
    await waitForVennReady(page);
  });

  test('1. Delivery renders diagram, tiles and tray', async ({ page }) => {
    await expect(page).toHaveURL(/\/deliver/);
    const root = vennRoot(page);
    await expect(root).toBeVisible();
    await expect(root.locator('svg').first()).toBeVisible();
    // 2-set layout => 4 semantic regions (0, 1, 0,1 and outside).
    await expect(root.locator('[data-region-key]:not([data-region-key="tray"])')).toHaveCount(4);
    await expect(root.locator('[data-region-key="tray"]')).toBeVisible();
    // The default demo already has two tiles pre-placed.
    const placedBefore = await root.locator('.placed-tiles [data-tile-id]').count();
    expect(placedBefore).toBeGreaterThan(0);
  });

  test('2. Author/source/deliver round-trip keeps the element mounted', async ({ page }) => {
    await switchTab(page, 'author');
    await expect(page).toHaveURL(/\/author/);
    await expect(page.locator('.author-view').first()).toBeVisible();

    await switchTab(page, 'source');
    const sourceModel = await getModelFromSource(page);
    expect(sourceModel?.element).toBe(ELEMENT);

    await switchTab(page, 'deliver');
    await waitForVennReady(page);
    await expect(vennRoot(page)).toBeVisible();
  });

  test('3. Pointer drop moves an unplaced tile into a region and updates session', async ({
    page,
  }) => {
    await switchMode(page, 'gather');
    await waitForVennReady(page);

    const before = await getSessionState(page);
    // 'frog' starts in the tray (placements.frog === null in the demo).
    await dropTileIntoRegion(page, 'frog', '1');
    const after = await waitForSessionMutation(page, before);
    expect(after).toBeTruthy();
    expect(Array.isArray(after?.placements?.frog)).toBeTruthy();
    expect(after.placements.frog).toEqual([1]);

    // Tile should no longer live in the tray.
    await expect(
      page.locator('.venn-root [data-region-key="tray"] [data-tile-id="frog"]')
    ).toHaveCount(0);
  });

  test('4. Keyboard picks up a tile, navigates, and commits placement', async ({ page }) => {
    await switchMode(page, 'gather');
    await waitForVennReady(page);

    const before = await getSessionState(page);

    const tile = page
      .locator('.venn-root [data-region-key="tray"] [data-tile-id="chicken"]')
      .first();
    await tile.focus();
    await page.keyboard.press('Space');
    // The first navigable target is '0'; advancing once lands on '0,1',
    // advancing twice lands on '1'. Commit there.
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');

    const after = await waitForSessionMutation(page, before);
    expect(Array.isArray(after?.placements?.chicken)).toBeTruthy();
    // Chicken's correctRegion is [1], and we navigated two steps to reach it.
    expect(after.placements.chicken).toEqual([1]);
  });

  test('5. Pointer drag renders a floating ghost and a shape-matching region highlight', async ({
    page,
  }) => {
    await switchMode(page, 'gather');
    await waitForVennReady(page);

    // Park the pointer mid-drag: dispatch pointerdown + a few moves into the
    // "Reptile and Egg-layer" overlap region, but NO pointerup yet. Assert
    // the DOM shows (a) the drag ghost preview and (b) the shape-masked
    // overlap highlight — the two UX changes that align with categorize.
    const tile = page.locator('.venn-root [data-region-key="tray"] [data-tile-id="frog"]').first();
    const target = page.locator('.venn-root [data-region-key="0,1"]').first();
    const tileBox = await tile.boundingBox();
    const targetBox = await target.boundingBox();
    if (!tileBox || !targetBox) throw new Error('missing bounding box');
    const sx = tileBox.x + tileBox.width / 2;
    const sy = tileBox.y + tileBox.height / 2;
    const tx = targetBox.x + targetBox.width / 2;
    const ty = targetBox.y + targetBox.height / 2;

    await page.evaluate(
      ({ tileId, sx, sy, tx, ty }) => {
        const tile = document.querySelector(
          `.venn-root [data-tile-id="${tileId}"]`
        ) as HTMLElement | null;
        if (!tile) throw new Error(`tile not found: ${tileId}`);
        const mk = (type: string, x: number, y: number) =>
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
            buttons: 1,
            clientX: x,
            clientY: y,
          });
        tile.dispatchEvent(mk('pointerdown', sx, sy));
        const steps = 6;
        for (let i = 1; i <= steps; i++) {
          const ix = sx + ((tx - sx) * i) / steps;
          const iy = sy + ((ty - sy) * i) / steps;
          window.dispatchEvent(mk('pointermove', ix, iy));
        }
      },
      { tileId: 'frog', sx, sy, tx, ty }
    );

    // (a) The drag ghost follows the cursor. It is a position: fixed sibling
    // of the tray / diagram and must render at the last pointer location.
    const ghost = page.locator('.venn-root .drag-ghost [data-tile-id="frog"]');
    await expect(ghost).toBeVisible();

    // (b) The overlap highlight uses a clip-path / mask URL — NOT a plain
    // rect. Look for an element inside the diagram SVG whose fill is driven
    // by our highlight colour and that targets the overlap via clip-path.
    const overlapHighlight = page.locator(
      '.venn-root .venn-diagram svg circle[clip-path="url(#venn-clip-left)"]'
    );
    await expect(overlapHighlight).toHaveCount(1);

    // Release the pointer so the drag commits (cleanup).
    await page.evaluate(
      ({ tx, ty }) => {
        const mk = (type: string, x: number, y: number) =>
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 1,
            pointerType: 'mouse',
            isPrimary: true,
            button: 0,
            buttons: 0,
            clientX: x,
            clientY: y,
          });
        window.dispatchEvent(mk('pointerup', tx, ty));
      },
      { tx, ty }
    );
    await expect(page.locator('.venn-root .drag-ghost')).toHaveCount(0);
  });

  test('6. Evaluate mode surfaces at least one correctness badge', async ({ page }) => {
    // The demo ships with a known-wrong placement (crocodile -> [1], dolphin -> [0,1]).
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    await waitForVennReady(page);

    const incorrectTiles = page.locator(
      '.venn-root .placed-tiles [data-tile-id].venn-tile.incorrect, .venn-root .placed-tiles .venn-tile.incorrect'
    );
    // At minimum we expect an incorrect badge on one of the pre-seeded wrong placements.
    await expect(incorrectTiles.first()).toBeVisible({ timeout: 10_000 });

    // The "Show correct answer" toggle should be offered when there are incorrect tiles.
    const toggle = page.locator('.venn-root .toggle-correct');
    await expect(toggle).toBeVisible();
  });
});
