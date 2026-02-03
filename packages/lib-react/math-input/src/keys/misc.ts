// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/misc.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

const set = mkSet('misc');

export const plusMinus = set({
  name: 'Plus or Minus',
  latex: '\\pm',
  write: '\\pm',
});

export const absValue = set({
  name: 'Absolute Value',
  latex: '\\abs{}',
  symbol: '| |',
  command: '|',
});

export const parenthesis = set({
  name: 'Parenthesis',
  latex: '\\left(\\right)',
  symbol: '( )',
  command: '(',
});

export const brackets = set({
  name: 'Brackets',
  latex: '\\left[\\right]',
  symbol: '[ ]',
  command: '[',
});

export const percentage = set({
  name: 'Percent',
  latex: '%',
  command: '%',
});

export const approx = set({
  latex: '\\approx',
  command: '\\approx',
  ariaLabel: 'Approximately equal to',
});

export const nApprox = set({
  latex: '\\napprox',
  command: '\\napprox',
  ariaLabel: 'Not pproximately equal to',
});

export const notEqual = set({
  latex: '\\neq',
  command: '\\neq',
  ariaLabel: 'Not equals',
});

export const similar = set({
  latex: '\\sim',
  command: '\\sim',
  ariaLabel: 'Similar',
});
export const notSimilar = set({
  latex: '\\nsim',
  command: '\\nsim',
  ariaLabel: 'Not similar',
});
