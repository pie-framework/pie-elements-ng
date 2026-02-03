// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/container/middleware.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

let lastAction = null;
export const getLastAction = () => lastAction;

export const lastActionMiddleware = () => (next) => (action) => {
  lastAction = action;
  return next(action);
};
