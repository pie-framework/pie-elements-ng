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

class RolePrintElement extends HTMLElement {
  printRole: unknown;

  set role(value: unknown) {
    this.printRole = value;
  }

  set options(_value: unknown) {}
}
customElements.define('pie-mock-role-print', RolePrintElement);

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

function printPlayer() {
  const player = document.createElement('pie-element-player') as HTMLElement & {
    elementName: string;
    packageName: string;
    view: string;
  };
  player.elementName = 'multiple-choice';
  player.packageName = '@pie-element/multiple-choice';
  player.view = 'print';
  return player;
}

describe('PieElementPlayer role', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    loadUnifiedPlayerMock.mockReset();
    loadUnifiedPlayerMock.mockResolvedValue({
      strategy: 'esm',
      view: 'print',
      tagName: 'pie-mock-role-print',
    });
  });

  it('leaves the ARIA role attribute off the host', async () => {
    const player = printPlayer();
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(player.querySelector<RolePrintElement>('pie-mock-role-print')?.printRole).toBe(
        'student'
      );
    });
    expect(player.hasAttribute('role')).toBe(false);
  });

  it('passes a role attribute through to the print element', async () => {
    const player = printPlayer();
    player.setAttribute('role', 'instructor');
    document.body.appendChild(player);

    await waitForAssertion(() => {
      expect(player.querySelector<RolePrintElement>('pie-mock-role-print')?.printRole).toBe(
        'instructor'
      );
    });
  });
});
