import { SessionChangedEvent } from '@pie-element/shared-player-events';

export type DeliveryHostElement = HTMLElement & {
  session?: unknown;
  onSessionChange?: (session: unknown) => void;
  onAudioStarted?: () => void;
  onAudioEnded?: () => void;
};

type HostPredicate = (node: unknown) => boolean;

const hasDeliveryCallbacks: HostPredicate = (node: unknown): boolean => {
  const maybeHost = node as DeliveryHostElement | null;
  if (!maybeHost) return false;
  return (
    typeof maybeHost.onSessionChange === 'function' ||
    typeof maybeHost.onAudioStarted === 'function' ||
    typeof maybeHost.onAudioEnded === 'function'
  );
};

export interface ResolveDeliveryHostOptions {
  hostPredicate?: HostPredicate;
}

/**
 * Walk up the DOM from a source element and find the nearest delivery host wrapper.
 *
 * There is no lookup by tag name: a player registers the element under a tag it
 * chooses (versioned, e.g. `simple-cloze--version-0-2-0`), so the element cannot
 * know it, and a document-wide query could reach a different instance.
 */
export function resolveDeliveryHost(
  sourceEl?: HTMLElement | null,
  options: ResolveDeliveryHostOptions = {}
): DeliveryHostElement | null {
  const hostPredicate = options.hostPredicate ?? hasDeliveryCallbacks;
  let cursor: HTMLElement | null | undefined = sourceEl;

  while (cursor) {
    if (hostPredicate(cursor)) {
      return cursor as DeliveryHostElement;
    }
    cursor = cursor.parentElement;
  }

  return null;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Assign a delivery update into the session object the player owns, keeping the
 * reference.
 *
 * A player hands the element a session object and reads the learner's response
 * back off that same object: `pie-player` pushes its entry into the host's own
 * `session.data` array, and `pie-item-player`'s renderer forwards the array it
 * holds rather than `element.session`. An element that only replaces its own
 * reference leaves the player's entry at its load-time value, so the forwarded
 * container compares equal to the previous one and normalizes to
 * `intent: "metadata-only"` with `session: null` - the element reports a change
 * and the response never arrives. The React elements mutate the session they
 * were given (`updateSessionValue`); this is that contract for the Svelte
 * elements, which additionally hand their component a fresh reference so
 * `$derived` reads of `props.session` still re-run.
 *
 * Keys absent from `next` are removed, so clearing a response clears it on the
 * player's object too. Anything that is not a plain object on both sides is
 * returned as the replacement it already was, and so is a frozen or sealed
 * target: writing into one throws in strict mode, which would take the
 * learner's update with it before the element ever stored it.
 */
export function writeSessionInPlace(target: unknown, next: unknown): unknown {
  if (target === next) return target;
  if (!isPlainObject(target) || !isPlainObject(next)) return next;
  if (Object.isFrozen(target) || !Object.isExtensible(target)) return next;
  try {
    for (const key of Object.keys(target)) {
      if (!(key in next)) delete target[key];
    }
    Object.assign(target, next);
  } catch {
    // A non-writable or non-configurable key on an otherwise extensible object.
    return next;
  }
  return target;
}

export interface ForwardSessionChangeOptions {
  sourceEl?: HTMLElement | null;
  complete: boolean;
  session: unknown;
}

/**
 * Forward a delivery session update using the host callback when available.
 * If no callback is exposed, write the update into the host's session, as
 * `writeSessionInPlace` does for a wrapper, and dispatch the canonical
 * session-changed metadata event, named for the tag the host was registered
 * under: the event carries no session, so a player reads the response off it.
 */
export function forwardSessionChange({
  sourceEl,
  complete,
  session,
}: ForwardSessionChangeOptions): DeliveryHostElement | null {
  const host = resolveDeliveryHost(sourceEl);
  if (!host) {
    return null;
  }

  if (typeof host.onSessionChange === 'function') {
    host.onSessionChange(session);
    return host;
  }

  const written = writeSessionInPlace(host.session, session);
  if (written !== host.session) host.session = written;
  host.dispatchEvent(new SessionChangedEvent(host.tagName.toLowerCase(), complete));
  return host;
}
