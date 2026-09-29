import { describe, expect, it } from 'vitest';
import { writeSessionInPlace } from '../src/write-session-in-place.js';

// Players register elements under a versioned tag and stamp it on the session.
const PLAYER_TAG = 'simple-cloze--version-0-2-0';

describe('writeSessionInPlace', () => {
  it('keeps the target reference so a player reading its own object sees the response', () => {
    // The defect this exists for: a player hands the element a session object,
    // reads the response back off that object, and an element that replaced its
    // own reference left the player's entry at its load-time value.
    const playerSession: Record<string, unknown> = { id: '1', element: PLAYER_TAG };

    const written = writeSessionInPlace(playerSession, {
      id: '1',
      element: PLAYER_TAG,
      value: 'b',
    });

    expect(written).toBe(playerSession);
    expect(playerSession.value).toBe('b');
  });

  it('removes keys the update dropped, so a cleared response clears', () => {
    const playerSession: Record<string, unknown> = { id: '1', value: 'b', stale: true };

    writeSessionInPlace(playerSession, { id: '1', value: '' });

    expect(playerSession).toEqual({ id: '1', value: '' });
  });

  it('leaves the update as the replacement when there is no object to write into', () => {
    const next = { id: '1', value: 'b' };
    expect(writeSessionInPlace(null, next)).toBe(next);
    expect(writeSessionInPlace(undefined, next)).toBe(next);
  });

  it('does not write an array session in place', () => {
    // No element ships one, and half-assigning indices onto an existing array
    // is worse than replacing it.
    const target: unknown[] = ['a'];
    const next = ['b', 'c'];
    expect(writeSessionInPlace(target, next)).toBe(next);
    expect(target).toEqual(['a']);
  });

  it('is a no-op when the update is the object it would write into', () => {
    const session = { id: '1', value: 'b' };
    expect(writeSessionInPlace(session, session)).toBe(session);
    expect(session).toEqual({ id: '1', value: 'b' });
  });

  it('returns the replacement for a frozen target instead of throwing', () => {
    // A throw here would land before the element stored the update, losing the
    // learner's response rather than just the player's view of it.
    const frozen = Object.freeze({ id: '1' });
    const next = { id: '1', value: 'b' };

    expect(writeSessionInPlace(frozen, next)).toBe(next);
  });

  it('returns the replacement for a sealed target', () => {
    const sealed = Object.seal({ id: '1' });
    const next = { id: '1', value: 'b' };

    expect(writeSessionInPlace(sealed, next)).toBe(next);
  });
});
