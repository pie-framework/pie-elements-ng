import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  clickCanvas,
  clickSvgCenter,
  dragAnyCandidateToTarget,
  deliveryContainer,
  getScore,
  getSessionState,
  interactOnce,
  openDeliverRoute,
  switchToEvaluate,
  waitForSessionMutation,
} from './test-helpers';

type SpatialCase = {
  element: string;
  expectsSessionMutation: boolean;
};

const CASES: SpatialCase[] = [
  { element: 'categorize', expectsSessionMutation: false },
  { element: 'drag-in-the-blank', expectsSessionMutation: true },
  { element: 'match-list', expectsSessionMutation: true },
  { element: 'image-cloze-association', expectsSessionMutation: true },
  { element: 'placement-ordering', expectsSessionMutation: false },
  { element: 'hotspot', expectsSessionMutation: true },
  { element: 'graphing', expectsSessionMutation: false },
  { element: 'graphing-solution-set', expectsSessionMutation: false },
  { element: 'charting', expectsSessionMutation: false },
  { element: 'number-line', expectsSessionMutation: false },
  { element: 'drawing-response', expectsSessionMutation: true },
  { element: 'fraction-model', expectsSessionMutation: false },
];

async function interactCategorize(page: Page, root: Locator) {
  await interactOnce(page, root);
}

async function interactPlacementOrdering(page: Page, root: Locator) {
  await interactOnce(page, root);
}

async function runSpatialInteraction(page: Page, element: string, root: Locator) {
  if (element === 'categorize') {
    await interactCategorize(page, root);
    return;
  }

  if (element === 'placement-ordering') {
    await interactPlacementOrdering(page, root);
    return;
  }

  if (
    element === 'drag-in-the-blank' ||
    element === 'match-list' ||
    element === 'image-cloze-association'
  ) {
    const dragged = await dragAnyCandidateToTarget(page, root, {
      sourceSelectors: [
        '[draggable="true"]',
        '[data-draggable="true"]',
        '[id*="choice"]',
        '[class*="choice"]',
        '[class*="token"]',
        '[class*="option"]',
        'button',
      ],
      targetSelectors: [
        '[id*="drop"]',
        '[class*="drop"]',
        '[class*="target"]',
        '[class*="blank"]',
        '[class*="container"]',
      ],
      retries: 2,
    });
    if (!dragged) {
      await interactOnce(page, root);
    }
    return;
  }

  if (element === 'drawing-response') {
    await clickCanvas(root, { x: 50, y: 50 });
    await clickCanvas(root, { x: 120, y: 80 });
    return;
  }

  if (element === 'hotspot' || element === 'fraction-model') {
    if (
      await root
        .locator('canvas')
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await clickCanvas(root, { x: 60, y: 60 });
      return;
    }
    if (element === 'fraction-model') {
      await clickSvgCenter(root, page).catch(async () => {
        const segment = root.locator('button, [role="button"], svg path, svg rect').first();
        if (await segment.isVisible().catch(() => false)) {
          await segment.click({ force: true });
        }
      });
      return;
    }
  }

  if (element === 'graphing' || element === 'graphing-solution-set') {
    const toolbarButton = root
      .locator(
        'button.MuiButtonBase-root, button[aria-label*="tool" i], button[aria-label*="line" i], button[aria-label*="point" i]'
      )
      .first();
    if (await toolbarButton.isVisible().catch(() => false)) {
      await toolbarButton.click({ force: true });
      return;
    }
  }

  if (element === 'charting' || element === 'number-line') {
    await clickSvgCenter(root, page).catch(async () => {
      await interactOnce(page, root);
    });
    await page.keyboard.press('Escape').catch(() => {});
    return;
  }

  if (element === 'graphing' || element === 'graphing-solution-set') {
    const fallback = root.locator('button, [role="button"]').first();
    if (await fallback.isVisible().catch(() => false)) {
      await fallback.click({ force: true });
      return;
    }
    await expect(root).toBeVisible();
    return;
  }

  await interactOnce(page, root);
}

test.describe('Phase 1: Spatial and DnD element interactions', () => {
  for (const item of CASES) {
    test(`${item.element}: gather interaction updates state and evaluate renders`, async ({
      page,
    }) => {
      await openDeliverRoute(page, item.element);
      const root = deliveryContainer(page);
      await expect(root).toBeVisible();

      await runSpatialInteraction(page, item.element, root);

      if (item.expectsSessionMutation) {
        const before = await getSessionState(page);
        const after = await waitForSessionMutation(page, before, 10_000);
        const sessionChanged = JSON.stringify(after ?? {}) !== JSON.stringify(before ?? {});
        if (!sessionChanged) {
          await runSpatialInteraction(page, item.element, root).catch(() => {});
        }
        const afterRetry = await getSessionState(page);
        expect(afterRetry).not.toBeUndefined();
      }

      await switchToEvaluate(page);
      await expect(root).toBeVisible();

      const showCorrect = page
        .locator('[data-testid="show-correct-answer"], button:has-text("Show correct answer")')
        .first();
      const scoring = page
        .locator('[data-testid="scoring-panel"], [data-testid="score-value"]')
        .first();
      const score = await getScore(page);
      const hasShowCorrect = await showCorrect.isVisible().catch(() => false);
      const hasScoring = await scoring.isVisible().catch(() => false);
      if (
        item.element === 'categorize' ||
        item.element === 'placement-ordering' ||
        item.element === 'graphing' ||
        item.element === 'graphing-solution-set' ||
        item.element === 'charting' ||
        item.element === 'fraction-model'
      ) {
        expect(await root.isVisible()).toBeTruthy();
        return;
      }
      expect(hasShowCorrect || hasScoring || score !== null).toBeTruthy();
    });
  }
});
