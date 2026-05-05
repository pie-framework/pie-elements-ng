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
 * The mock replaces window.HTMLAudioElement before the page loads. Both the PIE
 * element and the Learnosity rendering use the fake, so behavioral assertions
 * on both sides are symmetric and deterministic (no network audio, no Chromium
 * audio stack).
 *
 * To restore real audio: remove the installAudioMock() call. No other changes needed.
 */

import type { Page } from '@playwright/test';

/**
 * Install the audio mock via addInitScript. Must be called before page.goto().
 */
export async function installAudioMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const instances: EventTarget[] = [];

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
        instances.push(this);
      }

      play(): Promise<void> {
        this.paused = false;
        this.ended = false;
        this._fire('play');
        return Promise.resolve();
      }

      pause(): void {
        this.paused = true;
        this._fire('pause');
      }

      load(): void {
        this._fire('loadedmetadata');
      }

      _fire(type: string, detail?: unknown): void {
        const event = new Event(type);
        this.dispatchEvent(event);
      }
    }

    // Expose control API on window for test code
    (window as any).__audioMock = {
      trigger(eventType: string) {
        for (const instance of instances) {
          const event = new Event(eventType);
          if (eventType === 'ended') {
            (instance as any).ended = true;
            (instance as any).paused = true;
          }
          if (eventType === 'play') {
            (instance as any).paused = false;
          }
          if (eventType === 'pause') {
            (instance as any).paused = true;
          }
          instance.dispatchEvent(event);
        }
      },
      instanceCount() {
        return instances.length;
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
 * Return the number of MockAudio instances created in the page.
 * Useful for asserting that both PIE and Learnosity created an audio element.
 */
export async function audioInstanceCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const mock = (window as any).__audioMock;
    if (!mock) return 0;
    return mock.instanceCount();
  });
}
