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
 * Navigate by query param through the SvelteKit router, so the demo's in-memory
 * session survives; `page.goto` reloads the document and clears it.
 */
async function navigateWithQueryParam(page: Page, name: string, value: string) {
  await page.evaluate(
    ({ key, nextValue }) => {
      const url = new URL(window.location.href);
      url.searchParams.set(key, nextValue);
      const link = document.createElement('a');
      link.href = url.pathname + url.search;
      // The router handles clicks on links inside its container, app.html's body wrapper.
      (document.querySelector('body > div[style*="contents"]') ?? document.body).append(link);
      link.click();
      link.remove();
    },
    { key: name, nextValue: value }
  );
  await page.waitForURL((url) => url.searchParams.get(name) === value, { timeout: 10_000 });
}

/**
 * Switch mode (gather, view, evaluate) via URL params.
 */
export async function switchMode(page: Page, mode: 'gather' | 'view' | 'evaluate') {
  await navigateWithQueryParam(page, 'mode', mode);
  await page.waitForLoadState('networkidle');
  await waitForMathRendering(page);
}

/**
 * Switch role (student, instructor) by clicking the toolbar button.
 * This uses SvelteKit client-side navigation so the in-memory session store is
 * preserved. The toolbar buttons also set mode=evaluate (instructor) or
 * mode=gather (student), matching what the app does when a user clicks them.
 */
export async function switchRole(page: Page, role: 'student' | 'instructor') {
  await page.click(`[data-testid="role-${role}"]`);
  const expectedRoleParam = `role=${role}`;
  await page.waitForURL(`**${expectedRoleParam}**`, { timeout: 10_000 });
  await waitForMathRendering(page);
}

/**
 * Get session state from the session panel
 */
export async function getSessionState(page: Page): Promise<any> {
  // Prefer host session because some layouts no longer expose a session panel.
  const hostSession = await page.evaluate(() => {
    const host = document.querySelector('pie-element-player') as any;
    if (!host || typeof host !== 'object') {
      return undefined;
    }
    const raw = host.session;
    if (raw === null || raw === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(JSON.stringify(raw));
    } catch {
      return raw;
    }
  });
  if (hostSession !== undefined) {
    return hostSession;
  }

  const panel = page.locator('[data-testid="session-panel-content"]').first();
  const hasPanel = await panel.isVisible().catch(() => false);
  if (!hasPanel) return null;

  const sessionText = await panel.textContent();
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
  await deliveryContainer(page)
    .locator(`input[value="${optionValue}"], label[data-value="${optionValue}"]`)
    .first()
    .click();

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
 * Switch to a specific tab (deliver, author, print, source)
 */
export async function switchTab(page: Page, tab: 'deliver' | 'author' | 'print' | 'source') {
  await page.click(`[data-testid="tab-${tab}"]`);
  await page.waitForTimeout(200);

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
  await page.keyboard.press('ControlOrMeta+A');
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

export type PlayerView = 'delivery' | 'author' | 'print';

/**
 * Selector for the element the player mounted for a view. The ESM and IIFE strategies register
 * the delivery element under different tags, so specs find it through the player.
 */
export function mountedElementSelector(view: PlayerView = 'delivery'): string {
  return `pie-element-player[view="${view}"] .element-player-mount > *`;
}

/**
 * The element the player mounted for a view.
 */
export function mountedElement(page: Page, view: PlayerView = 'delivery'): Locator {
  return page.locator(mountedElementSelector(view)).first();
}

/**
 * Wait for the player to mount the element for a view and for its tag to be defined.
 */
export async function waitForElementReady(page: Page, view: PlayerView = 'delivery') {
  const element = mountedElement(page, view);
  await element.waitFor({ state: 'attached', timeout: 10_000 });
  const tagName = await element.evaluate((node) => node.localName);
  await page.waitForFunction((name) => customElements.get(name) !== undefined, tagName, {
    timeout: 10_000,
  });
}

/**
 * Get all available choices from a multiple choice element
 */
export async function getMultipleChoiceOptions(page: Page): Promise<string[]> {
  const inputs = await deliveryContainer(page).locator('input[type="radio"]').all();
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
  const selected = deliveryContainer(page).locator('input[type="radio"]:checked').first();
  return await selected.getAttribute('value').catch(() => null);
}

/**
 * Navigate to an element deliver route and wait for shell.
 */
export async function openDeliverRoute(page: Page, element: string, demoId?: string) {
  const demoQuery = demoId ? `&demo=${encodeURIComponent(demoId)}` : '';
  await page.goto(`/${element}/deliver?mode=gather&role=student${demoQuery}`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="role-student"], pie-element-player[view="delivery"]', {
    timeout: 20_000,
  });
}

/**
 * Navigate to an element author route and wait for shell.
 */
export async function openAuthorRoute(page: Page, element: string, demoId?: string) {
  const demoQuery = demoId ? `?demo=${encodeURIComponent(demoId)}` : '';
  await page.goto(`/${element}/author${demoQuery}`);
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

/** Click the number line at the tick labelled `tick`; the preselected point type is added there. */
export async function clickNumberLineTick(page: Page, root: Locator, tick = '0') {
  // The line is the only svg with explicit width/height; the correct-answer toggle's
  // hidden icons come first in DOM order.
  const line = root.locator(`${mountedElementSelector()} svg[width][height]`).first();
  await line.waitFor({ state: 'visible', timeout: 10_000 });
  const lineBox = await line.boundingBox();
  const tickBox = await line.locator('text').getByText(tick, { exact: true }).first().boundingBox();
  if (!lineBox || !tickBox) {
    throw new Error('Number line or tick label has no bounding box');
  }
  await page.mouse.click(tickBox.x + tickBox.width / 2, lineBox.y + lineBox.height / 2);
  await page.waitForTimeout(150);
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
 * The element's evaluate state: its correct-answer toggle, a correctness marker, or,
 * for elements without a correct answer, its locked controls. The demo shows no score.
 */
export function evaluateSignal(root: Locator): Locator {
  return root
    .getByText(/show correct answer|hide correct answer/i)
    .or(root.locator('.correct, .incorrect, .correct-fill, .incorrect-fill'))
    .or(
      root.locator('input:disabled, input[readonly], textarea[readonly], [contenteditable="false"]')
    )
    .filter({ visible: true })
    .first();
}

/**
 * Move to evaluate mode as instructor; the Scorer toggle sets both.
 */
export async function switchToEvaluate(page: Page) {
  await switchRole(page, 'instructor');
  await page.waitForURL((url) => url.searchParams.get('mode') === 'evaluate', {
    timeout: 10_000,
  });
}
