// @ts-nocheck

import { mkSet } from './utils.js';

const set = mkSet('logic');

export const therefore = set({
  name: 'Therefore',
  label: '∴',
  write: '∴',
});

export const longDivision = set({
  name: 'Long division',
  latex: '\\longdiv{}',
  command: '\\longdiv',
});
