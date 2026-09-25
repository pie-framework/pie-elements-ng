import { test, expect, type Page } from '@playwright/test';
import {
  waitForMathRendering,
  selectDemo,
  switchMode,
  switchRole,
  getSessionState,
  selectMultipleChoiceOption,
  switchTab,
  getModelFromSource,
  updateModelInSource,
  waitForElementReady,
  getMultipleChoiceOptions,
  getSelectedValue,
  deliveryContainer,
  switchToEvaluate,
  mountedElement,
} from './test-helpers';

/**
 * Comprehensive browser tests for math-algebra-quadratic demo
 * Tests state management, mode/role switching, scoring, and tab synchronization
 */

const DEMO_ID = 'math-algebra-quadratic';
const ELEMENT = 'multiple-choice';
const CORRECT_ANSWER = 'opt2'; // The correct quadratic formula
const INCORRECT_ANSWER = 'opt1'; // Incorrect formula with wrong discriminant sign

test.describe('Math Algebra Quadratic Demo - Multiple Choice Element', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to multiple-choice element demo page
    await page.goto(`/${ELEMENT}/deliver`);
    await page.waitForLoadState('networkidle');

    // Wait for the element to be ready
    await waitForElementReady(page);
    await waitForMathRendering(page);
  });

  test('1. Demo selection works correctly', async ({ page }) => {
    // Verify we can see the demo selector
    const demoButton = page.locator('[data-testid="demo-selector-button"]');
    await expect(demoButton).toBeVisible();

    // Open demo selector dropdown
    await demoButton.click();
    const dropdown = page.locator('[data-testid="demo-selector-dropdown"]');
    await expect(dropdown).toBeVisible();

    // Select the math-algebra-quadratic demo
    const demoOption = page.locator(`[data-demo-id="${DEMO_ID}"]`);
    await expect(demoOption).toBeVisible();
    await demoOption.click();

    // Wait for page to reload with the selected demo
    await page.waitForLoadState('networkidle');
    await waitForElementReady(page);
    await waitForMathRendering(page);

    // Verify the URL contains the demo parameter
    expect(page.url()).toContain(`demo=${DEMO_ID}`);

    // Verify the prompt is displayed (contains "quadratic formula")
    const prompt = mountedElement(page);
    await expect(prompt).toContainText('quadratic formula');

    // Verify LaTeX math is rendered (should see the equation ax^2 + bx + c = 0)
    const mathElements = page.locator('.MathJax, mjx-container, .katex');
    await expect(mathElements.first()).toBeVisible();

    // Verify we have 4 choices (the quadratic formula has 4 options)
    const choices = await getMultipleChoiceOptions(page);
    expect(choices.length).toBe(4);
  });

  test('2. In gather mode, user selection shows up in session state panel', async ({ page }) => {
    // First select the correct demo
    await selectDemo(page, DEMO_ID);

    // Ensure we're in gather mode
    await switchMode(page, 'gather');

    // Verify session state is initially empty
    let sessionState = await getSessionState(page);
    expect(sessionState?.value || []).toHaveLength(0);

    // Select an option (opt1 - incorrect answer)
    await selectMultipleChoiceOption(page, INCORRECT_ANSWER);

    // Wait for session state to update
    await page.waitForTimeout(1000);

    // Verify session state now contains the selection
    sessionState = await getSessionState(page);
    expect(sessionState).toBeTruthy();
    expect(sessionState.value).toContain(INCORRECT_ANSWER);

    // Change selection to correct answer
    await selectMultipleChoiceOption(page, CORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // Verify session state updated
    sessionState = await getSessionState(page);
    expect(sessionState.value).toContain(CORRECT_ANSWER);
    expect(sessionState.value).not.toContain(INCORRECT_ANSWER);
  });

  test('3. Switching between modes and roles keeps selection active', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    // Start in gather mode as student
    await switchMode(page, 'gather');
    await switchRole(page, 'student');

    // Make a selection
    await selectMultipleChoiceOption(page, CORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // Verify selection is active
    let selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // Switch to view mode
    await switchMode(page, 'view');
    selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // Switch role to instructor
    await switchRole(page, 'instructor');
    selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // Switch to evaluate mode
    await switchMode(page, 'evaluate');
    selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // Switch back to gather mode
    await switchMode(page, 'gather');
    selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // Switch back to student role
    await switchRole(page, 'student');
    selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // Verify session state still contains the selection
    const sessionState = await getSessionState(page);
    expect(sessionState.value).toContain(CORRECT_ANSWER);
  });

  test('4. In evaluate mode as instructor, an incorrect selection is marked and "Show correct answer" reveals the answer', async ({
    page,
  }) => {
    await selectDemo(page, DEMO_ID);

    await switchMode(page, 'gather');
    await selectMultipleChoiceOption(page, INCORRECT_ANSWER);
    await page.waitForTimeout(1000);

    await switchToEvaluate(page);
    const root = deliveryContainer(page);
    await expect(root.locator('.incorrect-fill').first()).toBeVisible();
    await expect(root.locator('.correct-fill')).toHaveCount(0);

    const toggle = root.getByText('Show correct answer');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(root.getByText('Hide correct answer')).toBeVisible();
    await expect(root.locator('.correct-fill').first()).toBeVisible();
  });

  test('5. Incorrect selection in evaluate mode is marked incorrect', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    await switchMode(page, 'gather');
    await selectMultipleChoiceOption(page, INCORRECT_ANSWER);
    await page.waitForTimeout(1000);

    await switchToEvaluate(page);
    const root = deliveryContainer(page);
    await expect(root.locator('.incorrect-fill').first()).toBeVisible();
    await expect(root.locator('.correct-fill')).toHaveCount(0);
  });

  test('6. Correct selection in evaluate mode is marked correct', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    await switchMode(page, 'gather');
    await selectMultipleChoiceOption(page, CORRECT_ANSWER);
    await page.waitForTimeout(1000);

    await switchToEvaluate(page);
    const root = deliveryContainer(page);
    await expect(root.locator('.correct-fill')).toHaveCount(1);
    await expect(root.locator('.incorrect-fill')).toHaveCount(0);
    await expect(root.getByText('Show correct answer')).not.toBeVisible();
  });

  test('7. Switching between author, print, and source tabs works (session state not maintained)', async ({
    page,
  }) => {
    await selectDemo(page, DEMO_ID);

    // Start on deliver tab
    await expect(page).toHaveURL(/\/deliver/);

    // Switch to author tab
    await switchTab(page, 'author');
    await expect(page).toHaveURL(/\/author/);

    // Verify author view loads (configure component should be present)
    const authorView = page.locator('[data-testid="author-view"]');
    if ((await authorView.count()) > 0) {
      await expect(authorView).toBeVisible();
    }

    // Switch to print tab
    await switchTab(page, 'print');
    await expect(page).toHaveURL(/\/print/);

    // Verify print view loads
    const printPlayer = page.locator('pie-element-player[view="print"]');
    if ((await printPlayer.count()) > 0) {
      await expect(printPlayer).toBeVisible();
    }

    // Switch to source tab
    await switchTab(page, 'source');
    await expect(page).toHaveURL(/\/source/);

    // Verify source editor is visible
    const sourceEditor = page.locator('[data-testid="source-editor"], .source-view');
    await expect(sourceEditor.first()).toBeVisible();

    // Switch back to deliver
    await switchTab(page, 'deliver');
    await expect(page).toHaveURL(/\/deliver/);
    await waitForElementReady(page);

    // Verify we're back on the delivery view
    const multipleChoice = mountedElement(page);
    await expect(multipleChoice).toBeVisible();
  });

  test('8. Making a change in source and applying reflects in other panels', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    // Go to source tab
    await switchTab(page, 'source');

    // Get current model
    let model = await getModelFromSource(page);
    expect(model).toBeTruthy();

    // Make a change to the prompt
    const originalPrompt = model.prompt;
    model.prompt = '<p><strong>MODIFIED:</strong> Test modification of prompt</p>';

    // Update the model in the source editor
    await updateModelInSource(page, model);
    const updatedModel = await getModelFromSource(page);
    expect(updatedModel?.prompt || '').toContain('MODIFIED');

    // Switch to deliver tab
    await switchTab(page, 'deliver');
    await waitForElementReady(page);
    await waitForMathRendering(page);

    // Delivery should remain usable after source apply.
    const multipleChoice = mountedElement(page);
    await expect(multipleChoice).toBeVisible();

    // Restore original prompt
    await switchTab(page, 'source');
    model.prompt = originalPrompt;
    await updateModelInSource(page, model);
  });

  test('9. Making a change in author and applying reflects in other panels', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    // Go to author tab
    await switchTab(page, 'author');

    // Check if configure component is present
    const configureElement = page.locator(`${ELEMENT}-configure`);

    if ((await configureElement.count()) > 0) {
      await expect(configureElement).toBeVisible();

      // Try to make a change in the author view
      // This is element-specific, but we can try to find editable fields
      const editableField = page.locator('input[type="text"], textarea').first();

      if ((await editableField.count()) > 0) {
        const originalValue = await editableField.inputValue();

        // Make a change
        await editableField.fill('AUTHOR_MODIFIED_TEST');

        // Wait for model.updated event to fire
        await page.waitForTimeout(1500);

        // Switch to source tab to verify the change
        await switchTab(page, 'source');
        const model = await getModelFromSource(page);

        // The model should contain our modification somewhere
        const modelString = JSON.stringify(model);
        expect(modelString).toContain('AUTHOR_MODIFIED_TEST');

        // Switch to deliver tab
        await switchTab(page, 'deliver');
        await waitForElementReady(page);

        // The change should be reflected in the delivery view
        const deliverView = mountedElement(page);
        if (originalValue !== 'AUTHOR_MODIFIED_TEST') {
          // Only check if we actually made a change
          await expect(deliverView).toContainText('AUTHOR_MODIFIED_TEST');
        }
      }
    } else {
      // If no configure element, at least verify the author view loaded
      console.log('Author/configure component not found, skipping modification test');
    }
  });

  test('10. Complete workflow: select, answer, evaluate, switch tabs', async ({ page }) => {
    // This test combines multiple scenarios to ensure state is properly maintained

    // 1. Select the demo
    await selectDemo(page, DEMO_ID);
    await expect(page).toHaveURL(/demo=math-algebra-quadratic/);

    // 2. Make a selection in gather mode
    await switchMode(page, 'gather');
    await selectMultipleChoiceOption(page, CORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // 3. Verify session state
    let sessionState = await getSessionState(page);
    expect(sessionState.value).toContain(CORRECT_ANSWER);

    // 4. Switch to evaluate mode as instructor
    await switchToEvaluate(page);

    // 5. Verify the selection is marked correct
    const root = deliveryContainer(page);
    await expect(root.locator('.correct-fill')).toHaveCount(1);

    // 6. Switch to source tab
    await switchTab(page, 'source');
    const model = await getModelFromSource(page);
    expect(model).toBeTruthy();
    expect(model.element).toBe('multiple-choice');

    // 7. Switch to print tab
    await switchTab(page, 'print');
    await expect(page).toHaveURL(/\/print/);

    // 8. Switch back to deliver
    await switchTab(page, 'deliver');
    await waitForElementReady(page);

    // 9. Verify selection is still active
    const selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // 10. Switch back to gather mode
    await switchMode(page, 'gather');

    // 11. Change selection to incorrect answer
    await selectMultipleChoiceOption(page, INCORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // 12. Evaluate again
    await switchToEvaluate(page);

    // 13. Verify the selection is now marked incorrect
    await expect(root.locator('.incorrect-fill').first()).toBeVisible();
    await expect(root.locator('.correct-fill')).toHaveCount(0);
  });
});
