import { expect, test, type Locator, type Page } from '@playwright/test';
import { getSessionState, openDeliverRoute, switchTab } from './test-helpers';

const ELEMENT = 'video-stimulus';
const DEMO_ID = 'accessible-lab-safety';
const LABEL = 'Lab safety demonstration';
const DESCRIPTION = 'Watch how the student prepares to handle a heated container safely.';
const TRANSCRIPT =
  'Step one. Put on safety goggles before handling laboratory materials. Step two. Use heat-resistant gloves when touching a heated container. Step three. Place the container on a heat-safe surface, away from paper.';

function player(page: Page): Locator {
  return page.locator('pie-element-player[view="delivery"]').first();
}

function video(page: Page): Locator {
  return player(page).locator('video').first();
}

async function openVideoStimulus(page: Page) {
  await openDeliverRoute(page, ELEMENT, DEMO_ID);
  await expect(player(page)).toHaveAttribute('package-name', '@pie-element/video-stimulus');
  await expect(video(page)).toBeAttached({ timeout: 20_000 });
}

test.describe('Video Stimulus (Svelte 5)', () => {
  test.beforeEach(async ({ page }) => {
    await openVideoStimulus(page);
  });

  test('loads the versioned element with one discoverable light-DOM native video', async ({
    page,
  }) => {
    const elementPlayer = player(page);
    await expect(elementPlayer).toHaveAttribute('element-name', ELEMENT);
    await expect(elementPlayer).toHaveAttribute('element-version', 'latest');
    await expect(elementPlayer.locator('video')).toHaveCount(1);

    const discovery = await video(page).evaluate((node) => ({
      tagName: node.tagName,
      rootedInDocument: node.getRootNode() === document,
      containedByPlayer: document.querySelector('pie-element-player')?.contains(node) ?? false,
    }));

    expect(discovery).toEqual({
      tagName: 'VIDEO',
      rootedInDocument: true,
      containedByPlayer: true,
    });
  });

  test('propagates source, poster, captions, language, label, description, and transcript', async ({
    page,
  }) => {
    const nativeVideo = video(page);
    await expect(nativeVideo).toHaveAttribute('poster', '/video-stimulus/poster.svg');
    await expect(nativeVideo.locator('source')).toHaveCount(1);
    await expect(nativeVideo.locator('source')).toHaveAttribute(
      'src',
      '/video-stimulus/sample.webm'
    );
    await expect(nativeVideo.locator('source')).toHaveAttribute('type', 'video/webm');

    const captions = nativeVideo.locator('track[kind="captions"]');
    await expect(captions).toHaveCount(1);
    await expect(captions).toHaveAttribute('src', '/video-stimulus/captions-en.vtt');
    await expect(captions).toHaveAttribute('srclang', 'en');
    await expect(captions).toHaveAttribute('label', 'English');
    await expect(captions).toHaveAttribute('default', '');

    await expect(page.getByText(LABEL, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(DESCRIPTION, { exact: true }).first()).toBeVisible();
    await expect(player(page).locator('[lang="en"]').first()).toBeAttached();

    const transcriptToggle = player(page)
      .getByRole('button', { name: /transcript/i })
      .first();
    await expect(transcriptToggle).toBeVisible();
    if ((await transcriptToggle.getAttribute('aria-expanded')) !== 'true') {
      await transcriptToggle.click();
    }
    await expect(player(page).getByText(TRANSCRIPT, { exact: true })).toBeVisible();
  });

  test('propagates the authored media and resolved accessibility profile into authoring', async ({
    page,
  }) => {
    await switchTab(page, 'author');
    await expect(page).toHaveURL(/\/author/);
    await expect(page.locator('.author-view')).toBeVisible();

    const controls = page.locator('.author-view input, .author-view textarea, .author-view select');
    await expect.poll(async () => controls.count()).toBeGreaterThan(0);

    const values = await controls.evaluateAll((nodes) =>
      nodes.map(
        (node) => (node as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value
      )
    );

    for (const expectedValue of [
      'lab-safety-demonstration',
      LABEL,
      DESCRIPTION,
      '/video-stimulus/sample.webm',
      '/video-stimulus/poster.svg',
      '/video-stimulus/captions-en.vtt',
      TRANSCRIPT,
      'meaningful',
      'track',
      'described',
    ]) {
      expect(values).toContain(expectedValue);
    }
  });

  test('does not create or mutate a leaf session for media and transcript activity', async ({
    page,
  }) => {
    expect(await getSessionState(page)).toEqual({});

    await player(page).evaluate((element) => {
      const state = window as Window & {
        __videoStimulusSessionEvents?: number;
      };
      state.__videoStimulusSessionEvents = 0;
      element.addEventListener('session-changed', () => {
        state.__videoStimulusSessionEvents = (state.__videoStimulusSessionEvents ?? 0) + 1;
      });
    });

    await video(page).evaluate((node) => {
      for (const eventName of ['play', 'timeupdate', 'seeking', 'pause', 'ended']) {
        node.dispatchEvent(new Event(eventName, { bubbles: true, composed: true }));
      }
    });

    const transcriptToggle = player(page)
      .getByRole('button', { name: /transcript/i })
      .first();
    if (await transcriptToggle.isVisible().catch(() => false)) {
      await transcriptToggle.click();
    }

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __videoStimulusSessionEvents?: number })
              .__videoStimulusSessionEvents ?? 0
        )
      )
      .toBe(0);
    expect(await getSessionState(page)).toEqual({});
  });
});
