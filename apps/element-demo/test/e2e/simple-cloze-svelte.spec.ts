import { test, expect, type Page } from '@playwright/test';
import {
  waitForMathRendering,
  selectDemo,
  switchMode,
  switchRole,
  getSessionState,
  switchTab,
  getModelFromSource,
  updateModelInSource,
  waitForElementReady,
} from './test-helpers';

/**
 * Comprehensive browser tests for simple-cloze (Svelte 5) element
 * Tests author view with EditableHtml (Tiptap), delivery, and tab synchronization
 */

const DEMO_ID = 'basic';
const ELEMENT_NAME = 'simple-cloze';
const CORRECT_ANSWER = 'photosynthesis'; // Based on typical cloze demo

test.describe('Simple Cloze (Svelte 5) - Author and Delivery', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to simple-cloze element demo page
    await page.goto('/simple-cloze/deliver');
    await page.waitForLoadState('networkidle');

    // Wait for the element to be ready
    await waitForElementReady(page, ELEMENT_NAME);
  });

  test('1. Demo loads correctly on delivery tab', async ({ page }) => {
    // Verify we're on the deliver page
    await expect(page).toHaveURL(/\/deliver/);

    // Verify the element is rendered
    const element = page.locator(ELEMENT_NAME);
    await expect(element).toBeVisible();

    // Verify prompt is displayed
    const prompt = element.locator('.prompt, [class*="prompt"]');
    if ((await prompt.count()) > 0) {
      await expect(prompt.first()).toBeVisible();
    }

    // Verify input field exists
    const input = element.locator('input[type="text"], input[type*="text"]');
    await expect(input.first()).toBeVisible();
  });

  test('2. Author tab loads and shows EditableHtml with toolbar', async ({ page }) => {
    // Switch to author tab
    await switchTab(page, 'author');
    await expect(page).toHaveURL(/\/author/);

    // Wait for author view to load
    await page.waitForTimeout(1000);

    // Verify DaisyUI form controls are present
    const formControl = page.locator('.form-control');
    await expect(formControl.first()).toBeVisible();

    // Verify "Prompt" label exists
    const promptLabel = page.locator('.label-text:has-text("Prompt")');
    await expect(promptLabel).toBeVisible();

    // Verify EditableHtml component is rendered
    const editableHtml = page.locator('.editable-html');
    await expect(editableHtml).toBeVisible();

    // Verify toolbar is present
    const toolbar = page.locator('.toolbar');
    await expect(toolbar).toBeVisible();

    // Verify toolbar has correct background color (#f5f5f5)
    const toolbarBg = await toolbar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(toolbarBg).toBe('rgb(245, 245, 245)'); // #f5f5f5

    // Verify all toolbar buttons are present
    const boldButton = page.locator('.toolbar button[title="Bold"]');
    const italicButton = page.locator('.toolbar button[title="Italic"]');
    const underlineButton = page.locator('.toolbar button[title="Underline"]');
    const bulletListButton = page.locator('.toolbar button[title="Bullet List"]');
    const numberedListButton = page.locator('.toolbar button[title="Numbered List"]');

    await expect(boldButton).toBeVisible();
    await expect(italicButton).toBeVisible();
    await expect(underlineButton).toBeVisible();
    await expect(bulletListButton).toBeVisible();
    await expect(numberedListButton).toBeVisible();

    // Verify divider is present between text formatting and list buttons
    const divider = page.locator('.toolbar .divider');
    await expect(divider).toBeVisible();

    // Verify ProseMirror editor is present
    const proseMirror = page.locator('.ProseMirror');
    await expect(proseMirror).toBeVisible();

    // Verify "Correct Answer" input is present
    const answerLabel = page.locator('.label-text:has-text("Correct Answer")');
    await expect(answerLabel).toBeVisible();

    const answerInput = page.locator('input.input');
    await expect(answerInput).toBeVisible();
  });

  test('3. EditableHtml toolbar buttons work correctly', async ({ page }) => {
    await switchTab(page, 'author');
    await page.waitForTimeout(1000);

    const proseMirror = page.locator('.ProseMirror');
    await expect(proseMirror).toBeVisible();

    // Clear any existing content and type test text
    await proseMirror.click();
    await proseMirror.press('Control+A');
    await proseMirror.press('Backspace');
    await proseMirror.type('Test text for formatting');

    // Select all text
    await proseMirror.press('Control+A');

    // Test Bold button
    const boldButton = page.locator('.toolbar button[title="Bold"]');
    await boldButton.click();
    await page.waitForTimeout(300);

    // Verify bold tag is present
    let boldText = proseMirror.locator('strong, b');
    await expect(boldText).toBeVisible();

    // Test Italic button
    await proseMirror.press('Control+A');
    const italicButton = page.locator('.toolbar button[title="Italic"]');
    await italicButton.click();
    await page.waitForTimeout(300);

    // Verify italic tag is present
    let italicText = proseMirror.locator('em, i');
    await expect(italicText).toBeVisible();

    // Test Underline button
    await proseMirror.press('Control+A');
    const underlineButton = page.locator('.toolbar button[title="Underline"]');
    await underlineButton.click();
    await page.waitForTimeout(300);

    // Verify underline tag is present
    let underlineText = proseMirror.locator('u');
    await expect(underlineText).toBeVisible();
  });

  test('4. EditableHtml list buttons work correctly', async ({ page }) => {
    await switchTab(page, 'author');
    await page.waitForTimeout(1000);

    const proseMirror = page.locator('.ProseMirror');
    await expect(proseMirror).toBeVisible();

    // Clear content and type new text
    await proseMirror.click();
    await proseMirror.press('Control+A');
    await proseMirror.press('Backspace');
    await proseMirror.type('First item');

    // Click bullet list button
    const bulletListButton = page.locator('.toolbar button[title="Bullet List"]');
    await bulletListButton.click();
    await page.waitForTimeout(300);

    // Verify bullet list is created
    let bulletList = proseMirror.locator('ul');
    await expect(bulletList).toBeVisible();

    // Add another item
    await proseMirror.press('Enter');
    await proseMirror.type('Second item');
    await page.waitForTimeout(300);

    // Verify two list items exist
    let listItems = proseMirror.locator('li');
    expect(await listItems.count()).toBeGreaterThanOrEqual(2);

    // Clear and test numbered list
    await proseMirror.press('Control+A');
    await proseMirror.press('Backspace');
    await proseMirror.type('First numbered item');

    const numberedListButton = page.locator('.toolbar button[title="Numbered List"]');
    await numberedListButton.click();
    await page.waitForTimeout(300);

    // Verify ordered list is created
    let orderedList = proseMirror.locator('ol');
    await expect(orderedList).toBeVisible();
  });

  test('5. Changes in author view reflect in source and deliver tabs', async ({ page }) => {
    await switchTab(page, 'author');
    await page.waitForTimeout(1000);

    const proseMirror = page.locator('.ProseMirror');
    await proseMirror.click();
    await proseMirror.press('Control+A');
    await proseMirror.press('Backspace');

    // Type a unique test prompt
    const testPrompt = 'AUTHOR_TEST_PROMPT_' + Date.now();
    await proseMirror.type(testPrompt);
    await page.waitForTimeout(1500); // Wait for onChange to fire

    // Update correct answer field
    const answerInput = page.locator('input.input');
    await answerInput.fill('test_answer_123');
    await page.waitForTimeout(1000);

    // Switch to source tab to verify changes
    await switchTab(page, 'source');
    const model = await getModelFromSource(page);
    expect(model).toBeTruthy();

    // Verify prompt contains our test text
    expect(model.prompt).toContain(testPrompt);

    // Verify correct answer was updated
    expect(model.correctAnswer).toBe('test_answer_123');

    // Switch to deliver tab to verify changes render
    await switchTab(page, 'deliver');
    await waitForElementReady(page, ELEMENT_NAME);
    await page.waitForTimeout(1000);

    // Verify the prompt is displayed in delivery view
    const element = page.locator(ELEMENT_NAME);
    await expect(element).toContainText(testPrompt);
  });

  test('6. Switching tabs maintains session state on deliver tab', async ({ page }) => {
    // Start on deliver tab in gather mode
    await switchMode(page, 'gather');

    // Enter an answer
    const input = page.locator(`${ELEMENT_NAME} input[type="text"]`).first();
    await input.fill('student_answer_test');
    await page.waitForTimeout(1000);

    // Verify session state
    let sessionState = await getSessionState(page);
    expect(sessionState).toBeTruthy();
    expect(sessionState.response).toBe('student_answer_test');

    // Switch to author tab and back
    await switchTab(page, 'author');
    await page.waitForTimeout(500);
    await switchTab(page, 'deliver');
    await waitForElementReady(page, ELEMENT_NAME);

    // Verify answer is still there
    const inputAfter = page.locator(`${ELEMENT_NAME} input[type="text"]`).first();
    expect(await inputAfter.inputValue()).toBe('student_answer_test');
  });

  test('7. Print tab renders correctly', async ({ page }) => {
    // Switch to print tab
    await switchTab(page, 'print');
    await expect(page).toHaveURL(/\/print/);

    // Wait for print view to load
    await page.waitForTimeout(1000);

    // Verify print player or print content is present
    const printPlayer = page.locator('pie-esm-print-player');
    const printContent = page.locator('[data-testid="print-view"]');

    const hasPrintPlayer = (await printPlayer.count()) > 0;
    const hasPrintContent = (await printContent.count()) > 0;

    expect(hasPrintPlayer || hasPrintContent).toBeTruthy();

    if (hasPrintPlayer) {
      await expect(printPlayer).toBeVisible();
    }
  });

  test('8. Material Design styling is applied to EditableHtml', async ({ page }) => {
    await switchTab(page, 'author');
    await page.waitForTimeout(1000);

    const editableHtml = page.locator('.editable-html');
    await expect(editableHtml).toBeVisible();

    // Verify border styling
    const border = await editableHtml.evaluate((el) => window.getComputedStyle(el).border);
    expect(border).toContain('rgb(224, 224, 224)'); // #e0e0e0 border color

    // Verify border radius
    const borderRadius = await editableHtml.evaluate(
      (el) => window.getComputedStyle(el).borderRadius
    );
    expect(borderRadius).toBe('4px');

    // Verify toolbar styling
    const toolbar = page.locator('.toolbar');
    const toolbarBg = await toolbar.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(toolbarBg).toBe('rgb(245, 245, 245)'); // #f5f5f5

    // Verify toolbar border
    const toolbarBorder = await toolbar.evaluate((el) => window.getComputedStyle(el).borderBottom);
    expect(toolbarBorder).toContain('rgb(224, 224, 224)'); // #e0e0e0

    // Verify button styling
    const button = page.locator('.toolbar button').first();
    const buttonBg = await button.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    expect(buttonBg).toBe('rgba(0, 0, 0, 0)'); // transparent

    const buttonBorderRadius = await button.evaluate(
      (el) => window.getComputedStyle(el).borderRadius
    );
    expect(buttonBorderRadius).toBe('4px');

    // Verify ProseMirror styling
    const proseMirror = page.locator('.ProseMirror');
    const proseMirrorFont = await proseMirror.evaluate(
      (el) => window.getComputedStyle(el).fontFamily
    );
    expect(proseMirrorFont).toMatch(/system|apple|BlinkMacSystemFont|Segoe UI|Roboto/i);

    const proseMirrorFontSize = await proseMirror.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    );
    expect(proseMirrorFontSize).toBe('14px');
  });

  test('9. EditableHtml button hover states work', async ({ page }) => {
    await switchTab(page, 'author');
    await page.waitForTimeout(1000);

    const boldButton = page.locator('.toolbar button[title="Bold"]');
    await expect(boldButton).toBeVisible();

    // Get initial background color
    const initialBg = await boldButton.evaluate(
      (el) => window.getComputedStyle(el).backgroundColor
    );
    expect(initialBg).toBe('rgba(0, 0, 0, 0)'); // transparent

    // Hover over button
    await boldButton.hover();
    await page.waitForTimeout(200); // Wait for CSS transition

    // Background should change on hover (rgba(0, 0, 0, 0.04))
    const hoverBg = await boldButton.evaluate((el) => window.getComputedStyle(el).backgroundColor);

    // The hover state should be different from initial
    // Note: exact value might vary due to CSS transitions
    expect(hoverBg).not.toBe(initialBg);
  });

  test('10. Complete workflow: configure in author, view in deliver, verify in source', async ({
    page,
  }) => {
    // Step 1: Configure in author view
    await switchTab(page, 'author');
    await page.waitForTimeout(1000);

    const proseMirror = page.locator('.ProseMirror');
    await proseMirror.click();
    await proseMirror.press('Control+A');
    await proseMirror.press('Backspace');

    // Add formatted content
    const uniqueId = Date.now();
    await proseMirror.type(`Complete workflow test ${uniqueId}`);
    await proseMirror.press('Control+A');

    // Make it bold
    const boldButton = page.locator('.toolbar button[title="Bold"]');
    await boldButton.click();
    await page.waitForTimeout(500);

    // Add correct answer
    const answerInput = page.locator('input.input');
    await answerInput.fill(`workflow_answer_${uniqueId}`);
    await page.waitForTimeout(1500);

    // Step 2: Verify in source
    await switchTab(page, 'source');
    let model = await getModelFromSource(page);
    expect(model.prompt).toContain(`Complete workflow test ${uniqueId}`);
    expect(model.prompt).toContain('<strong>'); // Bold formatting
    expect(model.correctAnswer).toBe(`workflow_answer_${uniqueId}`);

    // Step 3: View in deliver
    await switchTab(page, 'deliver');
    await waitForElementReady(page, ELEMENT_NAME);
    await page.waitForTimeout(1000);

    const element = page.locator(ELEMENT_NAME);
    await expect(element).toContainText(`Complete workflow test ${uniqueId}`);

    // Step 4: Enter an answer in gather mode
    await switchMode(page, 'gather');
    const input = element.locator('input[type="text"]').first();
    await input.fill(`workflow_answer_${uniqueId}`);
    await page.waitForTimeout(1000);

    // Step 5: Verify session state
    const sessionState = await getSessionState(page);
    expect(sessionState.response).toBe(`workflow_answer_${uniqueId}`);

    // Step 6: Switch to evaluate mode and verify (if scoring is implemented)
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    await page.waitForTimeout(1000);

    // The element should show some evaluation state
    await expect(element).toBeVisible();
  });
});
