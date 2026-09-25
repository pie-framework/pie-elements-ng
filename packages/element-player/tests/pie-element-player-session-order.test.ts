import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadUnifiedPlayerMock } = vi.hoisted(() => ({
  loadUnifiedPlayerMock: vi.fn(),
}));

vi.mock('../src/lib/unified-player-loader', () => ({
  loadUnifiedPlayer: loadUnifiedPlayerMock,
}));

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({
  createMathjaxRenderer: () => async () => undefined,
}));

import '../src/players/PieElementPlayer.svelte';

const assignments: string[] = [];

// Reads the model in its session setter, as graphing-solution-set does.
class ModelFirstElement extends HTMLElement {
  private _model: { id: string } | undefined;

  set model(value: { id: string }) {
    this._model = value;
    assignments.push('model');
  }

  set session(_value: unknown) {
    if (!this._model) {
      throw new TypeError('session set before model');
    }
    assignments.push('session');
  }
}
customElements.define('pie-mock-model-first', ModelFirstElement);

const receivedSessions: unknown[] = [];

// Reports its default session once connected, before any model, as ebsr's parts do.
class EagerReportElement extends HTMLElement {
  private _session: unknown = {};
  reported = false;

  set model(_value: unknown) {}

  get session() {
    return this._session;
  }

  set session(value: unknown) {
    this._session = value;
    receivedSessions.push(value);
  }

  connectedCallback() {
    setTimeout(() => {
      this.dispatchEvent(
        new CustomEvent('session-changed', {
          bubbles: true,
          composed: true,
          detail: { complete: false },
        })
      );
      this.reported = true;
    }, 0);
  }
}
customElements.define('pie-mock-eager-report', EagerReportElement);

function waitForAssertion(assertion: () => void, timeoutMs = 2_000): Promise<void> {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      try {
        assertion();
        resolve();
      } catch (error) {
        if (Date.now() - startedAt > timeoutMs) {
          reject(error);
          return;
        }
        setTimeout(tick, 10);
      }
    };
    tick();
  });
}

describe('PieElementPlayer model and session order', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    assignments.length = 0;
    receivedSessions.length = 0;
    loadUnifiedPlayerMock.mockReset();
    loadUnifiedPlayerMock.mockResolvedValue({
      strategy: 'iife',
      view: 'delivery',
      tagName: 'pie-mock-model-first',
    });
  });

  it('holds the session until the element has a model', async () => {
    const player = document.createElement('pie-element-player') as any;
    player.elementName = 'graphing-solution-set';
    player.packageName = '@pie-element/graphing-solution-set';
    player.strategy = 'iife';
    player.view = 'delivery';
    player.session = {};
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(player.querySelector('pie-mock-model-first')).toBeTruthy();
    });
    expect(assignments).toEqual([]);

    player.model = { id: '1' };

    await waitForAssertion(() => {
      expect(assignments).toEqual(['model', 'session']);
    });
  });

  it('keeps the host session when the element reports its own before the model', async () => {
    loadUnifiedPlayerMock.mockResolvedValue({
      strategy: 'iife',
      view: 'delivery',
      tagName: 'pie-mock-eager-report',
    });
    const forwarded: unknown[] = [];
    const player = document.createElement('pie-element-player') as any;
    player.elementName = 'ebsr';
    player.packageName = '@pie-element/ebsr';
    player.strategy = 'iife';
    player.view = 'delivery';
    player.session = { id: 'restored', value: ['a'] };
    player.addEventListener('session-changed', (event: CustomEvent) =>
      forwarded.push(event.detail)
    );
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(player.querySelector('pie-mock-eager-report')?.reported).toBe(true);
    });
    player.model = { id: '1' };

    await waitForAssertion(() => {
      expect(receivedSessions).toEqual([{ id: 'restored', value: ['a'] }]);
    });
    expect(forwarded).toEqual([]);
    expect(player.session).toEqual({ id: 'restored', value: ['a'] });
  });
});
