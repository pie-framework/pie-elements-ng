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
});
