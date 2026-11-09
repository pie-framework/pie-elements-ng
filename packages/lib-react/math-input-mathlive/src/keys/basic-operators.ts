// @ts-nocheck

import { DIVIDE, MULTIPLY } from './chars.js';
import { mkSet } from './utils.js';

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
