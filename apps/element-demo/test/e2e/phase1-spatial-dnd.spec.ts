import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  clickCanvas,
  clickNumberLineTick,
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

const CHOICE_DROP_ELEMENTS = new Set([
  'categorize',
  'drag-in-the-blank',
  'match-list',
  'image-cloze-association',
]);

/**
 * Drag the first choice onto the first drop zone. A choice is an enabled dnd-kit draggable (match-list
 * renders its empty response areas as disabled draggables); a drop zone is a click-to-place
 * `role="button"` without the draggable roledescription.
 */
async function dragFirstChoiceToFirstDropZone(page: Page, root: Locator) {
  const choice = root.locator('[aria-roledescription="draggable"][aria-disabled="false"]').first();
  const dropZone = root.locator('[role="button"]:not([aria-roledescription])').first();
  await dragBetween(page, choice, dropZone);
  // dnd-kit swallows document clicks until a 50ms timer it sets on drop has fired, so an earlier
  // click on the Scorer link bypasses the router and reloads the page, losing the session. A page
  // timer of the same length set after the drop fires after that one.
  await page.evaluate(() => new Promise((resolve) => setTimeout(resolve, 50)));
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
            const points: unknown[] = Array.isArray(p?.points) ? p.points : [];
            const objectPoints = points.filter(
              (point: unknown): point is { x: number; y: number } =>
                typeof point === 'object' &&
                point !== null &&
                typeof (point as { x?: unknown }).x === 'number' &&
                typeof (point as { y?: unknown }).y === 'number'
            );

            if (objectPoints.length > 0) {
              relativePoints.push({
                x:
                  objectPoints.reduce(
                    (acc: number, point: { x: number; y: number }) => acc + point.x,
                    0
                  ) / objectPoints.length,
                y:
                  objectPoints.reduce(
                    (acc: number, point: { x: number; y: number }) => acc + point.y,
                    0
                  ) / objectPoints.length,
              });
            } else if (points.length >= 2) {
              const pairs: Array<{ x: number; y: number }> = [];
              for (let i = 0; i + 1 < points.length; i += 2) {
                pairs.push({ x: Number(points[i] ?? 0), y: Number(points[i + 1] ?? 0) });
              }
              if (pairs.length > 0) {
                relativePoints.push({
                  x:
                    pairs.reduce(
                      (acc: number, point: { x: number; y: number }) => acc + point.x,
                      0
                    ) / pairs.length,
                  y:
                    pairs.reduce(
                      (acc: number, point: { x: number; y: number }) => acc + point.y,
                      0
                    ) / pairs.length,
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
          return relativePoints.map((point: { x: number; y: number }) => ({
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
      const next = JSON.stringify(host?.session ?? {});
      // A page reload briefly leaves the host session empty; that is no response.
      return next !== signature && next !== '{}';
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

/** Click the plotting grid at a fraction of its size; (0, 0) is the grid's top-left corner. */
async function clickGridFraction(page: Page, graphRoot: Locator, fx: number, fy: number) {
  const grid = graphRoot.locator('svg g.visx-grid').first();
  await grid.waitFor({ state: 'visible', timeout: 10_000 });
  const box = await grid.boundingBox();
  if (!box) {
    throw new Error('Graph grid has no bounding box');
  }
  await page.mouse.click(box.x + box.width * fx, box.y + box.height * fy);
  await page.waitForTimeout(150);
}

async function interactGraphing(page: Page, element: string, root: Locator) {
  const graphRoot = root.locator('graphing-element, graphing-solution-set-element').first();
  if (element === 'graphing') {
    // The tool buttons sit inside a dnd-kit wrapper marked aria-disabled, hence force.
    await graphRoot.locator('button[value="point"]').click({ force: true });
    // (1, 1) on the demo's -5..5 grid.
    await clickGridFraction(page, graphRoot, 0.6, 0.4);
    return;
  }
  // Line A is preselected; a line reaches the session only once both ends are placed.
  // (0, 2) -> (-3, -2) on the demo's -10..10 grid, the correct answer's Line A.
  await expect(graphRoot.locator('input[type="radio"][value="lineA"]')).toBeChecked();
  await clickGridFraction(page, graphRoot, 0.5, 0.4);
  await clickGridFraction(page, graphRoot, 0.35, 0.6);
}

async function interactCharting(page: Page, root: Locator) {
  // Only interactive bars render a drag handle ellipse; the demo has one (Student C).
  const handle = root.locator('svg ellipse').first();
  await handle.waitFor({ state: 'visible', timeout: 10_000 });
  const box = await handle.boundingBox();
  if (!box) {
    throw new Error('Bar drag handle has no bounding box');
  }
  // The handle is clipped to its top half, so press just above its centre.
  const x = box.x + box.width / 2;
  const y = box.y + box.height * 0.45;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 48, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(200);
}

async function runSpatialInteraction(page: Page, element: string, root: Locator) {
  if (CHOICE_DROP_ELEMENTS.has(element)) {
    await dragFirstChoiceToFirstDropZone(page, root);
    return;
  }

  if (element === 'placement-ordering') {
    await interactPlacementOrdering(page, root);
    return;
  }

  if (element === 'drawing-response') {
    // Select is the default tool and ignores mousedown; pick a drawing tool, then drag on the stage.
    await root.getByRole('button', { name: 'Free Draw' }).click();
    const stage = root.locator('canvas').first();
    await stage.waitFor({ state: 'visible' });
    const box = await stage.boundingBox();
    if (!box) {
      throw new Error('drawing-response: stage canvas has no bounding box');
    }
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 120, box.y + 90, { steps: 8 });
    await page.mouse.move(box.x + 180, box.y + 140, { steps: 8 });
    await page.mouse.up();
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
    // Each part of a bar model is a recharts rectangle; the last one shades the whole bar (2/2),
    // an incorrect answer, so evaluate shows the correct-answer toggle.
    await root.locator('.recharts-bar-rectangle rect').last().click();
    return;
  }

  if (element === 'graphing' || element === 'graphing-solution-set') {
    await interactGraphing(page, element, root);
    return;
  }

  if (element === 'charting') {
    await interactCharting(page, root);
    return;
  }

  if (element === 'number-line') {
    await clickNumberLineTick(page, root);
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

      let gatherSession: string | undefined;
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
        const finalSessionChanged = after !== before && after !== '{}';
        expect(finalSessionChanged).toBeTruthy();
        gatherSession = after;
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
      if (CHOICE_DROP_ELEMENTS.has(item.element)) {
        await expect.poll(() => getHostSessionSignature(page)).toBe(gatherSession);
      }

      const evaluateSignal = root.getByText(/show correct answer|hide correct answer/i).first();

      if (item.element === 'drawing-response') {
        // Not auto-scored: evaluate renders the drawing with the toolbar locked and no correct-answer toggle.
        await expect(root.getByRole('button', { name: 'Free Draw' })).toBeDisabled();
        await expect(root.getByRole('button', { name: 'Undo' })).toBeDisabled();
        return;
      }

      await expect(evaluateSignal).toBeVisible({ timeout: 15_000 });
    });
  }
});
