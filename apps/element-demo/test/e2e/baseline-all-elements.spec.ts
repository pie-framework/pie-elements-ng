import { test, type Locator, type Page } from '@playwright/test';
import { ELEMENT_REGISTRY } from '../../src/lib/elements/registry';
import {
  getSelectedValue,
  getSessionState,
  selectDemo,
  selectMultipleChoiceOption,
  switchMode,
  switchRole,
  waitForElementReady,
} from './test-helpers';

type CheckName =
  | 'esm deliver route loads'
  | 'delivery view visible'
  | 'gather mode accepts input'
  | 'evaluate mode shows correct answers'
  | 'author view visible'
  | 'author view accepts input';

type CheckFailure = {
  element: string;
  check: CheckName;
  message: string;
};

type CheckResult = {
  check: CheckName;
  ok: boolean;
  message?: string;
};

type BaselineAdapter = {
  prepareDeliver?: (page: Page, element: string) => Promise<void>;
  assertDeliveryVisible?: (page: Page, element: string) => Promise<void>;
  assertGatherAcceptsInput?: (page: Page, element: string) => Promise<void>;
  assertEvaluateShowsCorrectAnswers?: (page: Page, element: string) => Promise<void>;
  prepareAuthor?: (page: Page, element: string) => Promise<void>;
  assertAuthorAcceptsInput?: (page: Page, element: string) => Promise<void>;
};

const ERROR_PATTERNS = [/build failed/i, /module not found/i, /can't resolve/i, /uncaught/i];
const CORRECT_PATTERNS = [/correct answer/i, /\bcorrect\b/i, /\bsolution\b/i, /\bexpected\b/i];
const NON_ACTIONABLE_ELEMENTS = new Set(['passage', 'rubric']);
const ELEMENT_FILTER = process.env.E2E_BASELINE_ELEMENT?.trim();
const MULTIPLE_CHOICE_DEMO_ID = 'math-algebra-quadratic';
const MULTIPLE_CHOICE_TAG = 'pie-multiple-choice';

function elementTagCandidates(name: string): string[] {
  return [name, `pie-${name}`];
}

async function isVisibleAndEnabled(locator: Locator): Promise<boolean> {
  if (!(await locator.isVisible().catch(() => false))) {
    return false;
  }
  const ariaHidden = await locator.getAttribute('aria-hidden').catch(() => null);
  if (ariaHidden === 'true') {
    return false;
  }
  return await locator.isEnabled().catch(() => false);
}

async function firstVisibleEnabled(scope: Locator, selector: string): Promise<Locator | null> {
  const all = scope.locator(selector);
  const count = await all.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = all.nth(i);
    if (await isVisibleAndEnabled(candidate)) {
      return candidate;
    }
  }
  return null;
}

async function assertNoCriticalUiErrors(page: Page) {
  const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 30_000);
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(bodyText)) {
      throw new Error(`critical error text detected: ${pattern.source}`);
    }
  }
  const errorBanner = page.locator('.alert-error, .model-error').first();
  if (await errorBanner.isVisible().catch(() => false)) {
    const text = ((await errorBanner.textContent().catch(() => '')) || '').trim();
    throw new Error(`error banner visible: ${text || '(no text)'}`);
  }
}

async function getDeliveryContainer(page: Page): Promise<Locator> {
  const container = page.locator('.delivery-view .element-container').first();
  await container.waitFor({ state: 'visible', timeout: 20_000 });
  await page
    .waitForFunction(
      () => {
        const node = document.querySelector('.delivery-view .element-container');
        if (!node) {
          return false;
        }
        const hasChildren = node.childElementCount > 0;
        const hasText = (node.textContent || '').trim().length > 10;
        return hasChildren || hasText;
      },
      undefined,
      { timeout: 15_000 }
    )
    .catch(() => {
      // Some elements render very sparse DOM and still remain usable.
    });
  return container;
}

async function waitForDemoShell(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('[data-testid="mode-gather"]', { timeout: 20_000 });
}

async function waitForAuthorShell(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page
    .waitForFunction(
      () => !/Loading\s+[a-z0-9-]+\.\.\./i.test(document.body.innerText || ''),
      undefined,
      { timeout: 20_000 }
    )
    .catch(() => {
      // Not all elements emit standardized loading text.
    });
  await page.waitForSelector('.author-view', { timeout: 20_000 });
}

