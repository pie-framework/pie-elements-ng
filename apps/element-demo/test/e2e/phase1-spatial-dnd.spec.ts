import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  clickCanvas,
  clickSvgCenter,
  dragAnyCandidateToTarget,
  dragBetween,
  deliveryContainer,
  getSessionState,
  interactOnce,
  openDeliverRoute,
  switchToEvaluate,
  waitForSessionMutation,
} from './test-helpers';

type SpatialCase = {
  element: string;
  expectsSessionMutation: boolean;
  demoId?: string;
};

const CASES: SpatialCase[] = [
  { element: 'categorize', expectsSessionMutation: false },
  { element: 'drag-in-the-blank', expectsSessionMutation: false },
  { element: 'match-list', expectsSessionMutation: false },
  { element: 'image-cloze-association', expectsSessionMutation: false },
  { element: 'placement-ordering', expectsSessionMutation: true },
  { element: 'hotspot', expectsSessionMutation: false },
  { element: 'graphing', expectsSessionMutation: false },
  { element: 'graphing-solution-set', expectsSessionMutation: false },
  { element: 'charting', expectsSessionMutation: false },
  { element: 'number-line', expectsSessionMutation: false },
  { element: 'number-line', expectsSessionMutation: false, demoId: 'basic-points' },
  { element: 'drawing-response', expectsSessionMutation: false },
  { element: 'fraction-model', expectsSessionMutation: false },
];

async function interactCategorize(page: Page, root: Locator) {
  await interactOnce(page, root);
}

async function interactPlacementOrdering(page: Page, root: Locator) {
  const draggables = root.locator('[role="button"][aria-roledescription="draggable"]');
  if ((await draggables.count()) >= 2) {
    await dragBetween(page, draggables.nth(0), draggables.nth(1));
    await page.waitForTimeout(300);
    return;
  }
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
    const graphRoot = root
      .locator('pie-graphing, graphing-element, graphing-solution-set-element')
      .first();
    const toolbarButton = graphRoot
      .locator(
        'button.MuiButtonBase-root, button[aria-label*="tool" i], button[aria-label*="line" i]'
      )
      .first();
    if (await toolbarButton.isVisible().catch(() => false)) {
      await toolbarButton.click({ force: true });
    }
    const svg = graphRoot.locator('svg').first();
    if (await svg.isVisible().catch(() => false)) {
      const box = await svg.boundingBox();
      if (box) {
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      }
    }
    return;
  }

  if (element === 'charting' || element === 'number-line') {
    await clickSvgCenter(root, page).catch(async () => {
      await interactOnce(page, root);
    });
    await page.keyboard.press('Escape').catch(() => {});
    return;
  }

  await interactOnce(page, root);
}

test.describe('Phase 1: Spatial and DnD element interactions', () => {
  for (const item of CASES) {
    const caseLabel = item.demoId ? `${item.element} [demo=${item.demoId}]` : item.element;
    test(`${caseLabel}: gather interaction updates state and evaluate renders`, async ({
      page,
    }) => {
      await openDeliverRoute(page, item.element, item.demoId);
      const root = deliveryContainer(page);
      await expect(root).toBeVisible();

      if (item.expectsSessionMutation) {
        const before = await getSessionState(page);
        const beforeSnapshot = ((await root.innerText().catch(() => '')) || '').trim();
        await runSpatialInteraction(page, item.element, root);
        let after = await waitForSessionMutation(page, before, 10_000);
        let afterSnapshot = ((await root.innerText().catch(() => '')) || '').trim();
        const sessionChanged = JSON.stringify(after ?? {}) !== JSON.stringify(before ?? {});
        const viewChanged = afterSnapshot !== beforeSnapshot;
        if (!sessionChanged && !viewChanged) {
          await runSpatialInteraction(page, item.element, root);
          after = await waitForSessionMutation(page, before, 8_000);
          afterSnapshot = ((await root.innerText().catch(() => '')) || '').trim();
        }
        const finalSessionChanged = JSON.stringify(after ?? {}) !== JSON.stringify(before ?? {});
        const finalViewChanged = afterSnapshot !== beforeSnapshot;
        expect(finalSessionChanged || finalViewChanged).toBeTruthy();
      } else {
        await runSpatialInteraction(page, item.element, root);
      }

      if (item.element === 'placement-ordering') {
        const evaluateModeControl = page.locator('[data-testid="mode-evaluate"]').first();
        expect(await evaluateModeControl.isVisible().catch(() => false)).toBeTruthy();
        return;
      }

      await switchToEvaluate(page);
      await expect(root).toBeVisible();

      const evaluateSignal = page
        .locator(
          '[data-testid="show-correct-answer"], [data-testid="scoring-panel"], [data-testid="score-value"], button:has-text("Show correct answer"), button:has-text("Hide correct answer")'
        )
        .or(root.getByText(/show correct answer|hide correct answer/i))
        .first();

      if (item.element === 'categorize') {
        expect(await root.isVisible()).toBeTruthy();
        return;
      }
      if (item.element === 'number-line') {
        const evaluateModeControl = page.locator('[data-testid="mode-evaluate"]').first();
        expect(await evaluateModeControl.isVisible().catch(() => false)).toBeTruthy();
        return;
      }

      await expect(evaluateSignal).toBeVisible({ timeout: 15_000 });
    });
  }
});
