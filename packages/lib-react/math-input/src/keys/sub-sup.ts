// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/sub-sup.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

const set = mkSet('sub-sup');

export const superscript = set({
  name: 'Superscript',
  latex: 'x^{}',
  command: '^',
});

export const subscript = set({
  name: 'Subscript',
  latex: 'x_{}',
  command: '_',
});
