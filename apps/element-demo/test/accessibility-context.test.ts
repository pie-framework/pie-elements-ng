import { describe, expect, it } from 'vitest';

import {
  provideAccessibilitySupports,
  supportsFromUrl,
} from '../src/lib/config/accessibility-context';

type Unsubscribe = () => void;

/** A consumer that, as Lit's ContextConsumer does, calls its old unsubscribe when a different one arrives. */
function subscribe(target: EventTarget) {
  const seen: Array<readonly string[]> = [];
  let held: Unsubscribe | undefined;
  const event = Object.assign(new Event('context-request', { bubbles: true, composed: true }), {
    context: Symbol.for('pie.accessibility'),
    subscribe: true,
    callback: (value: { supports: readonly string[] }, unsubscribe: Unsubscribe) => {
      if (held && held !== unsubscribe) held();
      held = unsubscribe;
      seen.push(value.supports);
    },
  });
  target.dispatchEvent(event);
  return seen;
}

describe('demo accessibility context', () => {
  it('reads the math-names pattern from the URL', () => {
    expect(supportsFromUrl(new URL('http://x/?mathNames=outside'))).toEqual(['mathOutsideNames']);
    expect(supportsFromUrl(new URL('http://x/'))).toEqual([]);
  });

  it('keeps a subscriber through every change of the URL', () => {
    provideAccessibilitySupports(['mathOutsideNames']);
    const element = document.createElement('div');
    document.body.appendChild(element);
    const seen = subscribe(element);

    provideAccessibilitySupports([]);
    provideAccessibilitySupports(['mathOutsideNames']);
    provideAccessibilitySupports([]);

    expect(seen).toEqual([['mathOutsideNames'], [], ['mathOutsideNames'], []]);
    element.remove();
  });
});
