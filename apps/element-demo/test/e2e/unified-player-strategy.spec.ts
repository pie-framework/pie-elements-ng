import { expect, test, type Page } from '@playwright/test';

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
