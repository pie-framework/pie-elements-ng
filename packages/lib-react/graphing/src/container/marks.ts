// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/container/marks.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
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
