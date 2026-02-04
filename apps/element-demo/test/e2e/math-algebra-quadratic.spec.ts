import { test, expect, type Page } from '@playwright/test';
import {
  waitForMathRendering,
  selectDemo,
  switchMode,
  switchRole,
  getSessionState,
  selectMultipleChoiceOption,
  getScore,
  switchTab,
  getModelFromSource,
  updateModelInSource,
  waitForElementReady,
  getMultipleChoiceOptions,
  getSelectedValue,
} from './test-helpers';

/**
 * Comprehensive browser tests for math-algebra-quadratic demo
 * Tests state management, mode/role switching, scoring, and tab synchronization
 */

const DEMO_ID = 'math-algebra-quadratic';
const ELEMENT_NAME = 'pie-multiple-choice';
const CORRECT_ANSWER = 'opt2'; // The correct quadratic formula
const INCORRECT_ANSWER = 'opt1'; // Incorrect formula with wrong discriminant sign

test.describe('Math Algebra Quadratic Demo - Multiple Choice Element', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to multiple-choice element demo page
    await page.goto('/multiple-choice/deliver');
    await page.waitForLoadState('networkidle');

    // Wait for the element to be ready
    await waitForElementReady(page, ELEMENT_NAME);
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
    await waitForElementReady(page, ELEMENT_NAME);
    await waitForMathRendering(page);

    // Verify the URL contains the demo parameter
    expect(page.url()).toContain(`demo=${DEMO_ID}`);

    // Verify the prompt is displayed (contains "quadratic formula")
    const prompt = page.locator('pie-multiple-choice');
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

  test('4. In evaluate mode as instructor, correct answer is marked and "Show correct answer" button works', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    // Make a selection (any answer)
    await switchMode(page, 'gather');
    await selectMultipleChoiceOption(page, INCORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // Switch to instructor role and evaluate mode
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');

    // Check if "Show correct answer" button exists
    const showCorrectButton = page.locator('[data-testid="show-correct-answer"]');

    // If button doesn't exist with data-testid, try finding by text
    const buttonByText = page.locator('button:has-text("Show correct answer")');
    const button = (await showCorrectButton.count()) > 0 ? showCorrectButton : buttonByText;

    if ((await button.count()) > 0) {
      // Verify button is visible
      await expect(button.first()).toBeVisible();

      // Click the button
      await button.first().click();
      await page.waitForTimeout(1000);

      // Verify correct answer is now shown/highlighted
      // The correct answer should be visible in the element
      const correctChoice = page.locator(`pie-multiple-choice [data-value="${CORRECT_ANSWER}"]`);
      if ((await correctChoice.count()) > 0) {
        await expect(correctChoice.first()).toBeVisible();
      }
    }

    // Check for correct answer indicator/marking
    // Multiple choice elements typically show which answer is correct in evaluate mode
    const multipleChoice = page.locator(ELEMENT_NAME);
    await expect(multipleChoice).toBeVisible();

    // The element should show feedback or marking
    const feedbackOrMarking = page.locator('.correct, [data-correct="true"], .feedback');
    // At least some feedback/marking should be present
    expect(await feedbackOrMarking.count()).toBeGreaterThan(0);
  });

  test('5. Incorrect selection in evaluate mode shows score of 0', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    // Select incorrect answer
    await switchMode(page, 'gather');
    await selectMultipleChoiceOption(page, INCORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // Switch to evaluate mode as instructor
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    await page.waitForTimeout(1000);

    // Check the scoring panel for score
    const scoringPanel = page.locator('[data-testid="scoring-panel"]');

    if ((await scoringPanel.count()) > 0) {
      await expect(scoringPanel).toBeVisible();

      // Look for score display
      const scoreDisplay = page.locator('[data-testid="score-value"], .score');
      if ((await scoreDisplay.count()) > 0) {
        const scoreText = await scoreDisplay.first().textContent();
        expect(scoreText).toContain('0');
      }
    }

    // Also check if we can get score from helper function
    const score = await getScore(page);
    if (score !== null) {
      expect(score).toBe(0);
    }

    // Verify the element shows incorrect feedback
    const incorrectIndicator = page.locator('.incorrect, [data-correct="false"]');
    expect(await incorrectIndicator.count()).toBeGreaterThan(0);
  });

  test('6. Correct selection in evaluate mode shows score of 1', async ({ page }) => {
    await selectDemo(page, DEMO_ID);

    // Select correct answer
    await switchMode(page, 'gather');
    await selectMultipleChoiceOption(page, CORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // Switch to evaluate mode as instructor
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    await page.waitForTimeout(1000);

    // Check the scoring panel for score
    const scoringPanel = page.locator('[data-testid="scoring-panel"]');

    if ((await scoringPanel.count()) > 0) {
      await expect(scoringPanel).toBeVisible();

      // Look for score display showing 1
      const scoreDisplay = page.locator('[data-testid="score-value"], .score');
      if ((await scoreDisplay.count()) > 0) {
        const scoreText = await scoreDisplay.first().textContent();
        expect(scoreText).toContain('1');
      }
    }

    // Also check if we can get score from helper function
    const score = await getScore(page);
    if (score !== null) {
      expect(score).toBe(1);
    }

    // Verify the element shows correct feedback
    const correctIndicator = page.locator('.correct, [data-correct="true"]');
    expect(await correctIndicator.count()).toBeGreaterThan(0);
  });

  test('7. Switching between author, print, and source tabs works (session state not maintained)', async ({ page }) => {
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
    const printPlayer = page.locator('pie-esm-print-player');
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
    await waitForElementReady(page, ELEMENT_NAME);

    // Verify we're back on the delivery view
    const multipleChoice = page.locator(ELEMENT_NAME);
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

    // Switch to deliver tab
    await switchTab(page, 'deliver');
    await waitForElementReady(page, ELEMENT_NAME);
    await waitForMathRendering(page);

    // Verify the change is reflected
    const multipleChoice = page.locator(ELEMENT_NAME);
    await expect(multipleChoice).toContainText('MODIFIED');
    await expect(multipleChoice).toContainText('Test modification of prompt');

    // Switch to print tab and verify change there too
    await switchTab(page, 'print');
    const printView = page.locator('pie-esm-print-player, .print-view');
    if ((await printView.count()) > 0) {
      await expect(printView.first()).toContainText('MODIFIED');
    }

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
    const configureElement = page.locator('pie-multiple-choice-configure');

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
        await waitForElementReady(page, ELEMENT_NAME);

        // The change should be reflected in the delivery view
        const deliverView = page.locator(ELEMENT_NAME);
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
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');

    // 5. Verify score is 1
    await page.waitForTimeout(1000);
    const scoringPanel = page.locator('[data-testid="scoring-panel"], .scoring');
    if ((await scoringPanel.count()) > 0) {
      await expect(scoringPanel.first()).toContainText('1');
    }

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
    await waitForElementReady(page, ELEMENT_NAME);

    // 9. Verify selection is still active
    const selectedValue = await getSelectedValue(page);
    expect(selectedValue).toBe(CORRECT_ANSWER);

    // 10. Switch back to gather mode
    await switchMode(page, 'gather');

    // 11. Change selection to incorrect answer
    await selectMultipleChoiceOption(page, INCORRECT_ANSWER);
    await page.waitForTimeout(1000);

    // 12. Evaluate again
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    await page.waitForTimeout(1000);

    // 13. Verify score is now 0
    if ((await scoringPanel.count()) > 0) {
      const scoreText = await scoringPanel.first().textContent();
      expect(scoreText).toContain('0');
    }
  });
});
