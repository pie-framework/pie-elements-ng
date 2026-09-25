import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

const TYPES = ['session-changed', 'load-complete'] as const;
type Heard = Record<(typeof TYPES)[number], CustomEvent[]>;

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

function listen(target: EventTarget): { heard: Heard; stop: () => void } {
  const heard: Heard = { 'session-changed': [], 'load-complete': [] };
  const listeners = TYPES.map((type) => {
    const listener = (event: Event) => heard[type].push(event as CustomEvent);
    target.addEventListener(type, listener);
    return () => target.removeEventListener(type, listener);
  });
  return {
    heard,
    stop: () => {
      for (const remove of listeners) remove();
    },
  };
}

describe('PieElementPlayer events', () => {
  const cleanups: (() => void)[] = [];

  beforeEach(() => {
    document.body.innerHTML = '';
    loadUnifiedPlayerMock.mockReset();
    loadUnifiedPlayerMock.mockResolvedValue({
      strategy: 'esm',
      view: 'delivery',
      tagName: 'pie-mock-events',
    });
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  it('reach ancestor and document listeners once, from the player', async () => {
    const root = document.createElement('div');
    const player = document.createElement('pie-element-player') as any;
    player.elementName = 'simple-cloze';
    player.packageName = '@pie-element/simple-cloze';
    player.view = 'delivery';
    // The player drops an element's session reports until it has applied a model.
    player.model = { id: '1' };
    root.appendChild(player);

    const own = listen(player);
    const ancestor = listen(root);
    const doc = listen(document);
    cleanups.push(own.stop, ancestor.stop, doc.stop);
    document.body.appendChild(root);

    await waitForAssertion(() => {
      expect(own.heard['load-complete']).toHaveLength(1);
    });

    const inner = player.querySelector('pie-mock-events') as HTMLElement;
    inner.dispatchEvent(
      new CustomEvent('session-changed', {
        detail: { session: { value: ['A'] }, complete: true },
        bubbles: true,
        composed: true,
      })
    );

    await waitForAssertion(() => {
      expect(own.heard['session-changed']).toHaveLength(1);
    });
    for (const type of TYPES) {
      const [event] = own.heard[type];
      expect(event.target).toBe(player);
      for (const { heard } of [ancestor, doc]) {
        expect(heard[type]).toHaveLength(1);
        expect(heard[type][0].target).toBe(player);
        expect(heard[type][0].detail).toBe(event.detail);
      }
    }
    expect(own.heard['session-changed'][0].detail.session).toEqual({ value: ['A'] });
  });
});
