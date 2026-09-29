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

const LOADED = { strategy: 'esm', view: 'delivery', tagName: 'pie-mock-events' };

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

/** Long enough for a duplicate dispatched a tick later to arrive. */
function settle(ms = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createPlayer(): any {
  const player = document.createElement('pie-element-player') as any;
  player.elementName = 'simple-cloze';
  player.packageName = '@pie-element/simple-cloze';
  player.view = 'delivery';
  return player;
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
    loadUnifiedPlayerMock.mockResolvedValue(LOADED);
  });

  afterEach(() => {
    for (const cleanup of cleanups.splice(0)) cleanup();
  });

  it('reach ancestor and document listeners once, from the player', async () => {
    const root = document.createElement('div');
    const player = createPlayer();
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
    await settle();
    for (const type of TYPES) {
      expect(own.heard[type]).toHaveLength(1);
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

  it('reach a `once: true` listener once across two loads', async () => {
    const player = createPlayer();
    const once = vi.fn();
    player.addEventListener('load-complete', once, { once: true });
    const own = listen(player);
    cleanups.push(own.stop);
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(own.heard['load-complete']).toHaveLength(1);
    });
    player.rebuildVersion = 1;
    await waitForAssertion(() => {
      expect(own.heard['load-complete']).toHaveLength(2);
    });
    await settle();
    expect(once).toHaveBeenCalledTimes(1);
  });

  it('skip a listener removed before the player connects', async () => {
    const player = createPlayer();
    const removed = vi.fn();
    player.addEventListener('load-complete', removed);
    player.removeEventListener('load-complete', removed);
    const own = listen(player);
    cleanups.push(own.stop);
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(own.heard['load-complete']).toHaveLength(1);
    });
    await settle();
    expect(removed).not.toHaveBeenCalled();
  });

  it('keep reaching a listener added before connect after a disconnect and reconnect', async () => {
    const player = createPlayer();
    const own = listen(player);
    cleanups.push(own.stop);
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(own.heard['load-complete']).toHaveLength(1);
    });
    // Svelte destroys the component a microtask after disconnect.
    player.remove();
    await settle(10);
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(own.heard['load-complete']).toHaveLength(2);
    });
  });

  it('come only from the current instance when the player is re-attached mid-load', async () => {
    loadUnifiedPlayerMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(LOADED), 60))
    );
    const player = createPlayer();
    const own = listen(player);
    const doc = listen(document);
    cleanups.push(own.stop, doc.stop);
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(loadUnifiedPlayerMock).toHaveBeenCalledTimes(1);
    });
    player.remove();
    await settle(10);
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(loadUnifiedPlayerMock).toHaveBeenCalledTimes(2);
      expect(own.heard['load-complete']).toHaveLength(1);
    });
    await settle(120);
    expect(own.heard['load-complete']).toHaveLength(1);
    expect(doc.heard['load-complete']).toHaveLength(1);
    expect(player.querySelector('pie-mock-events')).toBeTruthy();
  });

  it('stay silent after a detach aborts the load', async () => {
    loadUnifiedPlayerMock.mockImplementation(
      ({ signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(Object.assign(new Error('IIFE bundle load aborted'), { code: 'LOAD_ABORTED' }));
          });
        })
    );
    const player = createPlayer();
    const heard = vi.fn();
    for (const type of ['bundle-retry-status', 'build-state', 'load-cancelled']) {
      player.addEventListener(type, heard);
    }
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(loadUnifiedPlayerMock).toHaveBeenCalledTimes(1);
    });
    player.remove();
    await settle();
    expect(heard).not.toHaveBeenCalled();
  });
});
