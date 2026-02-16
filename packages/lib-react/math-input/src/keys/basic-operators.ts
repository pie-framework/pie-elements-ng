// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/basic-operators.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { DIVIDE, MULTIPLY } from './chars';
import { mkSet } from './utils';

const set = mkSet('operators');

export const equals = set({
  write: '=',
  label: '=',
});

export const plus = set({
  write: '+',
  label: '+',
});

export const minus = set({
  write: '−',
  label: '−',
});

export const divide = set({
  name: 'divide',
  label: DIVIDE,
  command: '\\divide',
  otherNotation: '\\div',
});

export const multiply = set({
  name: 'multiply',
  label: MULTIPLY,
  command: '\\times',
});
