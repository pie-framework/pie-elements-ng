// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/matrices.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

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
