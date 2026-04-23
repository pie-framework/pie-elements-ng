import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  clickCanvas,
  clickSvgCenter,
  dragAnyCandidateToTarget,
  dragBetween,
  deliveryContainer,
  interactOnce,
  openDeliverRoute,
  switchToEvaluate,
} from './test-helpers';

type SpatialCase = {
  element: string;
  expectsSessionMutation: boolean;
  demoId?: string;
};

const CASES: SpatialCase[] = [
  { element: 'categorize', expectsSessionMutation: true },
  { element: 'drag-in-the-blank', expectsSessionMutation: true },
  { element: 'match-list', expectsSessionMutation: true },
  { element: 'image-cloze-association', expectsSessionMutation: true },
  { element: 'placement-ordering', expectsSessionMutation: true },
  { element: 'hotspot', expectsSessionMutation: true },
  { element: 'graphing', expectsSessionMutation: true },
  { element: 'graphing-solution-set', expectsSessionMutation: true },
  { element: 'charting', expectsSessionMutation: true },
  { element: 'number-line', expectsSessionMutation: true },
  { element: 'number-line', expectsSessionMutation: true, demoId: 'basic-points' },
  { element: 'drawing-response', expectsSessionMutation: true },
  { element: 'fraction-model', expectsSessionMutation: true },
];

async function interactCategorize(page: Page, root: Locator) {
  const elementHost = root.locator('categorize-element, pie-categorize').first();
  if (await elementHost.isVisible().catch(() => false)) {
    const sources = elementHost.locator(
      '[role="button"][aria-roledescription="draggable"], [aria-roledescription="draggable"], [role="button"]'
    );
    const boardTargets = elementHost.locator(
      '[id="0"], [id="1"], [id="2"], [id="3"], div[style*="touch-action: none"]'
    );
    const sourceCount = await sources.count();
    const boardTargetCount = await boardTargets.count();
    if (sourceCount > 0 && boardTargetCount > 0) {
      const maxSources = Math.min(sourceCount, 6);
      const maxTargets = Math.min(boardTargetCount, 6);
      for (let sourceIndex = 0; sourceIndex < maxSources; sourceIndex += 1) {
        for (let targetIndex = 0; targetIndex < maxTargets; targetIndex += 1) {
          const source = sources.nth(sourceIndex);
          const target = boardTargets.nth(targetIndex);
          if (
            !(await source.isVisible().catch(() => false)) ||
            !(await target.isVisible().catch(() => false))
          ) {
            continue;
          }
          try {
            const fromBox = await source.boundingBox();
            const toBox = await target.boundingBox();
            if (!fromBox || !toBox) {
              continue;
            }
            await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
            await page.mouse.down();
            await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, {
              steps: 12,
            });
            await page.mouse.up();
            await page.waitForTimeout(220);
            return;
          } catch {
            // Keep trying different source/target pairs.
          }
        }
      }
    }
  }

  const draggedByGeometry = await root.evaluate((node) => {
    const sourceCandidates = Array.from(
      node.querySelectorAll<HTMLElement>(
        '#choices-board [role="button"], #choices-board [class*="MuiCard-root"], #choices-board div'
      )
    ).filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 20 && rect.height > 20;
    });
    const source = sourceCandidates[0];
    if (!source) {
      return null;
    }

    const dropTargets = Array.from(
      node.querySelectorAll<HTMLElement>(
        'div[style*="touch-action: none"], [id*="drop"], [class*="drop"], [class*="target"]'
      )
    ).filter((el) => {
      if (el.id === 'choices-board') {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 20 && rect.height > 20 && !el.closest('#choices-board');
    });
    const target = dropTargets[0];
    if (!target) {
      return null;
    }

    const from = source.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    return {
      from: { x: from.left + from.width / 2, y: from.top + from.height / 2 },
      to: { x: to.left + to.width / 2, y: to.top + to.height / 2 },
    };
  });

  if (draggedByGeometry) {
    await page.mouse.move(draggedByGeometry.from.x, draggedByGeometry.from.y);
    await page.mouse.down();
    await page.mouse.move(draggedByGeometry.to.x, draggedByGeometry.to.y, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(250);
    return;
  }

  const draggedBySelectors = await dragAnyCandidateToTarget(page, root, {
    sourceSelectors: [
      '#choices-board [role="button"]',
      '[draggable="true"]',
      '[data-draggable="true"]',
      '[class*="choice"]',
      '[class*="token"]',
      'button',
    ],
    targetSelectors: [
      'div[style*="touch-action: none"]',
      '[id*="drop"]',
      '[class*="drop"]',
      '[class*="target"]',
      '[class*="container"]',
    ],
    retries: 2,
  });

  if (draggedBySelectors) {
    return;
  }

  await interactOnce(page, root);
}

