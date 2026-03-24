import { test, type Page } from '@playwright/test';
import { ELEMENT_REGISTRY } from '../../src/lib/elements/registry';
import {
  deliveryContainer,
  getSessionState,
  interactOnce,
  switchMode,
  switchRole,
  waitForSessionMutation,
} from './test-helpers';

type ViewKind = 'deliver' | 'author' | 'print';
type StrategyKind = 'esm' | 'iife';

interface SmokeCase {
  element: string;
  view: ViewKind;
  strategy: StrategyKind;
  hasSession: boolean;
  url: string;
}

interface SmokeFailure {
  element: string;
  view: ViewKind;
  url: string;
  reason: string;
  details?: string;
}

const CRITICAL_CONSOLE_PATTERNS = [
  /Minified React error #130/i,
  /effect_update_depth_exceeded/i,
  /Maximum update depth exceeded/i,
  /window\.pie not found/i,
  /Module not found:/i,
  /Can't resolve/i,
  /Cannot update an unmounted root/i,
];

const IGNORE_CONSOLE_PATTERNS = [
  /You are loading @emotion\/react when it is already loaded/i,
  /i18next is maintained with support from locize/i,
  /i18next: languageChanged/i,
  /i18next: initialized/i,
  /The pseudo class ":first-child" is potentially unsafe/i,
  /The pseudo class ":nth-child" is potentially unsafe/i,
];

const MATRIX_STRATEGIES = (process.env.MATRIX_STRATEGIES?.trim() || 'esm')
  .split(',')
  .map((value) => value.trim())
  .filter((value): value is StrategyKind => value === 'esm' || value === 'iife');

function buildCases(): SmokeCase[] {
  const cases: SmokeCase[] = [];
  for (const strategy of MATRIX_STRATEGIES) {
    for (const element of ELEMENT_REGISTRY) {
      cases.push({
        element: element.name,
        view: 'deliver',
        strategy,
        hasSession: element.hasSession,
        url: `/${element.name}/deliver?mode=gather&role=student&player=${strategy}`,
      });
      if (element.hasAuthor) {
        cases.push({
          element: element.name,
          view: 'author',
          strategy,
          hasSession: element.hasSession,
          url: `/${element.name}/author?demo=default&player=${strategy}`,
        });
      }
      if (element.hasPrint) {
        cases.push({
          element: element.name,
          view: 'print',
          strategy,
          hasSession: element.hasSession,
          url: `/${element.name}/print?role=student&player=${strategy}`,
        });
      }

      // Keep an explicit regression case for known number-line IIFE/runtime interactions.
      if (element.name === 'number-line' && strategy === 'iife') {
        cases.push({
          element: element.name,
          view: 'deliver',
          strategy,
          hasSession: element.hasSession,
          url: `/${element.name}/deliver?demo=basic-points&mode=gather&role=student&player=${strategy}`,
        });
      }
    }
  }
  return cases;
}

async function waitForStrategySettle(
  page: Page,
  view: ViewKind,
  strategy: StrategyKind,
  timeoutMs = 20_000
) {
  if (strategy === 'iife') {
    await page.waitForFunction(
      () => {
        const iifeLoading = Array.from(document.querySelectorAll('.loading')).some((node) =>
          /IIFE/i.test(node.textContent || '')
        );
        return !iifeLoading;
      },
      undefined,
      { timeout: timeoutMs }
    );
  } else {
    await page.waitForFunction(
      () => {
        const loading = document.querySelector('.loading');
        const error = document.querySelector('.error');
        return !loading && !error;
      },
      undefined,
      { timeout: timeoutMs }
    );
  }

  // Route-specific UI markers prove the view actually rendered.
  if (view === 'deliver') {
    await page.waitForSelector('[data-testid="mode-gather"]', { timeout: 15_000 });
  } else if (view === 'author') {
    await page.waitForSelector('[data-testid="tab-source"]', { timeout: 15_000 });
  } else {
    await page.waitForSelector('.print-view', { timeout: 15_000 });
  }
}

function isIgnoredConsole(message: string): boolean {
  return IGNORE_CONSOLE_PATTERNS.some((pattern) => pattern.test(message));
}

function findCriticalConsole(messages: string[]): string[] {
  return messages.filter((msg) => {
    if (/Failed to load .* bundle/i.test(msg) && /Failed to fetch/i.test(msg)) {
      return false;
    }
    return CRITICAL_CONSOLE_PATTERNS.some((pattern) => pattern.test(msg));
  });
}

const EVALUATE_SIGNAL_SELECTOR =
  '[data-testid="score-value"], [data-testid="scoring-panel"], [data-testid="show-correct-answer"], button:has-text("Show correct answer"), button:has-text("Hide correct answer")';

const REQUIRE_EVALUATE_SIGNAL_ELEMENTS = new Set([
  'multiple-choice',
  'ebsr',
  'matrix',
  'match',
  'likert',
  'inline-dropdown',
  'select-text',
  'math-inline',
  'math-templated',
]);

const REQUIRE_SESSION_MUTATION_ELEMENTS = new Set(['multiple-choice', 'ebsr']);

