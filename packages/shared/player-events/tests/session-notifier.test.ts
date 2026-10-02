import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SESSION_COMMIT_METHOD,
  createSessionNotifier,
  flushSessionNotifiers,
} from '../src/session-notifier.js';

/**
 * `pie-players` declares this same literal in
 * `packages/players-shared/src/pie/session-commit.ts`: a shared package for one
 * string would buy a cross-repo dependency neither side otherwise needs, so
 * each side pins it. A rename here alone leaves the player reading the session
 * shape instead, which loses the element's own `complete` semantics with no
 * error.
 */
describe('SESSION_COMMIT_METHOD', () => {
  it('is the method name pie-players looks for', () => {
    expect(SESSION_COMMIT_METHOD).toBe('commitPendingSession');
  });
});

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

  it('dispatches a pending notification on flush and not again on the timer', () => {
    const host = {};
    const dispatch = vi.fn();
    const notifier = createSessionNotifier(host, dispatch, { delayMs: 1500 });

    notifier.notify();
    notifier.flush();
    expect(dispatch).toHaveBeenCalledTimes(1);

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

  it('contains a throwing dispatch and warns instead of swallowing it', () => {
    // A flush runs on teardown, mid-unmount: the throw must not take the rest
    // of `disconnectedCallback` with it, and it must not be silent either.
    const host = {};
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const notifier = createSessionNotifier(
      host,
      () => {
        throw new Error('dispatch failed');
      },
      { delayMs: 1500 }
    );

    notifier.notify();
    expect(() => notifier.flush()).not.toThrow();

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});
