// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/exponent.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

const set = mkSet('exponent');

export const squared = set({
  name: 'Squared',
  latex: 'x^2',
  write: '^2',
});

export const xToPowerOfN = set({
  name: 'X to the power of n',
  latex: 'x^{}',
  command: '^',
  ariaLabel: 'exponent',
});

export const squareRoot = set({
  name: 'Square root',
  latex: '\\sqrt{}',
  command: '\\sqrt',
});

export const nthRoot = set({
  name: 'Nth root',
  latex: '\\sqrt[{}]{}',
  command: '\\nthroot',
});
