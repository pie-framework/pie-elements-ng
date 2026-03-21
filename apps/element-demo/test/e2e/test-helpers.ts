import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Helper utilities for element-demo browser tests
 */

/**
 * Wait for MathJax to finish rendering LaTeX content
 */
export async function waitForMathRendering(page: Page, timeout = 5000) {
  await page
    .waitForFunction(
      () => {
        // Check if MathJax is present and idle
        const mathJax = (window as any).MathJax;
        if (!mathJax) return true; // No MathJax, consider done

        // MathJax 3.x check
        if (mathJax.startup?.promise) {
          return mathJax.startup.promise.then(() => true).catch(() => true);
        }

        return true;
      },
      { timeout }
    )
    .catch(() => {
      // If timeout, continue anyway - math might not be present
    });

  // Additional wait for any mutations to settle
  await page.waitForTimeout(500);
}

/**
 * Select a demo from the demo selector dropdown
 */
export async function selectDemo(page: Page, demoId: string) {
  // Click the demo selector button
  await page.click('[data-testid="demo-selector-button"]');

  // Wait for dropdown to be visible
  await page.waitForSelector('[data-testid="demo-selector-dropdown"]', { state: 'visible' });

  // Click the specific demo
  await page.click(`[data-demo-id="${demoId}"]`);

  // Wait for page to reload and be ready
  await page.waitForLoadState('networkidle');
  await waitForMathRendering(page);
}

/**
 * Switch mode (gather, view, evaluate)
 */
export async function switchMode(page: Page, mode: 'gather' | 'view' | 'evaluate') {
  const modeButton = page.locator(`[data-testid="mode-${mode}"]`).first();
  await modeButton.waitFor({ state: 'visible', timeout: 10_000 });
  await modeButton.click({ force: true });
  await page.waitForLoadState('networkidle');
  await waitForMathRendering(page);
}

/**
 * Switch role (student, instructor)
 */
export async function switchRole(page: Page, role: 'student' | 'instructor') {
  const roleButton = page.locator(`[data-testid="role-${role}"]`).first();
  await roleButton.waitFor({ state: 'visible', timeout: 10_000 });
  await roleButton.click({ force: true });
  await page.waitForLoadState('networkidle');
}

/**
 * Get session state from the session panel
 */
export async function getSessionState(page: Page): Promise<any> {
  const sessionText = await page.locator('[data-testid="session-panel-content"]').textContent();
  if (!sessionText) return null;

  try {
    return JSON.parse(sessionText);
  } catch {
    return null;
  }
}

/**
 * Click a multiple choice option by its value
 */
export async function selectMultipleChoiceOption(page: Page, optionValue: string) {
  // Multiple choice element uses labels with data-value or input with value
  const selector = `pie-multiple-choice input[value="${optionValue}"], pie-multiple-choice label[data-value="${optionValue}"]`;
  await page.click(selector);

  // Wait for any state updates
  await page.waitForTimeout(500);
}

/**
 * Get the score from the scoring panel
 */
