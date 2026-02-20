import { test, type Page } from '@playwright/test';
import { ELEMENT_REGISTRY } from '../../src/lib/elements/registry';

type ViewKind = 'deliver' | 'author' | 'print';

interface SmokeCase {
  element: string;
  view: ViewKind;
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

function buildCases(): SmokeCase[] {
  const cases: SmokeCase[] = [];
  for (const element of ELEMENT_REGISTRY) {
    cases.push({
      element: element.name,
      view: 'deliver',
      url: `/${element.name}/deliver?mode=gather&role=student&player=iife`,
    });
    if (element.hasAuthor) {
      cases.push({
        element: element.name,
        view: 'author',
        url: `/${element.name}/author?demo=default&player=iife`,
      });
    }
    if (element.hasPrint) {
      cases.push({
        element: element.name,
        view: 'print',
        url: `/${element.name}/print?role=student&player=iife`,
      });
    }

    // Keep an explicit regression case for known number-line IIFE/runtime interactions.
    if (element.name === 'number-line') {
      cases.push({
        element: element.name,
        view: 'deliver',
        url: `/${element.name}/deliver?demo=basic-points&mode=gather&role=student&player=iife`,
      });
    }
  }
  return cases;
}

async function waitForIifeSettle(page: Page, view: ViewKind, timeoutMs = 20_000) {
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

test.describe('IIFE smoke matrix across PIE elements', () => {
  test('all elements/views render without critical runtime or build failures', async ({ page }) => {
    test.setTimeout(15 * 60 * 1000);

    const failures: SmokeFailure[] = [];
    const matrix = buildCases();

    for (const item of matrix) {
      await test.step(`${item.element} :: ${item.view}`, async () => {
        console.log(`[smoke] checking ${item.element} :: ${item.view}`);
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
          await waitForIifeSettle(page, item.view);

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
