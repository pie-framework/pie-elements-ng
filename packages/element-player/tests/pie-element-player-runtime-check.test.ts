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

describe('PieElementPlayer runtimeSupportCheck reactivity', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    loadUnifiedPlayerMock.mockReset();
    loadUnifiedPlayerMock.mockResolvedValue({
      strategy: 'esm',
      view: 'delivery',
      tagName: 'pie-mock-runtime-check',
    });
  });

  it('reloads when runtimeSupportCheck toggles', async () => {
    const player = document.createElement('pie-element-player') as any;
    player.elementName = 'simple-cloze';
    player.packageName = '@pie-element/simple-cloze';
    player.elementVersion = 'latest';
    player.strategy = 'esm';
    player.view = 'delivery';
    player.runtimeSupportCheck = 'off';
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(loadUnifiedPlayerMock).toHaveBeenCalledTimes(1);
    });
    expect(loadUnifiedPlayerMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ runtimeSupportCheck: 'off' })
    );

    player.runtimeSupportCheck = 'on';

    await waitForAssertion(() => {
      expect(loadUnifiedPlayerMock).toHaveBeenCalledTimes(2);
    });
    expect(loadUnifiedPlayerMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ runtimeSupportCheck: 'on' })
    );
  });
});