export async function getScore(page: Page): Promise<number | null> {
  const scoreText = await page
    .locator('[data-testid="score-value"]')
    .textContent()
    .catch(() => null);
  if (!scoreText) return null;

  const match = scoreText.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Check if element is marked as correct
 */
export async function isMarkedCorrect(page: Page): Promise<boolean> {
  const correctIndicator = page.locator('[data-testid="correct-indicator"]');
  return await correctIndicator.isVisible().catch(() => false);
}

/**
 * Click the "Show correct answer" button
 */
export async function clickShowCorrectAnswer(page: Page) {
  await page.click('[data-testid="show-correct-answer"]');
  await page.waitForTimeout(500);
}

/**
 * Switch to a specific tab (deliver, author, print, source)
 */
export async function switchTab(page: Page, tab: 'deliver' | 'author' | 'print' | 'source') {
  await page.click(`[data-testid="tab-${tab}"]`);
  await page.waitForLoadState('networkidle');

  if (tab === 'deliver' || tab === 'print') {
    await waitForMathRendering(page);
  }
}

/**
 * Get the model JSON from the source tab
 */
export async function getModelFromSource(page: Page): Promise<any> {
  const modelText = await page.locator('[data-testid="source-editor"]').textContent();
  if (!modelText) return null;

  try {
    return JSON.parse(modelText);
  } catch {
    return null;
  }
}

/**
 * Update the model in the source tab and apply changes
 */
export async function updateModelInSource(page: Page, model: any) {
  // Focus the editor
  await page.click('[data-testid="source-editor"]');

  // Select all and replace
  await page.keyboard.press('Meta+A'); // Cmd+A on Mac
  await page.keyboard.type(JSON.stringify(model, null, 2));

  // Click apply button
  await page.click('[data-testid="apply-changes"]');
  await page.waitForTimeout(1000); // Wait for changes to propagate
}

/**
 * Check if the apply button is visible (indicates unsaved changes)
 */
export async function hasUnsavedChanges(page: Page): Promise<boolean> {
  const applyButton = page.locator('[data-testid="apply-changes"]');
  const isEnabled = await applyButton.isEnabled().catch(() => false);
  return isEnabled;
}

/**
 * Wait for element to be loaded and ready
 */
export async function waitForElementReady(page: Page, elementName: string) {
  const candidates = elementName.includes('-')
    ? [elementName, `pie-${elementName}`]
    : [elementName];

  await page.waitForFunction(
    (names) => names.some((name: string) => customElements.get(name) !== undefined),
    candidates,
    {
      timeout: 10_000,
    }
  );

  for (const candidate of candidates) {
    if (
      await page
        .locator(candidate)
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }
  }
  await page.waitForSelector(candidates.join(', '), { state: 'attached', timeout: 10_000 });
}

/**
 * Get all available choices from a multiple choice element
 */
export async function getMultipleChoiceOptions(page: Page): Promise<string[]> {
  const inputs = await page.locator('pie-multiple-choice input[type="radio"]').all();
  const values: string[] = [];

  for (const input of inputs) {
    const value = await input.getAttribute('value');
    if (value) values.push(value);
  }

  return values;
}

/**
 * Get the selected value from a multiple choice element
 */
export async function getSelectedValue(page: Page): Promise<string | null> {
  const selected = await page.locator('pie-multiple-choice input[type="radio"]:checked').first();
  return await selected.getAttribute('value').catch(() => null);
}

/**
 * Navigate to an element deliver route and wait for shell.
 */
export async function openDeliverRoute(page: Page, element: string) {
  await page.goto(`/${element}/deliver?mode=gather&role=student`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="mode-gather"]', { timeout: 20_000 });
}

/**
 * Navigate to an element author route and wait for shell.
 */
export async function openAuthorRoute(page: Page, element: string) {
  await page.goto(`/${element}/author`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('.author-view', { timeout: 20_000 });
}

/**
 * Get delivery element container.
 */
export function deliveryContainer(page: Page): Locator {
  return page.locator('.delivery-view .element-container').first();
}

/**
 * Parse session JSON panel; retries for async updates.
 */
export async function waitForSessionMutation(
  page: Page,
  before: unknown,
  timeoutMs = 8_000
): Promise<any> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const next = await getSessionState(page);
    if (JSON.stringify(next ?? {}) !== JSON.stringify(before ?? {})) {
      return next;
    }
    await page.waitForTimeout(200);
  }
  return await getSessionState(page);
}

/**
 * Click inside first visible SVG in scope.
 */