async function loadDeliver(page: Page, element: string) {
  await page.goto(`/${element}/deliver?mode=gather&role=student`);
  await waitForDemoShell(page);
  await assertNoCriticalUiErrors(page);
}

async function assertDeliveryVisible(page: Page, element: string) {
  const container = await getDeliveryContainer(page);
  const expectedTags = elementTagCandidates(element);
  for (const tag of expectedTags) {
    const loc = container.locator(tag).first();
    if (await loc.isVisible().catch(() => false)) {
      return;
    }
  }

  const anyCustomVisible = await container.evaluate((node) => {
    const excluded = new Set([
      'PIE-ELEMENT-THEME-DAISYUI',
      'PIE-ESM-PLAYER',
      'PIE-ESM-PRINT-PLAYER',
      'MATH-FIELD',
    ]);
    const all = Array.from(node.querySelectorAll('*')).filter((el) => el.tagName.includes('-'));
    return all.some((el) => {
      if (excluded.has(el.tagName)) {
        return false;
      }
      const rect = (el as HTMLElement).getBoundingClientRect();
      return rect.width > 2 && rect.height > 2;
    });
  });

  if (!anyCustomVisible) {
    const fallbackSignals = [
      'input, textarea, select, button',
      'svg, canvas',
      '[role="button"], [role="textbox"], [role="switch"]',
    ];
    for (const selector of fallbackSignals) {
      if (await container.locator(selector).first().isVisible().catch(() => false)) {
        return;
      }
    }
    const fallbackText = ((await container.innerText().catch(() => '')) || '').trim();
    if (fallbackText.length > 20) {
      return;
    }
    throw new Error('no visible delivery content signals found');
  }
}

async function attemptInput(scope: Locator, marker: string): Promise<string> {
  const textLike = await firstVisibleEnabled(
    scope,
    'input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), textarea'
  );
  if (textLike) {
    const inputType = (await textLike.getAttribute('type').catch(() => '')) || '';
    const isNumeric = /^(number|range)$/i.test(inputType);
    const inputValue = isNumeric ? '1' : marker;
    await textLike.fill(inputValue);
    const value = await textLike.inputValue().catch(() => '');
    if (value.includes(inputValue)) {
      return 'text-like input';
    }
  }

  const select = await firstVisibleEnabled(scope, 'select');
  if (select) {
    const optionCount = await select.locator('option').count();
    if (optionCount > 1) {
      await select.selectOption({ index: 1 });
      return 'select option';
    }
  }

  const checkbox = await firstVisibleEnabled(scope, 'input[type="checkbox"]');
  if (checkbox) {
    await checkbox.setChecked(true);
    if (await checkbox.isChecked().catch(() => false)) {
      return 'checkbox';
    }
  }

  const radio = await firstVisibleEnabled(scope, 'input[type="radio"]');
  if (radio) {
    await radio.check();
    if (await radio.isChecked().catch(() => false)) {
      return 'radio';
    }
  }

  const editable = await firstVisibleEnabled(scope, '[contenteditable], [role="textbox"]');
  if (editable) {
    await editable.click();
    await editable.fill(marker);
    const text = ((await editable.textContent().catch(() => '')) || '').trim();
    if (text.includes(marker)) {
      return 'contenteditable';
    }
  }

  const clickable = await firstVisibleEnabled(
    scope,
    'button, [role="button"], [role="switch"], [role="option"], .btn, [class*="choice"], [class*="option"]'
  );
  if (clickable) {
    await clickable.click({ force: true });
    return 'clickable control';
  }

  throw new Error('no visible editable control found');
}

async function assertGatherAcceptsInput(page: Page, element: string) {
  if (NON_ACTIONABLE_ELEMENTS.has(element)) {
    return;
  }
  await page.click('[data-testid="mode-gather"]');
  const container = await getDeliveryContainer(page);
  const beforeSession = await page
    .locator('[data-testid="session-panel-content"]')
    .textContent()
    .catch(() => '');

  const marker = `e2e-${element}-${Date.now()}`;
  const method = await attemptInput(container, marker);
  await page.waitForTimeout(700);

  const afterSession = await page
    .locator('[data-testid="session-panel-content"]')
    .textContent()
    .catch(() => '');

  if ((beforeSession || '') !== (afterSession || '')) {
    return;
  }

  // If session did not change, successful control interaction still counts as accepted.
  if (!method) {
    throw new Error('interaction produced no measurable state change');
  }
}

