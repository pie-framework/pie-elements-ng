/**
 * The demo's answer to the `pie.accessibility` context (pie-players ADR 0003), standing in for a
 * Player. `&mathNames=outside` puts `mathOutsideNames` in its supports, so multiple-choice keeps
 * math out of choice names; without it the supports are empty and elements keep their defaults.
 * It lets the two choice-naming patterns of PIE-1244 be compared on the same item and player.
 */

const ACCESSIBILITY_CONTEXT = Symbol.for('pie.accessibility');

type AccessibilityValue = { supports: readonly string[] };
type ContextCallback = (value: AccessibilityValue, unsubscribe: () => void) => void;

const subscribers = new Set<ContextCallback>();
let supports: readonly string[] = [];
let installed = false;

/** The supports a demo URL asks for. */
export function supportsFromUrl(url: URL): readonly string[] {
  return url.searchParams.get('mathNames') === 'outside' ? ['mathOutsideNames'] : [];
}

function answer(callback: ContextCallback): void {
  callback({ supports }, () => subscribers.delete(callback));
}

/** Answers every accessibility request on the page with `next`, and tells subscribers when it changes. */
export function provideAccessibilitySupports(next: readonly string[]): void {
  const changed = next.join(' ') !== supports.join(' ');
  supports = next;
  if (!installed && typeof document !== 'undefined') {
    installed = true;
    // Capturing on the document answers before an element's own listeners, whichever player built it.
    document.addEventListener(
      'context-request',
      (event) => {
        const request = event as Event & {
          context?: unknown;
          callback?: ContextCallback;
          subscribe?: boolean;
        };
        if (request.context !== ACCESSIBILITY_CONTEXT || typeof request.callback !== 'function')
          return;
        event.stopPropagation();
        if (request.subscribe) subscribers.add(request.callback);
        answer(request.callback);
      },
      true
    );
  }
  if (changed) for (const callback of subscribers) answer(callback);
}
