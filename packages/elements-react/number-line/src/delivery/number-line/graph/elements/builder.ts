// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/src/number-line/graph/elements/builder.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export function buildElementModel(position, elementType, domain, interval) {
  if (elementType.startsWith('p')) {
    return {
      position: position,
      type: 'point',
      pointType: elementType.endsWith('e') ? 'empty' : 'full',
    };
  } else if (elementType.startsWith('l')) {
    let left = position + interval <= domain.max ? position : position - interval;
    let right = left + interval;
    return {
      type: 'line',
      leftPoint: elementType.charAt(1) === 'e' ? 'empty' : 'full',
      rightPoint: elementType.charAt(2) === 'e' ? 'empty' : 'full',
      position: { left, right },
    };
  } else if (elementType.startsWith('r')) {
    let full = elementType.charAt(1) === 'f';
    let positive = elementType.charAt(2) === 'p';
    return {
      type: 'ray',
      direction: positive ? 'positive' : 'negative',
      pointType: full ? 'full' : 'empty',
      position: position,
    };
  }
}
