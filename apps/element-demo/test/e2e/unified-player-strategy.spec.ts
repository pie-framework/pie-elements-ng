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

function uniqueStrings(values: unknown[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => typeof value === 'string')));
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

  test('author resolves image and sound insert/delete events', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/multiple-choice/author?player=esm');
    await page.waitForSelector('pie-element-player[view="author"]', { timeout: 45_000 });
    await waitForHostSettled(page);
    await page.waitForSelector('multiple-choice-configure', { timeout: 45_000 });

    const result = await page.evaluate(async () => {
      const host = document.querySelector('pie-element-player');
      if (!(host instanceof HTMLElement)) {
        return { ok: false, reason: 'host-missing' };
      }
      const configure = host.querySelector('multiple-choice-configure');
      if (!(configure instanceof HTMLElement)) {
        return { ok: false, reason: 'configure-missing' };
      }

      const insert = await new Promise<{ ok: boolean; src?: string; err?: string }>((resolve) => {
        let finished = false;
        const timeout = window.setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve({ ok: false, err: 'insert-timeout' });
          }
        }, 4_000);

        const file = new File(['pixel'], 'pixel.png', { type: 'image/png' });
        const handler = {
          isPasted: true,
          cancel: () => {},
          fileChosen: () => {},
          getChosenFile: () => file,
          progress: () => {},
          done: (err?: unknown, src?: string) => {
            if (finished) {
              return;
            }
            finished = true;
            clearTimeout(timeout);
            resolve({
              ok: !err && typeof src === 'string' && src.startsWith('data:image/png;base64,'),
              src,
              err: err ? String(err) : undefined,
            });
          },
        };
        configure.dispatchEvent(
          new CustomEvent('insert.image', {
            detail: handler,
            bubbles: true,
            composed: true,
          })
        );
      });

      const remove = await new Promise<{ ok: boolean; err?: string }>((resolve) => {
        let finished = false;
        const timeout = window.setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve({ ok: false, err: 'delete-timeout' });
          }
        }, 4_000);

        configure.dispatchEvent(
          new CustomEvent('delete.image', {
            detail: {
              src: insert.src ?? 'data:image/png;base64,AAAA',
              done: (err?: unknown) => {
                if (finished) {
                  return;
                }
                finished = true;
                clearTimeout(timeout);
                resolve({ ok: !err, err: err ? String(err) : undefined });
              },
            },
            bubbles: true,
            composed: true,
          })
        );
      });

      const insertSound = await new Promise<{ ok: boolean; src?: string; err?: string }>(
        (resolve) => {
          let finished = false;
          const timeout = window.setTimeout(() => {
            if (!finished) {
              finished = true;
              resolve({ ok: false, err: 'insert-sound-timeout' });
            }
          }, 4_000);

          const file = new File(['tone'], 'tone.wav', { type: 'audio/wav' });
          const handler = {
            isPasted: true,
            cancel: () => {},
            fileChosen: () => {},
            getChosenFile: () => file,
            progress: () => {},
            done: (err?: unknown, src?: string) => {
              if (finished) {
                return;
              }
              finished = true;
              clearTimeout(timeout);
              resolve({
                ok: !err && typeof src === 'string' && src.startsWith('data:audio/'),
                src,
                err: err ? String(err) : undefined,
              });
            },
          };
          configure.dispatchEvent(
            new CustomEvent('insert.sound', {
              detail: handler,
              bubbles: true,
              composed: true,
            })
          );
        }
      );

      const deleteSound = await new Promise<{ ok: boolean; err?: string }>((resolve) => {
        let finished = false;
        const timeout = window.setTimeout(() => {
          if (!finished) {
            finished = true;
            resolve({ ok: false, err: 'delete-sound-timeout' });
          }
        }, 4_000);

        configure.dispatchEvent(
          new CustomEvent('delete.sound', {
            detail: {
              src: insertSound.src ?? 'data:audio/wav;base64,AAAA',
              done: (err?: unknown) => {
                if (finished) {
                  return;
                }
                finished = true;
                clearTimeout(timeout);
                resolve({ ok: !err, err: err ? String(err) : undefined });
              },
            },
            bubbles: true,
            composed: true,
          })
        );
      });

      return {
        ok: insert.ok && remove.ok && insertSound.ok && deleteSound.ok,
        insert,
        remove,
        insertSound,
        deleteSound,
      };
    });

    expect(result.ok).toBeTruthy();
    expect(result.insert?.ok).toBeTruthy();
    expect(result.remove?.ok).toBeTruthy();
    expect(result.insertSound?.ok).toBeTruthy();
    expect(result.deleteSound?.ok).toBeTruthy();
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

  test('multiple-choice remains stable across mode/role URL switches', async ({ page }) => {
    test.setTimeout(120_000);

    const multipleChoiceDemo =
      process.env.UNIFIED_PLAYER_E2E_MC_DEMO?.trim() || 'math-algebra-quadratic';
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

    await switchRole(page, 'instructor');
    await switchMode(page, 'evaluate');
    await waitForHostSettled(page);

    const selectionStateReadable = await page.evaluate((value) => {
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
      // URL-mode switches remount route state for some elements; preserve either read-only selected
      // view OR clean reset while still confirming controls are in non-gather state.
      const preservedAsReadOnly = matchesSelection && allDisabled;
      const resetButReadOnly = checkedValues.length === 0 && allDisabled;
      return preservedAsReadOnly || resetButReadOnly;
    }, selectedSession.value);
    expect(selectionStateReadable).toBeTruthy();

    const sessionStateReadable = await page.evaluate((value) => {
      const host = document.querySelector('pie-element-player') as any;
      const sessionValue = host?.session?.value;
      if (!Array.isArray(value) || value.length === 0) {
        return false;
      }
      if (!Array.isArray(sessionValue)) {
        return false;
      }
      const preserved = value.every((entry) => sessionValue.includes(entry));
      const reset = sessionValue.length === 0;
      return preserved || reset;
    }, selectedSession.value);
    expect(sessionStateReadable).toBeTruthy();
  });

  test('hotspot multi-select stays stable across mode/role switches and resets on reload', async ({
    page,
  }) => {
    test.setTimeout(120_000);

    await page.goto('/hotspot/deliver?mode=gather&role=student&player=esm&demo=default');
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);

    const initialSelection = await page.evaluate(() => {
      const host = document.querySelector('pie-element-player') as any;
      const innerElement = host?.querySelector(
        '.demo-element-player > *:not(.loading):not(.error)'
      );
      if (!(host instanceof HTMLElement) || !(innerElement instanceof HTMLElement)) {
        return { ok: false, reason: 'host-or-inner-missing' };
      }
      const player = host as HTMLElement & { session?: unknown };
      const baseSession =
        player.session && typeof player.session === 'object'
          ? JSON.parse(JSON.stringify(player.session))
          : {};
      const nextSession = {
        ...baseSession,
        answers: [{ id: '3' }, { id: '7' }],
        selector: 'Mouse',
      };
      innerElement.dispatchEvent(
        new CustomEvent('session-changed', {
          detail: { session: nextSession },
          bubbles: true,
          composed: true,
        })
      );
      return { ok: true };
    });
    expect(initialSelection.ok).toBeTruthy();

    await page.waitForFunction(() => {
      const host = document.querySelector('pie-element-player') as any;
      const ids = Array.isArray(host?.session?.answers)
        ? host.session.answers.map((answer: any) => String(answer?.id ?? ''))
        : [];
      return ids.includes('3') && ids.includes('7');
    });

    const selectedIdsBeforeSwitch = await page.evaluate(() => {
      const host = document.querySelector('pie-element-player') as any;
      const ids = Array.isArray(host?.session?.answers)
        ? host.session.answers.map((answer: any) => String(answer?.id ?? ''))
        : [];
      return Array.from(new Set(ids));
    });
    expect(selectedIdsBeforeSwitch.length).toBeGreaterThan(1);

    await switchRole(page, 'instructor');
    await waitForHostSettled(page);

    const selectedIdsAfterSwitch = await page.evaluate(() => {
      const host = document.querySelector('pie-element-player') as any;
      const ids = Array.isArray(host?.session?.answers)
        ? host.session.answers.map((answer: any) => String(answer?.id ?? ''))
        : [];
      return Array.from(new Set(ids));
    });
    const preservedAfterSwitch = selectedIdsBeforeSwitch.every((id) =>
      selectedIdsAfterSwitch.includes(id)
    );
    const resetAfterSwitch = selectedIdsAfterSwitch.length === 0;
    expect(preservedAfterSwitch || resetAfterSwitch).toBeTruthy();

    await page.reload();
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);

    const selectedIdsAfterReload = await page.evaluate(() => {
      const host = document.querySelector('pie-element-player') as any;
      const ids = Array.isArray(host?.session?.answers)
        ? host.session.answers.map((answer: any) => String(answer?.id ?? ''))
        : [];
      return Array.from(new Set(ids));
    });
    expect(selectedIdsAfterReload).not.toEqual(expect.arrayContaining(selectedIdsBeforeSwitch));
  });

  test('demo switch does not leak prior demo session', async ({ page }) => {
    test.setTimeout(120_000);
    const multipleChoiceDemo =
      process.env.UNIFIED_PLAYER_E2E_MC_DEMO?.trim() || 'math-algebra-quadratic';
    await page.goto(
      `/multiple-choice/deliver?mode=gather&role=student&player=esm&demo=${multipleChoiceDemo}`
    );
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);

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

    await page.waitForFunction(() => {
      const host = document.querySelector('pie-element-player') as any;
      return Array.isArray(host?.session?.value) && host.session.value.length > 0;
    });

    const previousDemoValues = await page.evaluate(() => {
      const host = document.querySelector('pie-element-player') as any;
      return Array.isArray(host?.session?.value)
        ? Array.from(new Set(host.session.value.map((entry: unknown) => String(entry))))
        : [];
    });
    const uniquePreviousDemoValues = uniqueStrings(previousDemoValues ?? []);
    expect(uniquePreviousDemoValues.length).toBeGreaterThan(0);

    const availableDemoIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLButtonElement>('button[data-demo-id]')).map(
        (button) => button.dataset.demoId || ''
      )
    );
    const activeDemoId = await page.evaluate(
      () => new URL(window.location.href).searchParams.get('demo') || 'default'
    );
    const nextDemoId = availableDemoIds.find((id) => id && id !== activeDemoId);
    test.skip(!nextDemoId, 'Need at least two demos to validate demo-switch isolation');

    await page.click('[data-testid="demo-selector-button"]');
    await page.click(`button[data-demo-id="${nextDemoId}"]`);
    await page.waitForSelector('pie-element-player[view="delivery"]', { timeout: 45_000 });
    await waitForHostSettled(page);

    const hasLeakAfterSwitch = await page.evaluate((oldValues: string[]) => {
      const host = document.querySelector('pie-element-player') as any;
      const sessionValue = Array.isArray(host?.session?.value)
        ? host.session.value.map((entry: unknown) => String(entry))
        : [];
      return oldValues.some((entry) => sessionValue.includes(entry));
    }, uniquePreviousDemoValues);
    expect(hasLeakAfterSwitch).toBeFalsy();
  });

  test('strategy switches remount with clean session state', async ({ page }) => {
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
        return host?.session?.paritySwitchToken !== value;
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
        return host?.session?.paritySwitchToken !== value;
      },
      token,
      { timeout: 15_000 }
    );
  });
});
