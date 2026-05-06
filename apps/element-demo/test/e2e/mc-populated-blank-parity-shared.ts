/**
 * Shared assertion helpers for mc-populated-blank live parity specs.
 *
 * Each exported function encodes a contract that must hold across ALL variants.
 * Variant-specific assertions (colours, locale alt text, transcript visibility,
 * stimulus geometry, etc.) stay inline in the per-variant spec files.
 *
 * Usage:
 *   import { assertChoicesGroupVisible, assertBlankSlotAria, assertAudioPlayCycle }
 *     from './mc-populated-blank-parity-shared';
 */

import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { triggerAudioEvent } from './audio-mock';

// ---------------------------------------------------------------------------
// Visual
// ---------------------------------------------------------------------------

/**
 * Both PIE and Learnosity sides render a radiogroup / group role for the choices.
 */
export async function assertChoicesGroupVisible(page: Page): Promise<void> {
  await expect(page.locator('#pie-container [role="radiogroup"]')).toBeVisible();
  await expect(
    page
      .locator('#learnosity-container [role="group"], #learnosity-container [role="radiogroup"]')
      .first()
  ).toBeVisible();
}

// ---------------------------------------------------------------------------
// ARIA
// ---------------------------------------------------------------------------

/**
 * Both sides expose an accessible label on their choices group
 * (via aria-labelledby or aria-label).
 */
export async function assertChoicesGroupAccessibleLabel(page: Page): Promise<void> {
  const pieGroup = page.locator('#pie-container [role="radiogroup"]');
  const pieLabelledBy = await pieGroup.getAttribute('aria-labelledby');
  const pieAriaLabel = await pieGroup.getAttribute('aria-label');
  expect(pieLabelledBy || pieAriaLabel).toBeTruthy();

  const lrnAriaLabel = await page
    .locator('#learnosity-container [role="group"], #learnosity-container [role="radiogroup"]')
    .first()
    .getAttribute('aria-label');
  expect(lrnAriaLabel).toBeTruthy();
}

/**
 * PIE blank slot carries aria-label="blank".
 */
export async function assertBlankSlotAriaLabel(page: Page): Promise<void> {
  const label = await page.locator('#pie-container .pie-blank-slot').getAttribute('aria-label');
  expect(label).toBe('blank');
}

/**
 * PIE blank slot carries role="status" and aria-live="polite".
 * Pass `expectAriaAtomic: true` for variants that also require aria-atomic="true".
 */
export async function assertBlankSlotAriaLive(
  page: Page,
  options: { expectAriaAtomic?: boolean } = {}
): Promise<void> {
  const blank = page.locator('#pie-container .pie-blank-slot');
  await expect(blank).toHaveAttribute('role', 'status');
  await expect(blank).toHaveAttribute('aria-live', 'polite');
  if (options.expectAriaAtomic) {
    await expect(blank).toHaveAttribute('aria-atomic', 'true');
  }
}

// ---------------------------------------------------------------------------
// Behavioral — audio lifecycle
// ---------------------------------------------------------------------------

/**
 * After a 'play' event the playing image acquires listen-active and the silent
 * image loses it; after 'ended' the silent image regains listen-active.
 *
 * Requires installAudioMock() to have been called before navigating to the page.
 */
export async function assertAudioPlayCycle(page: Page): Promise<void> {
  const silentImg = page.locator('#pie-container .pie-listen-icon').first();
  const playingImg = page.locator('#pie-container .pie-listen-icon').nth(1);

  await expect(silentImg).toHaveClass(/listen-active/);
  await expect(playingImg).not.toHaveClass(/listen-active/);

  await triggerAudioEvent(page, 'play');
  await page.waitForTimeout(100);

  await expect(playingImg).toHaveClass(/listen-active/);
  await expect(silentImg).not.toHaveClass(/listen-active/);

  await triggerAudioEvent(page, 'ended');
  await page.waitForTimeout(100);

  await expect(silentImg).toHaveClass(/listen-active/);
  await expect(playingImg).not.toHaveClass(/listen-active/);
}
