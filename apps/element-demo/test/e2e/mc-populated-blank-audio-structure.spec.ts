/**
 * Structural contract tests for mc-populated-blank audio rendering.
 *
 * These tests are a REFACTORING HARNESS for the AudioPlayer.svelte extraction
 * (candidate #1 in the architecture review). They pin the DOM contracts that
 * the extracted component must preserve:
 *
 *   Feature button audio:  .pie-audio-container present, listen button visible,
 *                          no native <audio controls>
 *   Native controls audio: .pie-audio-container present, <audio controls> visible,
 *                          no listen button
 *   No audio:              .pie-audio-container absent
 *   Missing resource:      .pie-audio-container present, error message visible,
 *                          no button, no native controls
 *   Transcript sr-only:    transcript element present but not visible
 *   Transcript visible:    transcript element visible
 *
 * Demos used:
 *   variant-sel-r1-plusggg  — audio_blank_only, feature button, transcript sr-only
 *   variant-sel-vic         — inline_sentence, feature button, transcript visible
 *   variant-sr-vic          — inline_sentence, no audio
 */

import { expect, test } from '@playwright/test';
import { deliveryContainer, waitForMathRendering } from './test-helpers';

async function openRoute(page: Parameters<typeof test>[0]['page'], demoId: string) {
  await page.goto(
    `/mc-populated-blank/deliver?mode=gather&role=student&demo=${encodeURIComponent(demoId)}&player=esm`
  );
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"]', { timeout: 20_000 });
  await waitForMathRendering(page);
}

async function patchModel(
  page: Parameters<typeof test>[0]['page'],
  patch: Record<string, unknown>
) {
  await page.evaluate((p) => {
    const player = document.querySelector('pie-element-player') as any;
    if (!player?.model) return;
    player.model = { ...player.model, ...p };
  }, patch);
  await page.waitForTimeout(150);
}

// ===========================================================================
// FEATURE BUTTON AUDIO (audio_blank_only layout — variant-sel-r1-plusggg)
// ===========================================================================

// ---------------------------------------------------------------------------
// F1. Audio container is present when model.hasAudio is true
//     If AudioPlayer.svelte is extracted, it must still render .pie-audio-container.
// ---------------------------------------------------------------------------
test('audio/feature-button: audio container is present', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  const root = deliveryContainer(page);
  await expect(root.locator('.pie-audio-container')).toBeAttached();
});

// ---------------------------------------------------------------------------
// F2. Listen button is visible for feature button audio
//     The .listen-button must exist and be visible — it is the primary
//     interactive control for audio_blank_only, token_sequence, and
//     stimulus_image_blank layouts.
// ---------------------------------------------------------------------------
test('audio/feature-button: listen button is visible', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  const root = deliveryContainer(page);
  await expect(root.locator('.listen-button')).toBeVisible();
});

// ---------------------------------------------------------------------------
// F3. No native <audio controls> when useFeatureButtonAudio is true
//     The feature button and native controls are mutually exclusive.
//     An extraction must not accidentally render both.
// ---------------------------------------------------------------------------
test('audio/feature-button: no native audio controls element', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  const root = deliveryContainer(page);
  await expect(root.locator('audio[controls]')).not.toBeAttached();
});

// ---------------------------------------------------------------------------
// F4. Feature button renders for token_sequence layout (variant-sel-r1-g-stem)
//     Confirms that useFeatureButtonAudio=true applies to token_sequence,
//     not just audio_blank_only.
// ---------------------------------------------------------------------------
test('audio/feature-button: listen button present for token_sequence layout', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-g-stem');
  const root = deliveryContainer(page);
  await expect(root.locator('.listen-button')).toBeVisible();
  await expect(root.locator('audio[controls]')).not.toBeAttached();
});

// ---------------------------------------------------------------------------
// F5. Feature button renders for stimulus_image_blank layout (variant-sel-r1-s3)
//     Confirms that useFeatureButtonAudio=true applies to stimulus_image_blank.
// ---------------------------------------------------------------------------
test('audio/feature-button: listen button present for stimulus_image_blank layout', async ({
  page,
}) => {
  await openRoute(page, 'variant-sel-r1-s3');
  const root = deliveryContainer(page);
  await expect(root.locator('.listen-button')).toBeVisible();
  await expect(root.locator('audio[controls]')).not.toBeAttached();
});