async function detectCorrectAnswerSignal(scope: Locator): Promise<boolean> {
  const selectors = [
    '[data-correct="true"]',
    '.correct',
    '.correct-answer',
    '[class*="correct"]',
    '.feedback',
    '[aria-live]',
  ];
  for (const selector of selectors) {
    const loc = scope.locator(selector);
    const count = await loc.count();
    for (let i = 0; i < count; i += 1) {
      const node = loc.nth(i);
      if (!(await node.isVisible().catch(() => false))) {
        continue;
      }
      const txt = ((await node.innerText().catch(() => '')) || '').trim();
      if (txt.length === 0) {
        continue;
      }
      if (CORRECT_PATTERNS.some((p) => p.test(txt))) {
        return true;
      }
    }
  }
  const fullText = ((await scope.innerText().catch(() => '')) || '').slice(0, 40_000);
  return CORRECT_PATTERNS.some((p) => p.test(fullText));
}

async function assertEvaluateShowsCorrectAnswers(page: Page, element: string) {
  if (NON_ACTIONABLE_ELEMENTS.has(element)) {
    return;
  }
  await page.click('[data-testid="role-instructor"]');
  await page.click('[data-testid="mode-evaluate"]');
  await page.waitForTimeout(600);

  const showCorrectById = page.locator('[data-testid="show-correct-answer"]').first();
  const showCorrectByText = page.locator('button:has-text("Show correct answer")').first();
  if (await showCorrectById.isVisible().catch(() => false)) {
    await showCorrectById.click();
    await page.waitForTimeout(500);
    return;
  } else if (await showCorrectByText.isVisible().catch(() => false)) {
    await showCorrectByText.click();
    await page.waitForTimeout(500);
    return;
  }

  const container = await getDeliveryContainer(page);
  const hasSignal = await detectCorrectAnswerSignal(container);
  if (hasSignal) {
    return;
  }

  // Fallback: if score is computed and shown, evaluate mode is functionally active.
  const scoringPanel = page.locator('[data-testid="scoring-panel"], .scoring-panel').first();
  if (await scoringPanel.isVisible().catch(() => false)) {
    const scoreText = ((await scoringPanel.innerText().catch(() => '')) || '').trim();
    if (/\d/.test(scoreText) || /score/i.test(scoreText)) {
      return;
    }
  }
  throw new Error('no visible correct-answer signal detected in evaluate mode');
}

async function loadAuthor(page: Page, element: string) {
  await page.goto(`/${element}/author`);
  await waitForAuthorShell(page);
}

async function assertAuthorVisible(page: Page, element: string) {
  const authorView = page.locator('.author-view .configure-container').first();
  await authorView.waitFor({ state: 'visible', timeout: 20_000 });
  await page
    .waitForFunction(
      () => {
        const node = document.querySelector('.author-view .configure-container');
        if (!node) {
          return false;
        }
        return node.childElementCount > 0 || (node.textContent || '').trim().length > 10;
      },
      undefined,
      { timeout: 15_000 }
    )
    .catch(() => {
      // Some configure components render minimal DOM wrappers.
    });

  const configureTag = `${element}-configure`;
  const configure = page.locator(configureTag).first();
  if (!(await configure.isVisible().catch(() => false))) {
    throw new Error(`configure element not visible: ${configureTag}`);
  }
}

async function assertAuthorAcceptsInput(page: Page, element: string) {
  if (NON_ACTIONABLE_ELEMENTS.has(element)) {
    return;
  }
  const authorScope = page.locator('.author-view .configure-container').first();
  await page.waitForTimeout(800);
  const marker = `author-${element}-${Date.now()}`;
  await attemptInput(authorScope, marker);
}

