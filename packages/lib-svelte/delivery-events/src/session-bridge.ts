import { SessionChangedEvent } from '@pie-element/shared-player-events';

export type DeliveryHostElement = HTMLElement & {
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
  fallbackSelector?: string;
  hostPredicate?: HostPredicate;
}

/**
 * Walk up the DOM from a source element and find the nearest delivery host wrapper.
 * Falls back to selector lookup to support detached nested render roots.
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

  if (typeof document !== 'undefined' && options.fallbackSelector) {
    const fallback = document.querySelector(options.fallbackSelector);
    if (hostPredicate(fallback)) {
      return fallback as DeliveryHostElement;
    }
  }

  return null;
}

export interface ForwardSessionChangeOptions {
  sourceEl?: HTMLElement | null;
  fallbackSelector?: string;
  component: string;
  complete: boolean;
  session: unknown;
}

/**
 * Forward a delivery session update using the host callback when available.
 * If no callback is exposed, dispatch the canonical session-changed metadata event.
 */
export function forwardSessionChange({
  sourceEl,
  fallbackSelector,
  component,
  complete,
  session,
}: ForwardSessionChangeOptions): DeliveryHostElement | null {
  const host = resolveDeliveryHost(sourceEl, { fallbackSelector });
  if (!host) {
    return null;
  }

  if (typeof host.onSessionChange === 'function') {
    host.onSessionChange(session);
    return host;
  }

  host.dispatchEvent(new SessionChangedEvent(component, complete));
  return host;
}