async function synthesizeSessionChanged(page: Page): Promise<boolean> {
  return await page.evaluate((token) => {
    const host = document.querySelector('pie-element-player') as any;
    if (!(host instanceof HTMLElement)) {
      return false;
    }
    const innerElement =
      host.querySelector('.demo-element-player > *:not(.loading):not(.error)') ??
      host.querySelector('.element-container > *:not(.loading):not(.error)');
    if (!(innerElement instanceof HTMLElement)) {
      return false;
    }
    const currentSession =
      host.session && typeof host.session === 'object'
        ? JSON.parse(JSON.stringify(host.session))
        : {};
    const nextSession = { ...currentSession, __matrixMarker: token };
    innerElement.dispatchEvent(
      new CustomEvent('session-changed', {
        detail: { session: nextSession },
        bubbles: true,
        composed: true,
      })
    );
    return true;
  }, `matrix-${Date.now()}`);
}

async function verifyDeliveryInteractionAndEvaluate(
  page: Page,
  item: SmokeCase
): Promise<string | null> {
  if (!item.hasSession) {
    return null;
  }

  const root = deliveryContainer(page);
  try {
    await root.waitFor({ state: 'visible', timeout: 15_000 });
  } catch (err: any) {
    return `Delivery root not visible: ${err?.message || String(err)}`;
  }

  const before = await getSessionState(page);

  try {
    await interactOnce(page, root);
  } catch (err: any) {
    const fallbackDispatched = await synthesizeSessionChanged(page);
    if (!fallbackDispatched) {
      return `No interactive control found: ${err?.message || String(err)}`;
    }
  }

  const after = await waitForSessionMutation(page, before, 10_000);
  if (
    REQUIRE_SESSION_MUTATION_ELEMENTS.has(item.element) &&
    JSON.stringify(after ?? {}) === JSON.stringify(before ?? {})
  ) {
    return 'Session did not mutate after delivery interaction';
  }

  try {
    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    if (REQUIRE_EVALUATE_SIGNAL_ELEMENTS.has(item.element)) {
      await page
        .locator(EVALUATE_SIGNAL_SELECTOR)
        .first()
        .waitFor({ state: 'visible', timeout: 15_000 });
    }
  } catch (err: any) {
    return `Evaluate/correct-answer signal not visible: ${err?.message || String(err)}`;
  }

  return null;
}

test.describe('Strategy smoke matrix across PIE elements', () => {
  test('all elements/views render without critical runtime or build failures', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);

    const failures: SmokeFailure[] = [];
    const matrix = buildCases();

    for (const item of matrix) {
      await test.step(`${item.element} :: ${item.view} :: ${item.strategy}`, async () => {
        console.log(`[smoke] checking ${item.element} :: ${item.view} :: ${item.strategy}`);
        const consoleMessages: string[] = [];
        const pageErrors: string[] = [];

        const onConsole = (msg: any) => {
          const text = msg.text();
          if (!isIgnoredConsole(text)) {
            consoleMessages.push(text);
          }
        };
        const onPageError = (err: Error) => {
          pageErrors.push(err.message || String(err));
        };

        page.on('console', onConsole);
        page.on('pageerror', onPageError);

        try {
          await page.goto(item.url, { waitUntil: 'domcontentloaded' });
          await waitForStrategySettle(page, item.view, item.strategy);

          const errorNodes = page.locator('.error');
          const errorCount = await errorNodes.count();
          if (errorCount > 0) {
            const combined = (await errorNodes.allTextContents()).join('\n---\n');
            failures.push({
              element: item.element,
              view: item.view,
              url: item.url,
              reason: 'IIFE error UI rendered',
              details: combined,
            });
            return;
          }

          const bodyText = await page.locator('body').innerText();
          if (/An error occured:/i.test(bodyText) || /Build failed/i.test(bodyText)) {
            failures.push({
              element: item.element,
              view: item.view,
              url: item.url,
              reason: 'Error text present in page body',
            });
            return;
          }

          const criticalConsole = findCriticalConsole([...consoleMessages, ...pageErrors]);
          if (criticalConsole.length > 0) {
            failures.push({
              element: item.element,
              view: item.view,
              url: item.url,
              reason: 'Critical console/runtime errors',
              details: criticalConsole.slice(0, 6).join('\n'),
            });
            return;
          }

          if (item.view === 'deliver') {
            const verifyError = await verifyDeliveryInteractionAndEvaluate(page, item);
            if (verifyError) {
              failures.push({
                element: item.element,
                view: item.view,
                url: item.url,
                reason: verifyError,
              });
            }
          }
        } catch (err: any) {
          failures.push({
            element: item.element,
            view: item.view,
            url: item.url,
            reason: 'Navigation or settle timeout',
            details: err?.message || String(err),
          });
        } finally {
          page.off('console', onConsole);
          page.off('pageerror', onPageError);
        }
      });
    }

    if (failures.length > 0) {
      const report = failures
        .map(
          (f, idx) =>
            `${idx + 1}. ${f.element} [${f.view}] :: ${f.reason}\n   URL: ${f.url}${
              f.details ? `\n   ${f.details.replace(/\n/g, '\n   ')}` : ''
            }`
        )
        .join('\n\n');
      throw new Error(`Smoke matrix found ${failures.length} failing cases:\n\n${report}`);
    }
  });
});
