// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/constants.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

const set = mkSet('constants');

export const pi = set({
  name: 'Pi',
  label: 'π',
  latex: '\\pi',
  command: '\\pi',
  category: 'constants',
});

export const eulers = set({
  name: 'Eulers',
  label: 'e',
  latex: 'e',
  command: 'e',
  category: 'constants',
});

export const infinity = set({
  name: 'Infinity',
  label: '\\infty',
  latex: '\\infty',
  command: '\\infty',
  category: 'constants',
});

export const halfInfinity = set({
  name: 'Half Infinity',
  label: '\\propto',
  latex: '\\propto',
  command: '\\propto',
  category: 'constants',
});
