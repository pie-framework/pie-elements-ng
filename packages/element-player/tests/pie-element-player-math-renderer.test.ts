import { beforeEach, describe, expect, it, vi } from 'vitest';

const { loadUnifiedPlayerMock, createMathjaxRendererMock } = vi.hoisted(() => ({
  loadUnifiedPlayerMock: vi.fn(),
  createMathjaxRendererMock: vi.fn(),
}));

vi.mock('../src/lib/unified-player-loader', () => ({
  loadUnifiedPlayer: loadUnifiedPlayerMock,
}));

vi.mock('@pie-element/shared-math-rendering-mathjax', () => ({
  createMathjaxRenderer: createMathjaxRendererMock,
}));

import '../src/players/PieElementPlayer.svelte';

const MATH_RENDERING_KEY = '@pie-lib/math-rendering';
const page = window as unknown as Record<string, unknown>;

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

function mountPlayer(): HTMLElement {
  const player = document.createElement('pie-element-player') as any;
  player.elementName = 'simple-cloze';
  player.packageName = '@pie-element/simple-cloze';
  player.view = 'delivery';
  document.body.appendChild(player);
  return player;
}

function hostRenderer() {
  return { renderMath: vi.fn(async (_element: HTMLElement) => undefined) };
}

describe('PieElementPlayer math renderer', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    delete page[MATH_RENDERING_KEY];
    loadUnifiedPlayerMock.mockReset();
    loadUnifiedPlayerMock.mockResolvedValue({
      strategy: 'esm',
      view: 'delivery',
      tagName: 'pie-mock-math',
    });
    createMathjaxRendererMock.mockReset();
    createMathjaxRendererMock.mockImplementation(() => vi.fn(async () => undefined));
  });

  it('typesets through a renderer the host installed first and loads no MathJax 4', async () => {
    const host = hostRenderer();
    page[MATH_RENDERING_KEY] = host;
    const player = mountPlayer();

    await waitForAssertion(() => {
      expect(host.renderMath).toHaveBeenCalled();
    });
    expect(createMathjaxRendererMock).not.toHaveBeenCalled();
    expect(page[MATH_RENDERING_KEY]).toBe(host);
    expect(player.contains(host.renderMath.mock.calls[0][0])).toBe(true);
    // Called as a method, so a renderer that reads `this` works.
    expect(host.renderMath.mock.contexts[0]).toBe(host);
  });

  it('installs one MathJax 4 renderer for the page when the host installed none', async () => {
    const first = mountPlayer();
    const second = mountPlayer();

    await waitForAssertion(() => {
      const installed = page[MATH_RENDERING_KEY] as { renderMath: ReturnType<typeof vi.fn> };
      expect(installed?.renderMath).toBe(createMathjaxRendererMock.mock.results[0]?.value);
      const typeset = installed.renderMath.mock.calls.map(([element]) => element);
      expect(typeset.some((element) => first.contains(element))).toBe(true);
      expect(typeset.some((element) => second.contains(element))).toBe(true);
    });
    expect(createMathjaxRendererMock).toHaveBeenCalledTimes(1);
  });

  it('switches to a renderer the host installs after the player mounted', async () => {
    const before = hostRenderer();
    page[MATH_RENDERING_KEY] = before;
    const player = mountPlayer();
    await waitForAssertion(() => {
      expect(player.querySelector('pie-mock-math')).toBeTruthy();
      expect(before.renderMath).toHaveBeenCalled();
    });

    const after = hostRenderer();
    page[MATH_RENDERING_KEY] = after;
    player.querySelector('.element-player-mount')?.append(document.createElement('span'));

    await waitForAssertion(() => {
      expect(after.renderMath).toHaveBeenCalled();
    });
    expect(createMathjaxRendererMock).not.toHaveBeenCalled();
  });
});