async function interactHotspot(page: Page, root: Locator): Promise<boolean> {
  const host = root.locator('hotspot-element, pie-hotspot').first();
  const canvas = host.locator('canvas').first();
  if (
    !(await host.isVisible().catch(() => false)) ||
    !(await canvas.isVisible().catch(() => false))
  ) {
    return false;
  }

  const model = await host
    .evaluate((node) => (node as any).model ?? (node as any)._model ?? null)
    .catch(() => null);

  const clickPoints =
    model && typeof model === 'object'
      ? await canvas.evaluate((canvasNode, modelArg) => {
          const model = modelArg ?? {};
          const shapes = model.shapes ?? {};
          const rectangles = Array.isArray(shapes.rectangles) ? shapes.rectangles : [];
          const circles = Array.isArray(shapes.circles) ? shapes.circles : [];
          const polygons = Array.isArray(shapes.polygons) ? shapes.polygons : [];

          const relativePoints: Array<{ x: number; y: number }> = [];
          for (const r of rectangles) {
            relativePoints.push({
              x: Number(r?.x ?? 0) + Number(r?.width ?? 0) / 2,
              y: Number(r?.y ?? 0) + Number(r?.height ?? 0) / 2,
            });
          }
          for (const c of circles) {
            relativePoints.push({
              x: Number(c?.x ?? 0),
              y: Number(c?.y ?? 0),
            });
          }
          for (const p of polygons) {
            const points = Array.isArray(p?.points) ? p.points : [];
            const objectPoints = points.filter(
              (point): point is { x: number; y: number } =>
                typeof point === 'object' &&
                point !== null &&
                typeof (point as { x?: unknown }).x === 'number' &&
                typeof (point as { y?: unknown }).y === 'number'
            );

            if (objectPoints.length > 0) {
              relativePoints.push({
                x: objectPoints.reduce((acc, point) => acc + point.x, 0) / objectPoints.length,
                y: objectPoints.reduce((acc, point) => acc + point.y, 0) / objectPoints.length,
              });
            } else if (points.length >= 2) {
              const pairs: Array<{ x: number; y: number }> = [];
              for (let i = 0; i + 1 < points.length; i += 2) {
                pairs.push({ x: Number(points[i] ?? 0), y: Number(points[i + 1] ?? 0) });
              }
              if (pairs.length > 0) {
                relativePoints.push({
                  x: pairs.reduce((acc, point) => acc + point.x, 0) / pairs.length,
                  y: pairs.reduce((acc, point) => acc + point.y, 0) / pairs.length,
                });
              }
            }
          }
          if (relativePoints.length === 0) {
            return null;
          }

          const rect = (canvasNode as HTMLCanvasElement).getBoundingClientRect();
          const stageWidth = Number(model?.dimensions?.width ?? rect.width);
          const stageHeight = Number(model?.dimensions?.height ?? rect.height);
          const scaleX = stageWidth > 0 ? rect.width / stageWidth : 1;
          const scaleY = stageHeight > 0 ? rect.height / stageHeight : 1;
          return relativePoints.map((point) => ({
            x: rect.left + point.x * scaleX,
            y: rect.top + point.y * scaleY,
          }));
        }, model)
      : null;

  if (clickPoints && clickPoints.length > 0) {
    for (const clickPoint of clickPoints) {
      await page.mouse.click(clickPoint.x, clickPoint.y);
      await page.waitForTimeout(180);
    }
  }

  const canvasBox = await canvas.boundingBox();
  if (canvasBox) {
    const offsets = [0.2, 0.4, 0.6, 0.8];
    for (const ox of offsets) {
      for (const oy of offsets) {
        await page.mouse.click(
          canvasBox.x + canvasBox.width * ox,
          canvasBox.y + canvasBox.height * oy
        );
        await page.waitForTimeout(120);
      }
    }
    return true;
  }
  return false;
}

async function getHostSessionSignature(page: Page): Promise<string> {
  return await page.evaluate(() => {
    const host = document.querySelector('pie-element-player') as any;
    return JSON.stringify(host?.session ?? {});
  });
}

