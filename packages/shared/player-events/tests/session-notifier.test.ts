import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_COMMIT_METHOD,
  createSessionNotifier,
  flushSessionNotifiers,
} from '../src/session-notifier.js';

describe('createSessionNotifier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('coalesces repeated notifications into one trailing dispatch', () => {
    const host = {};
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 200 });

    notifier.notify();
    notifier.notify();
    notifier.notify();
    expect(dispatch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('bounds postponement with maxWaitMs', () => {
    const host = {};
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 200, maxWaitMs: 200 });

    for (let i = 0; i < 10; i += 1) {
      notifier.notify();
      vi.advanceTimersByTime(50);
    }

    expect(dispatch).toHaveBeenCalled();
  });

  it('dispatches a pending notification on flush and reports it as no longer pending', () => {
    const host = {};
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 1500 });

    notifier.notify();
    expect(notifier.pending).toBe(true);

    notifier.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(notifier.pending).toBe(false);

    vi.advanceTimersByTime(1500);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('is a no-op on flush when nothing is pending', () => {
    const host = {};
    const dispatch = vi.fn();
    createSessionNotifier(host, dispatch, { delayMs: 1500 });

    flushSessionNotifiers(host);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('drops a pending notification on cancel', () => {
    const host = {};
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 200 });

    notifier.notify();
    notifier.cancel();
    vi.advanceTimersByTime(1000);

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('flushes every notifier registered against one host', () => {
    const host = {};
    const value = vi.fn();
    const comment = vi.fn();
    const valueNotifier = createSessionNotifier(host, value, { delayMs: 1500 });
    const commentNotifier = createSessionNotifier(host, comment, { delayMs: 1500 });

    valueNotifier.notify();
    commentNotifier.notify();
    flushSessionNotifiers(host);

    expect(value).toHaveBeenCalledTimes(1);
    expect(comment).toHaveBeenCalledTimes(1);
  });

  it('keeps flushing the remaining notifiers when one dispatch throws', () => {
    const host = {};
    const second = vi.fn();
    const first = createSessionNotifier(
      host,
      () => {
        throw new Error('dispatch failed');
      },
      { delayMs: 1500 }
    );
    const rest = createSessionNotifier(host, second, { delayMs: 1500 });

    first.notify();
    rest.notify();
    expect(() => flushSessionNotifiers(host)).not.toThrow();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('installs a commit method a player can call without knowing the element', () => {
    const host: Record<string, unknown> = {};
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 1500 });

    notifier.notify();
    expect(typeof host[SESSION_COMMIT_METHOD]).toBe('function');
    (host[SESSION_COMMIT_METHOD] as () => void)();

    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('re-evaluates a function delay on every notification', () => {
    const host = {};
    const dispatch = vi.fn();
    let delay = 200;
    const notifier = createSessionNotifier(host, dispatch, { delayMs: () => delay });

    notifier.notify();
    vi.advanceTimersByTime(200);
    expect(dispatch).toHaveBeenCalledTimes(1);

    delay = 0;
    notifier.notify();
    vi.advanceTimersByTime(0);
    expect(dispatch).toHaveBeenCalledTimes(2);
  });

  it('stops notifying and unregisters after dispose', () => {
    const host = {};
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 200 });

    notifier.notify();
    notifier.dispose();
    vi.advanceTimersByTime(1000);
    notifier.notify();
    flushSessionNotifiers(host);

    expect(dispatch).not.toHaveBeenCalled();
    expect(notifier.pending).toBe(false);
  });

  it('removes the commit method once the last notifier is disposed', () => {
    // Left installed, a player counts the element as having committed itself
    // and never falls back to synthesizing one, so the element goes silent.
    const host: Record<string, unknown> = {};
    const notifier = createSessionNotifier(host, vi.fn(), { delayMs: 200 });
    expect(typeof host[SESSION_COMMIT_METHOD]).toBe('function');

    notifier.dispose();

    expect(SESSION_COMMIT_METHOD in host).toBe(false);
  });

  it('keeps the commit method while another notifier is still registered', () => {
    const host: Record<string, unknown> = {};
    const first = createSessionNotifier(host, vi.fn(), { delayMs: 200 });
    createSessionNotifier(host, vi.fn(), { delayMs: 200 });

    first.dispose();

    expect(typeof host[SESSION_COMMIT_METHOD]).toBe('function');
  });

  it('runs an element-declared commit method as well as its own', () => {
    // `in` walks the prototype chain, so an element class declaring its own
    // `commitPendingSession` used to keep it - and a player calling that method
    // counted the element as committed while the pending dispatch was dropped.
    const ownCommit = vi.fn();
    class ElementWithOwnCommit {
      [SESSION_COMMIT_METHOD]() {
        ownCommit();
      }
    }
    const host = new ElementWithOwnCommit() as unknown as Record<string, unknown>;
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 1500 });

    notifier.notify();
    (host[SESSION_COMMIT_METHOD] as () => void)();

    expect(ownCommit).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('reports a throwing dispatch instead of swallowing it', () => {
    const host = {};
    const onDispatchError = vi.fn();
    const notifier = createSessionNotifier(
      host,
      () => {
        throw new Error('dispatch failed');
      },
      { delayMs: 1500, onDispatchError }
    );

    notifier.notify();
    notifier.flush();

    expect(onDispatchError).toHaveBeenCalledTimes(1);
  });
});
