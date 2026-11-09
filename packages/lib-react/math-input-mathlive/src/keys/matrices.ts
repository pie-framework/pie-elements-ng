// @ts-nocheck

import { mkSet } from './utils.js';

const set = mkSet('matrices');

export const singleCellMatrix = set({
  name: 'Single Cell Matrix',
  label: '[ ]',
  write: '\\begin{pmatrix}\\end{pmatrix}',
});

export const doubleCellMatrix = set({
  name: 'Double Cell Matrix',
  label: '[ ] [ ] \\\\newline [ ] [ ]',
  write: '\\begin{bmatrix}&\\\\&\\end{bmatrix}',
});
