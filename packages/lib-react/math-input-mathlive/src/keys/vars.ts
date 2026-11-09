// @ts-nocheck

import { mkSet } from './utils.js';

const set = mkSet('vars');

export const x = set({
  name: 'X',
  latex: 'x',
  write: 'x',
});
export const y = set({
  name: 'Y',
  latex: 'y',
  write: 'y',
});
export const theta = set({
  name: 'Theta',
  latex: '\\theta',
  write: '\\theta',
});
