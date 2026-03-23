import { expect, test, type Page } from '@playwright/test';
import { switchMode, switchRole } from './test-helpers';

const ELEMENT = process.env.UNIFIED_PLAYER_E2E_ELEMENT?.trim() || 'multiple-choice';
const DEMO_ID =
  process.env.UNIFIED_PLAYER_E2E_DEMO?.trim() ||
  (ELEMENT === 'multiple-choice'
    ? 'math-algebra-quadratic'
    : ELEMENT === 'graphing'
      ? 'parabola-vertex'
      : '');
const DEMO_QUERY = DEMO_ID ? `&demo=${DEMO_ID}` : '';
const STRATEGIES = (process.env.UNIFIED_PLAYER_E2E_STRATEGIES?.trim() || 'esm,iife')
  .split(',')
  .map((s) => s.trim())
  .filter((s): s is 'esm' | 'iife' => s === 'esm' || s === 'iife');

async function waitForHostSettled(page: Page) {
  await page.waitForFunction(
    () => {
      const host = document.querySelector('pie-element-player');
      if (!host) {
        return false;
      }
      const error = host.querySelector('.error');
      if (error) {
        return false;
      }
      const loading = host.querySelector('.loading');
      return !loading;
    },
    undefined,
    { timeout: 45_000 }
  );
}

function hasBothStrategies(): boolean {
  return STRATEGIES.includes('esm') && STRATEGIES.includes('iife');
}

