// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/container/marks.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const marks = (state = [], action) => {
  switch (action.type) {
    case 'CHANGE_MARKS':
      if (Array.isArray(action.marks)) {
        return action.marks;
      } else {
        throw new Error('marks must be an array');
      }
    default:
      return state;
  }
};

export default marks;
