// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/fractions.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

const set = mkSet('fractions');

export const blankOverBlank = set({
  name: 'blank/blank',
  latex: '\\frac{}{}',
  command: '\\frac',
  ariaLabel: 'fraction',
});

export const xOverBlank = set({
  latex: '\\frac{x}{ }',
  name: 'X/blank',
  label: 'x/[]',
  command: '/',
  ariaLabel: 'x over blank fraction',
});

export const xBlankBlank = set({
  name: 'X (blank/blank)',
  latex: 'x\\frac{}{}',
  label: 'x([]/[])',
  command: '\\frac',
  ariaLabel: 'mixed number',
});
