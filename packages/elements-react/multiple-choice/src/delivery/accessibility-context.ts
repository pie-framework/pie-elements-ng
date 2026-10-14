/**
 * The student's accessibility supports, read from the Player through the `pie.accessibility`
 * context (pie-players ADR 0003) with the Web Components `context-request` protocol.
 *
 * The request bubbles from the element to whichever ancestor provides the context; a provider
 * that connects later answers a subscribing request when the page's context root replays it. An
 * unanswered request means the Player provides no context, so the element keeps its defaults and
 * never waits. Lives here until a second element reads the context.
 */

export const ACCESSIBILITY_CONTEXT = Symbol.for('pie.accessibility');

/** The support id that opts a student into spoken math in control names (PIE-1244). */
export const SPOKEN_MATH_NAMES = 'spokenMathNames';

type Unsubscribe = () => void;
type ContextCallback = (value: unknown, unsubscribe?: Unsubscribe) => void;

class ContextRequestEvent extends Event {
  readonly context: symbol;
  readonly contextTarget: Element;
  readonly callback: ContextCallback;
  readonly subscribe: boolean;

  constructor(context: symbol, contextTarget: Element, callback: ContextCallback, subscribe: boolean) {
    super('context-request', { bubbles: true, composed: true });
    this.context = context;
    this.contextTarget = contextTarget;
    this.callback = callback;
    this.subscribe = subscribe;
  }
}

/** The `supports` of a context value, or none when the value has another shape. */
function supportsOf(value: unknown): readonly string[] {
  const supports = (value as { supports?: unknown } | null | undefined)?.supports;
  return Array.isArray(supports) ? supports.filter((id): id is string => typeof id === 'string') : [];
}

/**
 * Calls `onChange` with the supports in effect for `element` each time its provider answers.
 * Returns the function that ends the subscription.
 */
export function subscribeAccessibilitySupports(
  element: Element,
  onChange: (supports: readonly string[]) => void,
): Unsubscribe {
  let ended = false;
  let unsubscribeProvider: Unsubscribe | undefined;

  element.dispatchEvent(
    new ContextRequestEvent(
      ACCESSIBILITY_CONTEXT,
      element,
      (value, unsubscribe) => {
        if (ended) {
          unsubscribe?.();
          return;
        }
        if (unsubscribe && unsubscribe !== unsubscribeProvider) {
          unsubscribeProvider?.();
          unsubscribeProvider = unsubscribe;
        }
        onChange(supportsOf(value));
      },
      true,
    ),
  );

  return () => {
    ended = true;
    unsubscribeProvider?.();
    unsubscribeProvider = undefined;
  };
}