test.describe('Unified element player strategy host', () => {
  test('delivery uses one host for esm and iife', async ({ page }) => {
    test.setTimeout(120_000);

    for (const strategy of STRATEGIES) {
      await page.goto(
        `/${ELEMENT}/deliver?mode=gather&role=student&player=${strategy}${DEMO_QUERY}`
      );
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('pie-element-player', { timeout: 30_000 });

      const host = page.locator('pie-element-player').first();
      await expect(host).toBeVisible();
      await expect(host).toHaveAttribute('strategy', strategy);
      await expect(host).toHaveAttribute('view', 'delivery');
      await waitForHostSettled(page);

      if (strategy === 'iife') {
        await page.waitForSelector(`pie-iife-${ELEMENT}`, { timeout: 45_000 });
      } else {
        // ESM path can render through non-web-component internals for some elements.
        // Ensure unified host finished loading without error.
        await expect(page.locator('pie-element-player .error')).toHaveCount(0);
      }
    }
  });

  test('author and print mount through one host', async ({ page }) => {
    test.setTimeout(120_000);

    for (const strategy of STRATEGIES) {
      await page.goto(`/${ELEMENT}/author?player=${strategy}`);
      await page.waitForSelector('pie-element-player[view="author"]', { timeout: 45_000 });
      await waitForHostSettled(page);
      await page.waitForSelector(`${ELEMENT}-configure`, { timeout: 45_000 });

      await page.goto(`/${ELEMENT}/print?role=student&player=${strategy}`);
      await page.waitForSelector('pie-element-player[view="print"]', { timeout: 45_000 });
      await waitForHostSettled(page);
      await page.waitForSelector(`${ELEMENT}-print`, { timeout: 45_000 });
    }
  });

  test('author forwards model updates as full snapshots', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/${ELEMENT}/author?player=esm`);
    await page.waitForSelector('pie-element-player[view="author"]', { timeout: 45_000 });
    await waitForHostSettled(page);
    await page.waitForSelector(`${ELEMENT}-configure`, { timeout: 45_000 });

    const marker = `marker-${Date.now()}`;
    const eventResult = await page.evaluate(
      async ({ elementName, markerValue }) => {
        const host = document.querySelector('pie-element-player');
        if (!(host instanceof HTMLElement)) {
          return { ok: false, reason: 'host-missing' };
        }
        const configure = host.querySelector(`${elementName}-configure`) as any;
        if (!configure) {
          return { ok: false, reason: 'configure-missing' };
        }

        return await new Promise<{ ok: boolean; detail?: any; count?: number; reason?: string }>(
          (resolve) => {
            let count = 0;
            let detail: unknown;
            const listener = (event: Event) => {
              count += 1;
              detail = (event as CustomEvent).detail;
            };
            host.addEventListener('model-changed', listener);

            try {
              const baseModel =
                configure.model && typeof configure.model === 'object' ? configure.model : {};
              configure.model = { ...baseModel, parityMarker: markerValue };
              configure.dispatchEvent(
                new CustomEvent('model.updated', {
                  detail: { update: { parityPartial: true, parityMarker: markerValue } },
                  bubbles: false,
                })
              );
            } catch {
              host.removeEventListener('model-changed', listener);
              resolve({ ok: false, reason: 'dispatch-failed' });
              return;
            }

            setTimeout(() => {
              host.removeEventListener('model-changed', listener);
              resolve({ ok: count > 0, count, detail });
            }, 80);
          }
        );
      },
      { elementName: ELEMENT, markerValue: marker }
    );

    expect(eventResult.ok).toBeTruthy();
    expect(eventResult.count).toBeGreaterThan(0);
    expect(eventResult.detail).toBeTruthy();
    expect(eventResult.detail?.parityMarker).toBe(marker);
  });

  test('delivery forwards stable session payloads for repeated updates', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto(`/${ELEMENT}/deliver?mode=gather&role=student&player=esm${DEMO_QUERY}`);
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);

    const marker = `session-marker-${Date.now()}`;
    await page.evaluate(
      ({ elementName, markerValue }) => {
        const host = document.querySelector('pie-element-player');
        if (!(host instanceof HTMLElement)) {
          return;
        }
        const container = host.querySelector('.demo-element-player');
        const innerElement =
          container?.querySelector<HTMLElement>(`${elementName}-element`) ??
          container?.querySelector<HTMLElement>(':scope > *:not(.loading):not(.error)') ??
          null;
        if (!innerElement) {
          return;
        }
        (window as any).__paritySessionDetails = [];
        host.addEventListener('session-changed', (event: Event) => {
          const detail = (event as CustomEvent).detail;
          (window as any).__paritySessionDetails.push(JSON.stringify(detail));
        });
        innerElement.dispatchEvent(
          new CustomEvent('session-changed', {
            detail: { parityMarker: markerValue, session: { value: ['A'] } },
            bubbles: true,
            composed: true,
          })
        );
        innerElement.dispatchEvent(
          new CustomEvent('session-changed', {
            detail: { parityMarker: markerValue, session: { value: ['A'] } },
            bubbles: true,
            composed: true,
          })
        );
      },
      { elementName: ELEMENT, markerValue: marker }
    );

    await page.waitForFunction(() => {
      const entries = (window as any).__paritySessionDetails as string[] | undefined;
      return Array.isArray(entries) && entries.length > 0;
    });

    const eventResult = await page.evaluate(() => {
      const entries = ((window as any).__paritySessionDetails as string[]) || [];
      let hasConsecutiveDuplicate = false;
      for (let i = 1; i < entries.length; i += 1) {
        if (entries[i] === entries[i - 1]) {
          hasConsecutiveDuplicate = true;
          break;
        }
      }
      const lastDetail = entries.length > 0 ? JSON.parse(entries[entries.length - 1]) : null;
      return {
        count: entries.length,
        hasConsecutiveDuplicate,
        lastDetail,
      };
    });

    expect(eventResult.count).toBeGreaterThan(0);
    expect(eventResult.lastDetail?.session).toEqual({ value: ['A'] });
    // Metadata-only events (e.g. {complete, component}) must not overwrite forwarded session.
    expect(eventResult.lastDetail?.complete).toBeUndefined();
    expect(eventResult.lastDetail?.component).toBeUndefined();
  });

  test('multiple-choice keeps user selection across mode/role switches', async ({ page }) => {
    test.setTimeout(120_000);

    const multipleChoiceDemo = process.env.UNIFIED_PLAYER_E2E_MC_DEMO?.trim() || 'math-algebra-quadratic';
    await page.goto(
      `/multiple-choice/deliver?mode=gather&role=student&player=esm&demo=${multipleChoiceDemo}`
    );
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);

    const beforeSessionSignature = await page.evaluate(() => {
      const host = document.querySelector('pie-element-player') as any;
      return JSON.stringify(host?.session ?? {});
    });

    await page.waitForSelector(
      'pie-element-player .demo-element-player input[type="radio"], pie-element-player .demo-element-player input[type="checkbox"]',
      { timeout: 15_000 }
    );
    const interactionWorked = await page.evaluate(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'pie-element-player .demo-element-player input[type="radio"], pie-element-player .demo-element-player input[type="checkbox"]'
        )
      ).filter((input) => !input.disabled);
      const target = inputs.find((input) => !input.checked) || inputs[0];
      if (!target) {
        return false;
      }
      const id = target.id;
      const label =
        id && document.querySelector(`pie-element-player .demo-element-player label[for="${id}"]`);
      if (label instanceof HTMLElement) {
        label.click();
        return true;
      }
      target.click();
      return true;
    });
    expect(interactionWorked).toBeTruthy();

    await page.waitForFunction(
      (beforeSignature) => {
        const host = document.querySelector('pie-element-player') as any;
        const current = JSON.stringify(host?.session ?? {});
        return current !== beforeSignature;
      },
      beforeSessionSignature,
      { timeout: 15_000 }
    );

    const selectedSession = await page.evaluate(() => {
      const host = document.querySelector('pie-element-player') as any;
      const session = host?.session && typeof host.session === 'object' ? host.session : {};
      const value = (session as any).value;
      return {
        session,
        value: Array.isArray(value) ? value : [],
      };
    });
    expect(Array.isArray(selectedSession.value)).toBeTruthy();
    expect(selectedSession.value.length).toBeGreaterThan(0);

    await switchMode(page, 'view');
    await switchRole(page, 'instructor');
    await waitForHostSettled(page);

    const selectionVisibleReadOnly = await page.evaluate((value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return false;
      }
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'pie-element-player .demo-element-player input[type="radio"], pie-element-player .demo-element-player input[type="checkbox"]'
        )
      );
      if (inputs.length === 0) {
        return false;
      }
      const checkedValues = inputs.filter((input) => input.checked).map((input) => input.value);
      const allDisabled = inputs.every((input) => input.disabled);
      const matchesSelection = value.every((entry) => checkedValues.includes(entry));
      return matchesSelection && allDisabled;
    }, selectedSession.value);
    expect(selectionVisibleReadOnly).toBeTruthy();

    const sessionStillContainsSelection = await page.evaluate((value) => {
        const host = document.querySelector('pie-element-player') as any;
      const sessionValue = host?.session?.value;
      if (!Array.isArray(sessionValue) || !Array.isArray(value) || value.length === 0) {
        return false;
      }
      return value.every((entry) => sessionValue.includes(entry));
    }, selectedSession.value);
    expect(sessionStillContainsSelection).toBeTruthy();
  });

  test('session remains stable across esm/iife strategy switches', async ({ page }) => {
    test.skip(!hasBothStrategies(), 'Requires both esm and iife strategies');
    test.setTimeout(120_000);

    const token = `switch-${Date.now()}`;
    await page.goto(`/${ELEMENT}/deliver?mode=gather&role=student&player=esm${DEMO_QUERY}`);
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);

    await page.evaluate((value) => {
      const host = document.querySelector('pie-element-player');
      if (!(host instanceof HTMLElement)) return;
      const container = host.querySelector('.demo-element-player');
      const innerElement =
        container?.querySelector<HTMLElement>(':scope > *:not(.loading):not(.error)') ?? null;
      if (!innerElement) return;
      const currentSession =
        (host as any).session && typeof (host as any).session === 'object'
          ? (host as any).session
          : {};
      const nextSession = { ...currentSession, paritySwitchToken: value };
      innerElement.dispatchEvent(
        new CustomEvent('session-changed', {
          detail: { session: nextSession },
          bubbles: true,
          composed: true,
        })
      );
    }, token);

    await page.waitForFunction(
      (value) => {
        const host = document.querySelector('pie-element-player') as any;
        return host?.session?.paritySwitchToken === value;
      },
      token,
      { timeout: 15_000 }
    );

    await page.goto(`/${ELEMENT}/deliver?mode=gather&role=student&player=iife${DEMO_QUERY}`);
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);
    await page.waitForFunction(
      (value) => {
        const host = document.querySelector('pie-element-player') as any;
        return host?.session?.paritySwitchToken === value;
      },
      token,
      { timeout: 15_000 }
    );

    await page.goto(`/${ELEMENT}/deliver?mode=gather&role=student&player=esm${DEMO_QUERY}`);
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);
    await page.waitForFunction(
      (value) => {
        const host = document.querySelector('pie-element-player') as any;
        return host?.session?.paritySwitchToken === value;
      },
      token,
      { timeout: 15_000 }
    );
  });
});
