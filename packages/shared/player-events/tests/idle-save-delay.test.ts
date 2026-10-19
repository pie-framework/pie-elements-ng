import { ContextProvider, sessionCommitContext } from '@pie-players/pie-context';
import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_IDLE_SAVE_DELAY_MS,
  resolveIdleSaveDelay,
  subscribeIdleSaveDelay,
} from '../src/idle-save-delay.js';

describe('resolveIdleSaveDelay', () => {
  it('keeps a finite, non-negative delay, 0 included', () => {
    expect(resolveIdleSaveDelay(800)).toBe(800);
    expect(resolveIdleSaveDelay(0)).toBe(0);
  });

  it('falls back to the default for anything else', () => {
    for (const value of [undefined, null, -1, Number.NaN, Number.POSITIVE_INFINITY, '800']) {
      expect(resolveIdleSaveDelay(value)).toBe(DEFAULT_IDLE_SAVE_DELAY_MS);
    }
  });
});

describe('subscribeIdleSaveDelay', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  function inPlayer(value: { idleSaveDelayMs?: number }) {
    const player = document.createElement('div');
    const provider = new ContextProvider(player, {
      context: sessionCommitContext,
      initialValue: value,
    });
    provider.connect();
    const host = document.createElement('div');
    player.appendChild(host);
    document.body.appendChild(player);
    return { host, provider };
  }

  it("takes the player's delay and follows a later change", () => {
    const { host, provider } = inPlayer({ idleSaveDelayMs: 800 });
    const delays: number[] = [];

    subscribeIdleSaveDelay(host, (delay) => delays.push(delay));
    provider.setValue({ idleSaveDelayMs: 0 });

    expect(delays).toEqual([800, 0]);
  });

  it('gives the default when the player leaves the delay out', () => {
    const { host } = inPlayer({});
    const delays: number[] = [];

    subscribeIdleSaveDelay(host, (delay) => delays.push(delay));

    expect(delays).toEqual([DEFAULT_IDLE_SAVE_DELAY_MS]);
  });

  it('is never called without a provider', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const delays: number[] = [];

    subscribeIdleSaveDelay(host, (delay) => delays.push(delay));

    expect(delays).toEqual([]);
  });

  it('stops following the player once cleaned up', () => {
    const { host, provider } = inPlayer({ idleSaveDelayMs: 800 });
    const delays: number[] = [];

    subscribeIdleSaveDelay(host, (delay) => delays.push(delay))();
    provider.setValue({ idleSaveDelayMs: 0 });

    expect(delays).toEqual([800]);
  });
});