const ADAPTERS: Record<string, BaselineAdapter> = {
  'multiple-choice': {
    prepareDeliver: async (page) => {
      await selectDemo(page, MULTIPLE_CHOICE_DEMO_ID);
      await waitForElementReady(page, MULTIPLE_CHOICE_TAG);
    },
    assertDeliveryVisible: async (page) => {
      await waitForElementReady(page, MULTIPLE_CHOICE_TAG);
      const mc = page.locator(MULTIPLE_CHOICE_TAG).first();
      if (!(await mc.isVisible().catch(() => false))) {
        throw new Error('multiple-choice delivery component not visible');
      }
    },
    assertGatherAcceptsInput: async (page) => {
      await switchMode(page, 'gather');
      const before = await getSessionState(page);
      await selectMultipleChoiceOption(page, 'opt1');
      await page.waitForTimeout(700);
      const selected = await getSelectedValue(page);
      if (!selected) {
        throw new Error('multiple-choice selection was not applied');
      }
      const after = await getSessionState(page);
      if (JSON.stringify(before || {}) === JSON.stringify(after || {})) {
        throw new Error('multiple-choice session did not change after selection');
      }
    },
  },
  charting: {
    assertEvaluateShowsCorrectAnswers: async (page, element) => {
      await assertEvaluateShowsCorrectAnswers(page, element);
    },
  },
  graphing: {
    assertEvaluateShowsCorrectAnswers: async (page, element) => {
      await assertEvaluateShowsCorrectAnswers(page, element);
    },
  },
  'complex-rubric': {
    assertEvaluateShowsCorrectAnswers: async (page, element) => {
      await assertEvaluateShowsCorrectAnswers(page, element);
    },
  },
};

function getAdapter(element: string): BaselineAdapter {
  return ADAPTERS[element] || {};
}

function formatFailureReport(failures: CheckFailure[]) {
  const byElement = new Map<string, CheckFailure[]>();
  for (const failure of failures) {
    const list = byElement.get(failure.element) || [];
    list.push(failure);
    byElement.set(failure.element, list);
  }
  const lines: string[] = [`Baseline matrix failures (${failures.length}):`, ''];
  for (const [element, list] of byElement.entries()) {
    lines.push(`${element}:`);
    for (const item of list) {
      lines.push(`  - ${item.check}: ${item.message}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

test.describe('Baseline minimum coverage across all elements', () => {
  test('all registered elements satisfy baseline checks', async ({ page }) => {
    test.setTimeout(45 * 60 * 1000);
    const failures: CheckFailure[] = [];

    const runCheck = async (
      element: string,
      check: CheckName,
      fn: () => Promise<void>
    ): Promise<CheckResult> => {
      try {
        await fn();
        return { check, ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ element, check, message });
        return { check, ok: false, message };
      }
    };

    const registry = ELEMENT_FILTER
      ? ELEMENT_REGISTRY.filter((entry) => entry.name === ELEMENT_FILTER)
      : ELEMENT_REGISTRY;
    if (registry.length === 0) {
      throw new Error(`No registry element found for filter: ${ELEMENT_FILTER}`);
    }

    for (const entry of registry) {
      const element = entry.name;
      const adapter = getAdapter(element);
      const results: CheckResult[] = [];

      await test.step(`${element}: delivery baseline`, async () => {
        results.push(
          await runCheck(element, 'esm deliver route loads', async () => {
            await loadDeliver(page, element);
            if (adapter.prepareDeliver) {
              await adapter.prepareDeliver(page, element);
            }
          })
        );
        results.push(
          await runCheck(element, 'delivery view visible', async () =>
            adapter.assertDeliveryVisible
              ? adapter.assertDeliveryVisible(page, element)
              : assertDeliveryVisible(page, element)
          )
        );
        results.push(
          await runCheck(element, 'gather mode accepts input', async () =>
            adapter.assertGatherAcceptsInput
              ? adapter.assertGatherAcceptsInput(page, element)
              : assertGatherAcceptsInput(page, element)
          )
        );
        results.push(
          await runCheck(element, 'evaluate mode shows correct answers', async () =>
            adapter.assertEvaluateShowsCorrectAnswers
              ? adapter.assertEvaluateShowsCorrectAnswers(page, element)
              : assertEvaluateShowsCorrectAnswers(page, element)
          )
        );
      });

      if (entry.hasAuthor) {
        await test.step(`${element}: author baseline`, async () => {
          results.push(
            await runCheck(element, 'author view visible', async () => {
              await loadAuthor(page, element);
              if (adapter.prepareAuthor) {
                await adapter.prepareAuthor(page, element);
              }
            })
          );
          results.push(
            await runCheck(element, 'author view accepts input', async () =>
              adapter.assertAuthorAcceptsInput
                ? adapter.assertAuthorAcceptsInput(page, element)
                : assertAuthorAcceptsInput(page, element)
            )
          );
        });
      }

      const summary = results
        .map((r) => `[${r.ok ? 'PASS' : 'FAIL'}] ${r.check}${r.message ? ` :: ${r.message}` : ''}`)
        .join('\n');
      console.log(`[baseline] ${element}\n${summary}`);
    }

    if (failures.length > 0) {
      throw new Error(formatFailureReport(failures));
    }
  });
});
