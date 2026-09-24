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

function transcriptToggle(page: Page): Locator {
  return player(page)
    .getByRole('button', { name: /transcript/i })
    .first();
}

const HAVE_METADATA = 1;

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

test.describe('Video Stimulus (Svelte 5) media failures', () => {
  test('reports a failing source and restores the video on retry', async ({ page }) => {
    let failSource = true;
    await page.route('**/video-stimulus/sample.webm', (route) =>
      failSource ? route.fulfill({ status: 404, body: '' }) : route.continue()
    );
    await openVideoStimulus(page);

    const status = player(page).getByRole('alert');
    await expect(status).toContainText('Video unavailable');
    await expect(page.getByText(LABEL, { exact: true }).first()).toBeVisible();
    await expect(transcriptToggle(page)).toBeVisible();

    const retry = status.getByRole('button', { name: 'Try again' });
    const target = await retry.boundingBox();
    expect(target?.width).toBeGreaterThanOrEqual(44);
    expect(target?.height).toBeGreaterThanOrEqual(44);

    failSource = false;
    await retry.focus();
    await retry.press('Enter');
    await expect(status).toHaveCount(0);
    await expect(video(page)).toBeFocused();
  });

  test('reports a failing caption track while the video stays playable', async ({ page }) => {
    await page.route('**/video-stimulus/captions-en.vtt', (route) =>
      route.fulfill({ status: 404, body: '' })
    );
    await openVideoStimulus(page);

    const status = player(page).getByRole('alert');
    await expect(status).toContainText('Text track unavailable');
    await expect(status).toContainText('English');
    await expect
      .poll(() => video(page).evaluate((node) => (node as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(HAVE_METADATA);
    await expect(video(page)).toHaveJSProperty('error', null);
  });
});

test.describe('Video Stimulus (Svelte 5) keyboard and layout', () => {
  test('operates by keyboard without stealing focus or adding global shortcuts', async ({
    page,
  }) => {
    await openVideoStimulus(page);
    const nativeVideo = video(page);
    const within = await player(page).evaluate((host) => host.contains(document.activeElement));
    expect(within).toBe(false);

    await page.keyboard.press('k');
    await page.keyboard.press('Space');
    await expect(nativeVideo).toHaveJSProperty('paused', true);

    const toggle = transcriptToggle(page);
    await toggle.focus();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toBeFocused();
    const regionId = await toggle.getAttribute('aria-controls');
    const region = player(page).locator(`[id="${regionId}"]`);
    await expect(region).toBeVisible();
    await expect(region).not.toHaveAttribute('aria-live', /.+/);

    await page.keyboard.press('Tab');
    await expect(nativeVideo).toBeFocused();
    await page.keyboard.press('Space');
    await expect(nativeVideo).toHaveJSProperty('paused', false);
    await page.keyboard.press('Space');
    await expect(nativeVideo).toHaveJSProperty('paused', true);

    await page.keyboard.press('Shift+Tab');
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
  });

  test('reflows to one column at 320 CSS px without horizontal scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await openVideoStimulus(page);
    await transcriptToggle(page).click();

    const layout = await player(page)
      .locator('.video-stimulus')
      .evaluate((root) => {
        const bounds = root.getBoundingClientRect();
        const overflowing = Array.from(root.querySelectorAll<HTMLElement>('*'))
          .filter((node) => !node.closest('.visually-hidden'))
          .filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1);
          })
          .map((node) => `${node.tagName.toLowerCase()}.${node.className}`);
        const region = root.querySelector<HTMLElement>('.media-transcript__region');
        const media = root.querySelector('video');
        const transcript = root.querySelector('.media-transcript');
        const frame = root.querySelector('.video-frame');
        return {
          width: bounds.width,
          scrollWidth: root.scrollWidth,
          clientWidth: root.clientWidth,
          overflowing,
          transcriptScrolls: region ? region.scrollWidth > region.clientWidth : true,
          videoFits: media ? media.getBoundingClientRect().width <= bounds.width : false,
          stacked:
            transcript !== null &&
            frame !== null &&
            transcript.getBoundingClientRect().bottom <= frame.getBoundingClientRect().top,
        };
      });

    expect(layout.width).toBeLessThanOrEqual(320);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
    expect(layout.overflowing).toEqual([]);
    expect(layout.transcriptScrolls).toBe(false);
    expect(layout.videoFits).toBe(true);
    expect(layout.stacked).toBe(true);
  });
});

test.describe('Video Stimulus (Svelte 5) IIFE bundle', () => {
  test('renders the same light-DOM video from the IIFE bundle', async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto(`/${ELEMENT}/deliver?mode=gather&role=student&demo=${DEMO_ID}&player=iife`);
    const iifeElement = page.locator(`pie-iife-${ELEMENT}`);
    await expect(iifeElement.locator('video')).toHaveCount(1, { timeout: 60_000 });

    const nativeVideo = iifeElement.locator('video');
    await expect(nativeVideo.locator('source')).toHaveAttribute(
      'src',
      '/video-stimulus/sample.webm'
    );
    await expect(nativeVideo.locator('track[kind="captions"]')).toHaveAttribute('srclang', 'en');
    await expect(iifeElement.getByText(LABEL, { exact: true })).toBeVisible();
    await expect(iifeElement.getByRole('button', { name: /transcript/i })).toBeVisible();
    expect(await nativeVideo.evaluate((node) => node.getRootNode() === document)).toBe(true);
    await expect
      .poll(() => nativeVideo.evaluate((node) => (node as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(HAVE_METADATA);
    await expect(page.locator('pie-element-player .error')).toHaveCount(0);
  });
});