export async function clickSvgCenter(scope: Locator, page: Page) {
  const svg = scope.locator('svg').first();
  await svg.waitFor({ state: 'visible', timeout: 10_000 });
  const box = await svg.boundingBox();
  if (!box) {
    throw new Error('SVG bounding box unavailable');
  }
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

/**
 * Click inside first visible canvas in scope.
 */
export async function clickCanvas(scope: Locator, position = { x: 28, y: 28 }) {
  const canvas = scope.locator('canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 10_000 });
  await canvas.click({ position, force: true });
}

/**
 * Attempt a broad, user-like interaction in delivery.
 */
export async function interactOnce(page: Page, scope?: Locator): Promise<string> {
  const root = scope ?? deliveryContainer(page);

  const radio = root.locator('input[type="radio"]').first();
  if (await radio.isVisible().catch(() => false)) {
    await radio.check();
    return 'radio';
  }

  const checkbox = root.locator('input[type="checkbox"]').first();
  if (await checkbox.isVisible().catch(() => false)) {
    await checkbox.check();
    return 'checkbox';
  }

  const combo = root.locator('[role="combobox"], button[aria-haspopup="listbox"]').first();
  if (await combo.isVisible().catch(() => false)) {
    await combo.click({ force: true });
    const option = page.locator('[role="option"], li[role="option"]').first();
    if (await option.isVisible().catch(() => false)) {
      await option.click({ force: true });
      return 'combobox';
    }
    await page.keyboard.press('Escape').catch(() => {});
  }

  const text = root
    .locator('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), textarea')
    .first();
  if (await text.isVisible().catch(() => false)) {
    await text.fill(`e2e-${Date.now()}`);
    return 'text';
  }

  const editable = root.locator('[contenteditable="true"], [role="textbox"]').first();
  if (await editable.isVisible().catch(() => false)) {
    await editable.click();
    await page.keyboard.press('Meta+A').catch(() => {});
    await page.keyboard.type(`e2e-${Date.now()}`);
    return 'contenteditable';
  }

  const button = root
    .locator('button, [role="button"], [class*="choice"], [class*="option"], [class*="token"]')
    .first();
  if (await button.isVisible().catch(() => false)) {
    await button.click({ force: true });
    return 'button';
  }

  const primitive = root.locator('svg circle, svg path, svg rect, svg line').first();
  if (await primitive.isVisible().catch(() => false)) {
    await primitive.click({ force: true });
    return 'svg-primitive';
  }

  const canvas = root.locator('canvas').first();
  if (await canvas.isVisible().catch(() => false)) {
    await canvas.click({ position: { x: 24, y: 24 }, force: true });
    return 'canvas';
  }

  throw new Error('No interactive control found for generic interaction');
}

/**
 * Basic drag helper using mouse between two locators.
 */
export async function dragBetween(page: Page, from: Locator, to: Locator) {
  await from.waitFor({ state: 'visible', timeout: 10_000 });
  await to.waitFor({ state: 'visible', timeout: 10_000 });
  const fromBox = await from.boundingBox();
  const toBox = await to.boundingBox();
  if (!fromBox || !toBox) {
    throw new Error('Cannot drag: missing source or target bounding box');
  }
  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(toBox.x + toBox.width / 2, toBox.y + toBox.height / 2, { steps: 12 });
  await page.mouse.up();
}

/**
 * Return visible locator candidates for selector groups.
 */
export async function visibleCandidates(
  scope: Locator,
  selectors: string[],
  maxPerSelector = 6
): Promise<Locator[]> {
  const out: Locator[] = [];
  for (const selector of selectors) {
    const list = scope.locator(selector);
    const count = Math.min(await list.count(), maxPerSelector);
    for (let i = 0; i < count; i += 1) {
      const candidate = list.nth(i);
      if (await candidate.isVisible().catch(() => false)) {
        out.push(candidate);
      }
    }
  }
  return out;
}

type DragCandidateOptions = {
  sourceSelectors: string[];
  targetSelectors: string[];
  retries?: number;
};

/**
 * Try deterministic source -> target drags with retries.
 */
export async function dragAnyCandidateToTarget(
  page: Page,
  scope: Locator,
  options: DragCandidateOptions
): Promise<boolean> {
  const { sourceSelectors, targetSelectors, retries = 2 } = options;
  const sources = await visibleCandidates(scope, sourceSelectors);
  const targets = await visibleCandidates(scope, targetSelectors);
  if (sources.length === 0 || targets.length === 0) {
    return false;
  }

  for (let attempt = 0; attempt < retries; attempt += 1) {
    for (const source of sources) {
      for (const target of targets) {
        try {
          const same = await source.evaluate(
            (src, tgt) => src.isSameNode(tgt as Node),
            await target.elementHandle()
          );
          if (same) {
            continue;
          }
          await dragBetween(page, source, target);
          await page.waitForTimeout(200);
          return true;
        } catch {
          // Continue trying other source/target pairs.
        }
      }
    }
  }
  return false;
}

/**
 * Move to evaluate mode as instructor.
 */
export async function switchToEvaluate(page: Page) {
  await switchRole(page, 'instructor');
  await switchMode(page, 'evaluate');
}
