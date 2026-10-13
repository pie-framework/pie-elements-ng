import { test, expect, type Page } from '@playwright/test';
import {
  getSessionState,
  mountedElement,
  mountedElementSelector,
  openDeliverRoute,
  switchTab,
  updateModelInSource,
} from './test-helpers';

/**
 * Keyboard placement in match-list at 320 CSS px (400% zoom on a 1280 px screen), where the
 * interactive region scrolls horizontally and the response areas start outside its visible part.
 */

// Two answers, three prompts, duplicates allowed and the choice order locked.
const MODEL = {
  id: '1',
  element: 'match-list',
  duplicates: true,
  lockChoiceOrder: true,
  prompt: '<p>Match each prompt with an answer.</p>',
  answers: [
    { id: 0, title: 'Answer A' },
    { id: 1, title: 'Answer B' },
  ],
  prompts: [
    { id: 0, title: 'Prompt one', relatedAnswer: 1 },
    { id: 1, title: 'Prompt two', relatedAnswer: 0 },
    { id: 2, title: 'Prompt three', relatedAnswer: 1 },
  ],
};

const VIEWPORTS = [
  { width: 320, height: 256 },
  { width: 320, height: 800 },
];

const responseAreas = (page: Page) => mountedElement(page).locator('[aria-labelledby]');
const liveRegion = (page: Page) => page.locator('[id^="DndLiveRegion-"]');

/** Applies MODEL at the default viewport, where the Source tab is operable, then resizes. */
async function openMatchList(page: Page, viewport: { width: number; height: number }) {
  await openDeliverRoute(page, 'match-list');
  await switchTab(page, 'source');
  await updateModelInSource(page, MODEL);
  await switchTab(page, 'deliver');
  await expect(responseAreas(page)).toHaveCount(MODEL.prompts.length);
  // dnd-kit cancels a keyboard drag on a window resize, so the resize event has to pass first.
  await page.evaluate(() => {
    (window as any).__resized = new Promise<void>((resolve) =>
      window.addEventListener('resize', () => resolve(), { once: true })
    );
  });
  await page.setViewportSize(viewport);
  await page.evaluate(() => (window as any).__resized);
}

/**
 * Presses `key` until a choice in the pool has focus and returns its text. Navigation leaves focus
 * at the top of the document, so Shift+Tab wraps around and enters the page from its end.
 */
async function focusPoolChoice(page: Page, key: 'Tab' | 'Shift+Tab'): Promise<string> {
  for (let presses = 0; presses < 40; presses += 1) {
    await page.keyboard.press(key);
    const text = await page.evaluate((selector) => {
      const focused = document.activeElement;
      const inPool =
        focused?.matches('[data-tile-id*=":choice-"]') &&
        document.querySelector(selector)?.contains(focused);
      return inPool ? (focused?.textContent?.trim() ?? '') : null;
    }, mountedElementSelector());
    if (text !== null) {
      return text;
    }
  }
  throw new Error(`${key} never reached a choice in the pool`);
}

/**
 * Picks up the focused choice with Space, moves it with Tab and drops it with Space. Each key waits
 * for dnd-kit's announcement of the one before, so it reaches an active, settled drag.
 */
async function placeWithSpaceTabSpace(page: Page) {
  await page.keyboard.press('Space');
  await expect(liveRegion(page)).toContainText('over droppable area choices-pool');
  await page.keyboard.press('Tab');
  await expect(liveRegion(page)).not.toContainText('choices-pool');
  await page.keyboard.press('Space');
}

async function expectPlacedInFirstArea(page: Page, choice: string, answerId: number) {
  await expect.poll(async () => (await getSessionState(page))?.value).toEqual({ 0: answerId });
  await expect(responseAreas(page).first()).toHaveText(choice);
  await expect(liveRegion(page)).toContainText('dropped over droppable area');
  await expect(mountedElement(page).locator('[data-tile-id$=":target-prompt-0"]')).toBeFocused();
}

test.describe('match-list keyboard placement at 320 CSS px', () => {
  for (const viewport of VIEWPORTS) {
    const size = `${viewport.width}x${viewport.height}`;

    test(`${size}: Tab to a choice, Space, Tab, Space places it in the first response area`, async ({
      page,
    }) => {
      await openMatchList(page, viewport);
      expect(await focusPoolChoice(page, 'Tab')).toBe('Answer A');
      await placeWithSpaceTabSpace(page);
      await expectPlacedInFirstArea(page, 'Answer A', 0);
    });

    test(`${size}: Shift+Tab from the page end to a choice, Space, Tab, Space places it in the first response area`, async ({
      page,
    }) => {
      await openMatchList(page, viewport);
      expect(await focusPoolChoice(page, 'Shift+Tab')).toBe('Answer B');
      await placeWithSpaceTabSpace(page);
      await expectPlacedInFirstArea(page, 'Answer B', 1);
    });

    test(`${size}: empty response areas are not Tab stops before a selection`, async ({ page }) => {
      await openMatchList(page, viewport);
      for (const area of await responseAreas(page).all()) {
        await expect(area).toHaveAttribute('tabindex', '-1');
      }
    });
  }
});
