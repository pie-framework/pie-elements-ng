// @ts-nocheck

import { mkSet } from './utils.js';

const set = mkSet('operators');

export const circleDot = set({
  name: 'CircleDot',
  label: '⋅',
  write: '\\cdot',
  ariaLabel: 'Dot multiplier',
});
