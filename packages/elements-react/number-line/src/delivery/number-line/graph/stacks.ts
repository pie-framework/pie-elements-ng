// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/src/number-line/graph/stacks.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export default function Stacks(domain) {
  let stacks = [new Stack(domain)];

  this.add = function (el) {
    let stack = stacks.find((s) => s.add(el));
    if (stacks.indexOf(stack) === -1) {
      stack = new Stack(domain);
      stacks.push(stack);
      stack.add(el);
    }
    return stacks.indexOf(stack);
  };
}

export function Stack(domain) {
  let elements = [];
  /**
   * Try to add the element to the stack.
   * @return boolean true if added, else false
   */
  this.add = function (el) /*boolean*/ {
    let elementRange = getRange(el);
    if (elementRange.left < domain.min || elementRange.right > domain.max) {
      return false;
    }

    let touchesExisting = elements.some((e) => touchesRange(e, elementRange));

    if (touchesExisting) {
      return false;
    } else {
      elements.push(el);
      return true;
    }
  };

  this.elements = function () {
    return elements;
  };

  let touchesRange = (el, candidate) => {
    let existing = getRange(el);
    let leftOf = candidate.left < existing.left && candidate.right < existing.left;
    let rightOf = candidate.left > existing.right && candidate.right > existing.right;
    return !(leftOf || rightOf);
  };

  let getRange = (el) => {
    let { type, position } = el;

    switch (type) {
      case 'point':
        return { left: position, right: position };
      case 'line':
        return position;
      case 'ray':
        if (el.direction === 'positive') {
          return {
            left: position,
            right: domain.max,
          };
        } else {
          return {
            left: domain.min,
            right: position,
          };
        }
      default:
        return null;
    }
  };
}
