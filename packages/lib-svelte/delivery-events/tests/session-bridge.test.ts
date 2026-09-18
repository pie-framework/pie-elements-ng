import { describe, expect, it, vi } from 'vitest';
import {
  forwardSessionChange,
  resolveDeliveryHost,
  writeSessionInPlace,
} from '../src/session-bridge.js';

describe('writeSessionInPlace', () => {
  it('keeps the target reference so a player reading its own object sees the response', () => {
    // The defect this exists for: a player hands the element a session object,
    // reads the response back off that object, and an element that replaced its
    // own reference left the player's entry at its load-time value.
    const playerSession: Record<string, unknown> = { id: '1', element: 'mc-populated-blank' };

    const written = writeSessionInPlace(playerSession, {
      id: '1',
      element: 'mc-populated-blank',
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
});

describe('forwardSessionChange', () => {
  function mountHost() {
    const host = document.createElement('div') as HTMLDivElement & {
      session?: unknown;
      onSessionChange?: (session: unknown) => void;
    };
    const inner = document.createElement('span');
    host.appendChild(inner);
    document.body.appendChild(host);
    return { host, inner };
  }

  it('hands the host the update, leaving the write-through to the element wrapper', () => {
    // The component builds a fresh object on every change and the wrapper writes
    // it into the player's session. The fresh reference is what makes the
    // component's own `$derived` reads of `props.session` re-run, so the bridge
    // must not substitute the player's object here.
    const { host, inner } = mountHost();
    host.session = { id: '1' };
    const onSessionChange = vi.fn();
    host.onSessionChange = onSessionChange;
    const next = { id: '1', value: 'b' };

    const resolved = forwardSessionChange({
      sourceEl: inner,
      component: 'mc-populated-blank',
      complete: true,
      session: next,
    });

    expect(resolved).toBe(host);
    expect(onSessionChange).toHaveBeenCalledWith(next);
    host.remove();
  });

  it('dispatches the metadata event when the host exposes no session callback', () => {
    const { host, inner } = mountHost();
    host.onAudioEnded = () => {};
    const events: CustomEvent[] = [];
    host.addEventListener('session-changed', (event) => events.push(event as CustomEvent));

    forwardSessionChange({
      sourceEl: inner,
      component: 'simple-cloze',
      complete: false,
      session: { id: '1' },
    });

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ complete: false, component: 'simple-cloze' });
    host.remove();
  });

  it('returns null when no delivery host is in the ancestor chain', () => {
    const orphan = document.createElement('span');
    expect(
      forwardSessionChange({
        sourceEl: orphan,
        component: 'mc-populated-blank',
        complete: false,
        session: {},
      })
    ).toBeNull();
  });
});

describe('resolveDeliveryHost', () => {
  it('finds the nearest ancestor exposing a delivery callback', () => {
    const outer = document.createElement('div') as HTMLDivElement & {
      onSessionChange?: () => void;
    };
    const middle = document.createElement('div') as HTMLDivElement & { onAudioEnded?: () => void };
    const leaf = document.createElement('span');
    outer.onSessionChange = () => {};
    middle.onAudioEnded = () => {};
    outer.appendChild(middle);
    middle.appendChild(leaf);

    expect(resolveDeliveryHost(leaf)).toBe(middle);
  });
});
