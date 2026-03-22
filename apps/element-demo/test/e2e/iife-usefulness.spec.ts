import { expect, test, type Page } from '@playwright/test';
import { loadReactElementMatrix } from '../../src/lib/testing/react-element-matrix';
import {
  getModelFromSource,
  getSessionState,
  interactOnce,
  switchTab,
  updateModelInSource,
  waitForSessionMutation,
} from './test-helpers';

const ELEMENT_FILTER = process.env.IIFE_E2E_ELEMENT?.trim() || '';
const ALL_REACT_ELEMENTS = loadReactElementMatrix();
const REACT_ELEMENTS = ELEMENT_FILTER
  ? ALL_REACT_ELEMENTS.filter((entry) => entry.name === ELEMENT_FILTER)
  : ALL_REACT_ELEMENTS;

async function waitForIifeViewReady(page: Page, view: 'deliver' | 'author') {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle');
  await page.waitForFunction(
    () => {
      const iifeLoading = Array.from(document.querySelectorAll('.loading')).some((node) =>
        /IIFE/i.test(node.textContent || '')
      );
      return !iifeLoading;
    },
    undefined,
    { timeout: 25_000 }
  );
  if (view === 'deliver') {
    await page.waitForSelector('[data-testid="mode-gather"]', { timeout: 20_000 });
  } else {
    await page.waitForSelector('.author-view', { timeout: 20_000 });
    await page.waitForSelector('[data-testid="tab-source"]', { timeout: 20_000 });
  }
}

async function assertNoIifeErrorUi(page: Page, context: string) {
  const errorBlocks = page.locator('.error');
  const errorCount = await errorBlocks.count();
  if (errorCount === 0) {
    return;
  }
  const details = (await errorBlocks.allTextContents()).join('\n---\n');
  throw new Error(`${context}: iife error UI present\n${details}`);
}

async function resolveInteractionScope(page: Page) {
  const selectors = ['.delivery-view .element-container', '.delivery-view', '.demo-element-player'];
  for (const selector of selectors) {
    const scope = page.locator(selector).first();
    if (await scope.isVisible().catch(() => false)) {
      return scope;
    }
  }
  return page.locator('body').first();
}

test.describe('IIFE runtime usefulness matrix (react elements)', () => {
  test('delivery/controller and author surfaces are usable', async ({ page }) => {
    test.setTimeout(30 * 60 * 1000);
    expect(REACT_ELEMENTS.length).toBeGreaterThan(0);

    const failures: string[] = [];

    for (const element of REACT_ELEMENTS) {
      await test.step(`${element.name} delivery`, async () => {
        try {
          await page.goto(`/${element.name}/deliver?mode=gather&role=student&player=iife`);
          await waitForIifeViewReady(page, 'deliver');
          await assertNoIifeErrorUi(page, `${element.name} delivery`);

          const scope = await resolveInteractionScope(page);
          await expect(scope).toBeVisible();

          if (element.hasSession) {
            const beforeSession = await getSessionState(page);
            let interaction = 'unknown';
            let interactionError: string | null = null;
            try {
              interaction = await interactOnce(page, scope);
            } catch (error: any) {
              interactionError = error?.message || String(error);
              const fallback = scope
                .locator(
                  'label[for], button, [role="button"], input[type="radio"], input[type="checkbox"]'
                )
                .first();
              if (await fallback.isVisible().catch(() => false)) {
                await fallback.click({ force: true });
                interaction = 'fallback-click';
                interactionError = null;
              }
            }
            const afterSession = await waitForSessionMutation(page, beforeSession, 8_000);
            if (JSON.stringify(afterSession ?? {}) === JSON.stringify(beforeSession ?? {})) {
              throw new Error(
                `session did not change after "${interaction}" interaction in gather mode${
                  interactionError ? ` (interaction error: ${interactionError})` : ''
                }`
              );
            }
          }
        } catch (error: any) {
          failures.push(`delivery ${element.name}: ${error?.message || String(error)}`);
        }
      });

      if (!element.hasAuthor) {
        continue;
      }

      await test.step(`${element.name} author`, async () => {
        try {
          await page.goto(`/${element.name}/author?demo=default&player=iife`);
          await waitForIifeViewReady(page, 'author');
          await assertNoIifeErrorUi(page, `${element.name} author`);

          await switchTab(page, 'source');
          const sourceModel = await getModelFromSource(page);
          if (!sourceModel || typeof sourceModel !== 'object') {
            throw new Error('source model is not JSON object');
          }

          const marker = `iife-${element.name}-${Date.now()}`;
          const updatedModel = { ...sourceModel, __iifeTestMarker: marker };
          await updateModelInSource(page, updatedModel);

          await switchTab(page, 'deliver');
          await waitForIifeViewReady(page, 'deliver');
          await assertNoIifeErrorUi(page, `${element.name} author->deliver propagation`);
          await expect(await resolveInteractionScope(page)).toBeVisible();

          await switchTab(page, 'source');
          await assertNoIifeErrorUi(page, `${element.name} source after apply`);
        } catch (error: any) {
          failures.push(`author ${element.name}: ${error?.message || String(error)}`);
        }
      });
    }

    if (failures.length > 0) {
      throw new Error(`IIFE usefulness failures (${failures.length}):\n${failures.join('\n')}`);
    }
  });
});
