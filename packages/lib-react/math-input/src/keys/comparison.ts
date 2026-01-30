// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/comparison.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const set = (o) => ({ ...o, category: 'comparison' });

export const lessThan = set({
  name: 'Less than',
  latex: '<',
  command: '\\lt',
});

export const greaterThan = set({
  name: 'Greater than',
  latex: '>',
  command: '\\gt',
});

export const lessThanEqual = set({
  name: 'Less than or equal',
  latex: '\\le',
  symbol: '<=',
  command: '\\le',
  ariaLabel: 'less than or equal to',
});

export const greaterThanEqual = set({
  name: 'Greater than or equal',
  symbol: '>=',
  command: '\\ge',
  latex: '\\ge',
});
