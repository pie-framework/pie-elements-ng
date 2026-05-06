/**
 * Controllable HTMLAudioElement mock for Playwright tests.
 *
 * Usage:
 *   import { installAudioMock, triggerAudioEvent } from './audio-mock';
 *
 *   test('...', async ({ page }) => {
 *     await installAudioMock(page);
 *     await page.goto('/...');
 *     await triggerAudioEvent(page, 'play');
 *     await triggerAudioEvent(page, 'ended');
 *   });
 *
 * The mock intercepts `new Audio()` and overrides `document.createElement('audio')`
 * so that play/pause/load are no-ops. The `trigger()` control API fires synthetic
 * events on every audio target in the page — both MockAudio instances and DOM
 * <audio> elements — so behavioral assertions on both PIE and Learnosity sides
 * are symmetric and deterministic (no network audio, no Chromium audio stack).
 *
 * To restore real audio: remove the installAudioMock() call. No other changes needed.
 */

import type { Page } from '@playwright/test';

/**
 * Install the audio mock via addInitScript. Must be called before page.goto().
 */
export async function installAudioMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // MockAudio instances created via new Audio() / new HTMLAudioElement()
    const mockInstances: EventTarget[] = [];

    class MockAudio extends EventTarget {
      src: string = '';
      currentTime: number = 0;
      duration: number = 0;
      paused: boolean = true;
      ended: boolean = false;
      volume: number = 1;
      muted: boolean = false;
      autoplay: boolean = false;
      loop: boolean = false;
      readyState: number = 4; // HAVE_ENOUGH_DATA

      constructor(src?: string) {
        super();
        if (src) this.src = src;
        mockInstances.push(this);
      }

      play(): Promise<void> {
        this.paused = false;
        this.ended = false;
        this.dispatchEvent(new Event('play'));
        this.dispatchEvent(new Event('playing'));
        return Promise.resolve();
      }

      pause(): void {
        this.paused = true;
        this.dispatchEvent(new Event('pause'));
      }

      load(): void {
        this.dispatchEvent(new Event('loadedmetadata'));
      }
    }

    // Override document.createElement so that DOM-created <audio> elements
    // (e.g. from Svelte templates) also get no-op play/pause methods.
    const _createElement = document.createElement.bind(document);
    (document as any).createElement = function (tag: string, opts?: ElementCreationOptions) {
      const el = _createElement(tag, opts);
      if (tag.toLowerCase() === 'audio') {
        (el as any).play = () => {
          (el as any).paused = false;
          (el as any).ended = false;
          el.dispatchEvent(new Event('play'));
          el.dispatchEvent(new Event('playing'));
          return Promise.resolve();
        };
        (el as any).pause = () => {
          (el as any).paused = true;
          el.dispatchEvent(new Event('pause'));
        };
      }
      return el;
    };

    // Control API: dispatch synthetic events on every audio target in the page.
    // Covers both MockAudio instances and DOM <audio> elements so both PIE and
    // Learnosity sides respond identically.
    (window as any).__audioMock = {
      trigger(eventType: string) {
        // Collect targets: MockAudio instances + all DOM <audio> elements
        const domAudioEls = Array.from(document.querySelectorAll('audio'));
        const allTargets: EventTarget[] = [...mockInstances, ...domAudioEls];

        for (const target of allTargets) {
          if (eventType === 'ended') {
            (target as any).ended = true;
            (target as any).paused = true;
          }
          if (eventType === 'play') {
            (target as any).paused = false;
            // Fire 'playing' in addition to 'play' so components listening for
            // HTMLMediaElement 'playing' (fires when playback actually starts)
            // are notified, not just 'play' (fires when play() is called).
            target.dispatchEvent(new Event('playing'));
          }
          if (eventType === 'pause') {
            (target as any).paused = true;
          }
          target.dispatchEvent(new Event(eventType));
        }
      },
      instanceCount() {
        const domCount = document.querySelectorAll('audio').length;
        return mockInstances.length + domCount;
      },
    };

    (window as any).HTMLAudioElement = MockAudio;
    (window as any).Audio = MockAudio;
  });
}

/**
 * Trigger an audio lifecycle event on all mock instances in the page.
 */
export async function triggerAudioEvent(
  page: Page,
  eventType: 'play' | 'pause' | 'ended' | 'timeupdate'
): Promise<void> {
  await page.evaluate((type) => {
    const mock = (window as any).__audioMock;
    if (!mock) throw new Error('Audio mock not installed. Call installAudioMock() before goto().');
    mock.trigger(type);
  }, eventType);
}

/**
 * Return the number of audio targets (MockAudio instances + DOM <audio> elements).
 */
export async function audioInstanceCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const mock = (window as any).__audioMock;
    if (!mock) return 0;
    return mock.instanceCount();
  });
}