async function waitForHostSessionMutation(
  page: Page,
  beforeSignature: string,
  timeoutMs = 10_000
): Promise<string> {
  await page.waitForFunction(
    (signature) => {
      const host = document.querySelector('pie-element-player') as any;
      return JSON.stringify(host?.session ?? {}) !== signature;
    },
    beforeSignature,
    { timeout: timeoutMs }
  );
  return await getHostSessionSignature(page);
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
    const scopedHost =
      element === 'drag-in-the-blank'
        ? root.locator('drag-in-the-blank-element, pie-drag-in-the-blank').first()
        : element === 'match-list'
          ? root.locator('match-list-element, pie-match-list').first()
          : root.locator('image-cloze-association-element, pie-image-cloze-association').first();

    if (await scopedHost.isVisible().catch(() => false)) {
      const draggables = scopedHost.locator(
        '[role="button"][aria-roledescription="draggable"], [aria-roledescription="draggable"]'
      );
      const droppables = scopedHost.locator(
        '[aria-roledescription="droppable"], [id*="drop"], [class*="drop"], [class*="blank"], [class*="target"]'
      );
      const dragCount = await draggables.count();
      const dropCount = await droppables.count();
      if (dragCount > 0 && dropCount > 0) {
        const maxSources = Math.min(dragCount, 5);
        const maxTargets = Math.min(dropCount, 5);
        for (let sourceIndex = 0; sourceIndex < maxSources; sourceIndex += 1) {
          for (let targetIndex = 0; targetIndex < maxTargets; targetIndex += 1) {
            const source = draggables.nth(sourceIndex);
            const target = droppables.nth(targetIndex);
            if (
              !(await source.isVisible().catch(() => false)) ||
              !(await target.isVisible().catch(() => false))
            ) {
              continue;
            }
            try {
              const fromBox = await source.boundingBox();
              const toBox = await target.boundingBox();
              if (!fromBox || !toBox) {
                continue;
              }
              await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
              await page.mouse.down();
              await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, {
                steps: 10,
              });
              await page.mouse.up();
              await page.waitForTimeout(220);
              return;
            } catch {
              // Continue trying candidate pairs.
            }
          }
        }
      }
    }

    const dragged = await dragAnyCandidateToTarget(page, root, {
      sourceSelectors: [
        '[role="button"][aria-roledescription="draggable"]',
        '[aria-roledescription="draggable"]',
        '[draggable="true"]',
        '[data-draggable="true"]',
        '[id*="choice"]',
        '[class*="choice"]',
        '[class*="token"]',
        '[class*="option"]',
        'button',
      ],
      targetSelectors: [
        '[aria-roledescription="droppable"]',
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

  if (element === 'hotspot') {
    const clickedHotspot = await interactHotspot(page, root);
    if (clickedHotspot) {
      return;
    }
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
  }

  if (element === 'fraction-model') {
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
    await clickSvgCenter(root, page).catch(async () => {
      const segment = root.locator('button, [role="button"], svg path, svg rect').first();
      if (await segment.isVisible().catch(() => false)) {
        await segment.click({ force: true });
      }
    });
    return;
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
        const before = await getHostSessionSignature(page);
        const beforeSnapshot = ((await root.innerText().catch(() => '')) || '').trim();
        await runSpatialInteraction(page, item.element, root);
        let after = await waitForHostSessionMutation(page, before, 10_000).catch(async () => {
          return await getHostSessionSignature(page);
        });
        let afterSnapshot = ((await root.innerText().catch(() => '')) || '').trim();
        const sessionChanged = after !== before;
        const viewChanged = afterSnapshot !== beforeSnapshot;
        if (!sessionChanged && !viewChanged) {
          await runSpatialInteraction(page, item.element, root);
          after = await waitForHostSessionMutation(page, before, 8_000).catch(async () => {
            return await getHostSessionSignature(page);
          });
          afterSnapshot = ((await root.innerText().catch(() => '')) || '').trim();
        }
        const finalSessionChanged = after !== before;
        expect(finalSessionChanged).toBeTruthy();
      } else {
        await runSpatialInteraction(page, item.element, root);
      }

      if (item.element === 'placement-ordering') {
        await switchToEvaluate(page);
        const inEvaluateMode = await page.evaluate(() => {
          const url = new URL(window.location.href);
          return url.searchParams.get('mode') === 'evaluate';
        });
        expect(inEvaluateMode).toBeTruthy();
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
        await switchToEvaluate(page);
        const inEvaluateMode = await page.evaluate(() => {
          const url = new URL(window.location.href);
          return url.searchParams.get('mode') === 'evaluate';
        });
        expect(inEvaluateMode).toBeTruthy();
        return;
      }

      await expect(evaluateSignal).toBeVisible({ timeout: 15_000 });
    });
  }
});
