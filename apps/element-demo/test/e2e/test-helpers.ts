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
  await page.click(`[data-testid="mode-${mode}"]`);
  await page.waitForLoadState('networkidle');
  await waitForMathRendering(page);
}

/**
 * Switch role (student, instructor)
 */
export async function switchRole(page: Page, role: 'student' | 'instructor') {
  await page.click(`[data-testid="role-${role}"]`);
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
  const scoreText = await page.locator('[data-testid="score-value"]').textContent();
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
  await page.waitForFunction((name) => customElements.get(name) !== undefined, elementName, {
    timeout: 10_000,
  });

  await page.waitForSelector(elementName, { state: 'attached', timeout: 10_000 });
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