// ===========================================================================
// NATIVE CONTROLS AUDIO
// Achieved by patching useFeatureButtonAudio=false on a model that has audio.
// ===========================================================================

// ---------------------------------------------------------------------------
// N1. Native <audio controls> is visible when useFeatureButtonAudio is false
//     This is the fallback rendering path. An extraction must preserve it.
// ---------------------------------------------------------------------------
test('audio/native-controls: audio element with controls is visible', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  await patchModel(page, { useFeatureButtonAudio: false });
  const root = deliveryContainer(page);
  await expect(root.locator('audio[controls]')).toBeAttached();
});

// ---------------------------------------------------------------------------
// N2. No listen button when useFeatureButtonAudio is false
//     Feature button and native controls are mutually exclusive.
// ---------------------------------------------------------------------------
test('audio/native-controls: no listen button when native controls active', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  await patchModel(page, { useFeatureButtonAudio: false });
  const root = deliveryContainer(page);
  await expect(root.locator('.listen-button')).not.toBeAttached();
});

// ===========================================================================
// NO AUDIO (variant-sr-vic — hasAudio: false)
// ===========================================================================

// ---------------------------------------------------------------------------
// A1. Audio container is absent when model.hasAudio is false
//     The container must not be rendered at all — not hidden, absent.
// ---------------------------------------------------------------------------
test('audio/none: audio container is absent when hasAudio is false', async ({ page }) => {
  await openRoute(page, 'variant-sr-vic');
  const root = deliveryContainer(page);
  await expect(root.locator('.pie-audio-container')).not.toBeAttached();
});

// ===========================================================================
// MISSING RESOURCE (hasAudio: true, audioUrl: '')
// Achieved by patching audioUrl to empty string.
// ===========================================================================

// ---------------------------------------------------------------------------
// M1. Error message is visible when hasAudio is true but audioUrl is missing
//     The component must render a fallback error, not a broken button.
// ---------------------------------------------------------------------------
test('audio/missing-resource: error message is visible', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  await patchModel(page, { audioUrl: '' });
  const root = deliveryContainer(page);
  await expect(root.locator('.pie-audio-container')).toBeAttached();
  await expect(root.locator('.pie-audio-error')).toBeVisible();
});

// ---------------------------------------------------------------------------
// M2. No listen button or native audio when resource is missing
//     Neither interactive audio control should appear with a missing URL.
// ---------------------------------------------------------------------------
test('audio/missing-resource: no audio controls when audioUrl is missing', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  await patchModel(page, { audioUrl: '' });
  const root = deliveryContainer(page);
  await expect(root.locator('.listen-button')).not.toBeAttached();
  await expect(root.locator('audio')).not.toBeAttached();
});

// ===========================================================================
// TRANSCRIPT
// ===========================================================================

// ---------------------------------------------------------------------------
// T1. Transcript is sr-only (not visually visible) when showVisibleTranscript is false
//     All r1-family variants have showVisibleTranscript: false. The transcript
//     element must exist (for screen readers) but must not be visible.
// ---------------------------------------------------------------------------
test('audio/transcript: sr-only when showVisibleTranscript is false', async ({ page }) => {
  await openRoute(page, 'variant-sel-r1-plusggg');
  const root = deliveryContainer(page);

  const transcript = root.locator('.pie-audio-transcript');
  await expect(transcript).toBeAttached();
  // sr-only is implemented via a CSS class, not display:none — Playwright's
  // toBeVisible does not detect clip-based hiding, so we assert the class directly.
  await expect(transcript).toHaveClass(/sr-only/);
});

// ---------------------------------------------------------------------------
// T2. Transcript is visually visible when showVisibleTranscript is true
//     sel-vic has showVisibleTranscript: true. Already covered by sel-vic parity
//     but included here as a complete contract alongside T1.
// ---------------------------------------------------------------------------
test('audio/transcript: visible when showVisibleTranscript is true', async ({ page }) => {
  await openRoute(page, 'variant-sel-vic');
  const root = deliveryContainer(page);
  await expect(root.locator('.pie-audio-transcript')).toBeVisible();
});
