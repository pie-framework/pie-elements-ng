/**
 * Deferred `session-changed` notification with a guaranteed commit.
 *
 * Delivery elements coalesce repeated session writes so a host backend is not
 * driven at input rate. A raw `debounce` drops the pending notification when the
 * element is torn down inside its own window, which loses the learner's last
 * response with no event the host could have detected. A notifier created here
 * is registered against its host element, so one `flushSessionNotifiers(host)`
 * call in `disconnectedCallback` commits every pending notification the element
 * owns, whatever its internal structure.
 *
 * The element contract this supports: session state is written synchronously on
 * commit, and only the `session-changed` dispatch is deferred. A host or player
 * reading `element.session` then always sees the committed response.
 */

/**
 * Method installed on a host that owns at least one notifier. A player calls it
 * on each mounted element before discarding it, so the element dispatches its
 * own event — with its own `complete` semantics — while still attached and
 * therefore still able to reach a `document`-level listener.
 */
export const SESSION_COMMIT_METHOD = 'commitPendingSession';

export interface SessionNotifier {
  /** Schedule a dispatch, coalescing repeated calls inside the delay window. */
  notify(): void;
  /** Dispatch immediately if one is pending; no-op otherwise. */
  flush(): void;
  /** Drop a pending dispatch without dispatching. */
  cancel(): void;
  /** True while a scheduled dispatch has not run yet. */
  readonly pending: boolean;
  /** Unregister from the host. The notifier is inert afterwards. */
  dispose(): void;
}

export interface SessionNotifierOptions {
  /**
   * Trailing-edge delay in milliseconds. A function is evaluated on every
   * `notify()`, for elements whose delay depends on their model. Default 0,
   * which defers to the next macrotask.
   */
  delayMs?: number | (() => number);
  /**
   * Upper bound on how long repeated `notify()` calls may postpone a dispatch.
   */
  maxWaitMs?: number;
  /**
   * Called when a dispatch throws during `flush()`. The throw is contained
   * either way - a commit runs on teardown, where an element is mid-unmount -
   * but a silent catch makes a lost response indistinguishable from no
   * response. Defaults to `console.warn`.
   */
  onDispatchError?: (error: unknown) => void;
}

type Timer = ReturnType<typeof setTimeout>;

const notifiersByHost = new WeakMap<object, Set<SessionNotifier>>();

function register(host: object, notifier: SessionNotifier): void {
  let notifiers = notifiersByHost.get(host);
  if (!notifiers) {
    notifiers = new Set();
    notifiersByHost.set(host, notifiers);
  }
  notifiers.add(notifier);
}

/**
 * Own property only. `Object.hasOwn` needs an ES2022 lib this package does not
 * target, and `hasOwnProperty` off the instance is unsafe on an arbitrary host.
 */
function hasOwnCommitMethod(host: object): boolean {
  return Object.getOwnPropertyDescriptor(host, SESSION_COMMIT_METHOD) !== undefined;
}

function installCommitMethod(host: object): void {
  // Own property, not `in`: an element class that declares its own
  // `commitPendingSession` on the prototype would otherwise keep it, and a
  // player calling that method would count the element as committed while the
  // notifier's pending dispatch was never flushed. The install wraps whatever
  // was there so both run.
  if (hasOwnCommitMethod(host)) return;
  const inherited = (host as Record<string, unknown>)[SESSION_COMMIT_METHOD];
  Object.defineProperty(host, SESSION_COMMIT_METHOD, {
    value: () => {
      if (typeof inherited === 'function') {
        try {
          (inherited as () => void).call(host);
        } catch {
          // The element's own commit is not allowed to strand the notifiers.
        }
      }
      flushSessionNotifiers(host);
    },
    configurable: true,
    enumerable: false,
    writable: true,
  });
}

function uninstallCommitMethod(host: object): void {
  if (!hasOwnCommitMethod(host)) return;
  try {
    delete (host as Record<string, unknown>)[SESSION_COMMIT_METHOD];
  } catch {
    // Non-configurable, so the fallback stays suppressed for this element.
  }
}

export function createSessionNotifier(
  host: object,
  dispatch: () => void,
  options: SessionNotifierOptions = {}
): SessionNotifier {
  const configuredDelay = options.delayMs;
  const resolveDelay: () => number =
    typeof configuredDelay === 'function' ? configuredDelay : () => configuredDelay ?? 0;
  const maxWaitMs = options.maxWaitMs;
  const reportDispatchError =
    options.onDispatchError ??
    ((error: unknown) => {
      console.warn('[session-notifier] a committed session-changed dispatch threw', error);
    });

  let delayTimer: Timer | null = null;
  let maxWaitTimer: Timer | null = null;
  let pending = false;
  let disposed = false;

  const clearTimers = (): void => {
    if (delayTimer !== null) {
      clearTimeout(delayTimer);
      delayTimer = null;
    }
    if (maxWaitTimer !== null) {
      clearTimeout(maxWaitTimer);
      maxWaitTimer = null;
    }
  };

  const invoke = (): void => {
    clearTimers();
    if (!pending) return;
    pending = false;
    dispatch();
  };

  const notifier: SessionNotifier = {
    notify(): void {
      if (disposed) return;
      pending = true;
      if (delayTimer !== null) clearTimeout(delayTimer);
      delayTimer = setTimeout(invoke, Math.max(0, resolveDelay()));
      if (maxWaitMs !== undefined && maxWaitTimer === null) {
        maxWaitTimer = setTimeout(invoke, Math.max(0, maxWaitMs));
      }
    },
    flush(): void {
      if (!pending) {
        clearTimers();
        return;
      }
      try {
        invoke();
      } catch (error) {
        // A commit runs on teardown, where an element is mid-unmount. A throwing
        // dispatch must not take the rest of the teardown with it.
        reportDispatchError(error);
      }
    },
    cancel(): void {
      pending = false;
      clearTimers();
    },
    get pending(): boolean {
      return pending;
    },
    dispose(): void {
      disposed = true;
      pending = false;
      clearTimers();
      const notifiers = notifiersByHost.get(host);
      notifiers?.delete(notifier);
      if (notifiers && notifiers.size === 0) {
        // Leaving the method installed makes a player count the element as
        // having committed itself, which permanently suppresses the
        // synthesized fallback for an element that no longer defers anything.
        notifiersByHost.delete(host);
        uninstallCommitMethod(host);
      }
    },
  };

  register(host, notifier);
  installCommitMethod(host);
  return notifier;
}

/**
 * Dispatch every pending notification registered against `host`. Call this from
 * `disconnectedCallback` before unmounting the element's render tree.
 */
export function flushSessionNotifiers(host: object): void {
  const notifiers = notifiersByHost.get(host);
  if (!notifiers) return;
  for (const notifier of [...notifiers]) {
    notifier.flush();
  }
}
