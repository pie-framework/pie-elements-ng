import { describe, expect, it, vi } from 'vitest';
import {
  forwardSessionChange,
  resolveDeliveryHost,
  writeSessionInPlace,
} from '../src/session-bridge.js';

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

describe('forwardSessionChange', () => {
  function mountHost() {
    const host = document.createElement(PLAYER_TAG) as HTMLElement & {
      session?: unknown;
      onSessionChange?: (session: unknown) => void;
      onAudioEnded?: () => void;
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
      complete: true,
      session: next,
    });

    expect(resolved).toBe(host);
    expect(onSessionChange).toHaveBeenCalledWith(next);
    host.remove();
  });

  it('dispatches the metadata event under the tag the host was registered as', () => {
    const { host, inner } = mountHost();
    host.onAudioEnded = () => {};
    const events: CustomEvent[] = [];
    host.addEventListener('session-changed', (event) => events.push(event as CustomEvent));

    forwardSessionChange({
      sourceEl: inner,
      complete: false,
      session: { id: '1' },
    });

    expect(events).toHaveLength(1);
    expect(events[0].detail).toEqual({ complete: false, component: PLAYER_TAG });
    host.remove();
  });

  it('writes the update into the session the player gave a host without a session callback', () => {
    // The metadata event carries no session: the player reads the response off
    // the object it handed the element.
    const { host, inner } = mountHost();
    const playerSession = { id: '1', element: PLAYER_TAG };
    host.session = playerSession;
    host.onAudioEnded = () => {};
    let seenAtEvent: unknown = null;
    host.addEventListener('session-changed', () => {
      seenAtEvent = { ...(host.session as object) };
    });

    forwardSessionChange({
      sourceEl: inner,
      complete: true,
      session: { id: '1', element: PLAYER_TAG, value: 'b' },
    });

    expect(host.session).toBe(playerSession);
    expect(playerSession).toEqual({ id: '1', element: PLAYER_TAG, value: 'b' });
    expect(seenAtEvent).toEqual({ id: '1', element: PLAYER_TAG, value: 'b' });
    host.remove();
  });

  it('returns null and warns when no delivery host is in the ancestor chain', () => {
    // A host elsewhere in the document is another instance, never this one's.
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { host } = mountHost();
    const onSessionChange = vi.fn();
    host.onSessionChange = onSessionChange;
    const orphan = document.createElement('span');
    document.body.appendChild(orphan);

    expect(forwardSessionChange({ sourceEl: orphan, complete: false, session: {} })).toBeNull();
    expect(onSessionChange).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('<span>');
    host.remove();
    orphan.remove();
    warn.mockRestore();
  });

  it('warns once per source element, not on every update', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = document.createElement('input');
    const other = document.createElement('select');

    for (const value of ['a', 'ab', 'abc']) {
      forwardSessionChange({ sourceEl: input, complete: true, session: { value } });
    }
    forwardSessionChange({ sourceEl: other, complete: true, session: {} });

    expect(warn.mock.calls.map(([message]) => String(message).match(/<(\w+)>/)?.[1])).toEqual([
      'input',
      'select',
    ]);
    warn.mockRestore();
  });

  it('reaches a host that renders the element inside its own shadow root', () => {
    const host = document.createElement(PLAYER_TAG) as HTMLElement & {
      onSessionChange?: (session: unknown) => void;
    };
    const onSessionChange = vi.fn();
    host.onSessionChange = onSessionChange;
    const input = document.createElement('input');
    host.attachShadow({ mode: 'open' }).appendChild(input);
    document.body.appendChild(host);
    const next = { id: '1', value: 'b' };

    expect(forwardSessionChange({ sourceEl: input, complete: true, session: next })).toBe(host);
    expect(onSessionChange).toHaveBeenCalledWith(next);
    host.remove();
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

  it('continues from a shadow root to its host and on up the light DOM', () => {
    // The wrapper exposing the callback sits above a custom element that
    // renders the source inside a shadow root.
    const wrapper = document.createElement('div') as HTMLDivElement & {
      onSessionChange?: () => void;
    };
    wrapper.onSessionChange = () => {};
    const shadowHost = document.createElement('div');
    wrapper.appendChild(shadowHost);
    const inner = document.createElement('div');
    const leaf = document.createElement('span');
    inner.appendChild(leaf);
    shadowHost.attachShadow({ mode: 'open' }).appendChild(inner);

    expect(resolveDeliveryHost(leaf)).toBe(wrapper);
  });

  it('stops at a detached subtree with no shadow host', () => {
    const fragment = document.createDocumentFragment();
    const leaf = document.createElement('span');
    fragment.appendChild(leaf);

    expect(resolveDeliveryHost(leaf)).toBeNull();
  });
});
