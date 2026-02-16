// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/statistics.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

const set = mkSet('statistics');
export const xBar = set({
  name: 'X Bar',
  label: 'x̄',
  latex: '\\overline{x}',
  write: '\\overline{x}',
});

export const yBar = set({
  name: 'Y Bar',
  latex: '\\overline{y}',
  write: '\\overline{y}',
});

export const mu = set({
  name: 'mu',
  label: 'mu',
  latex: '\\mu',
  write: '\\mu',
});

export const sigma = set({
  name: 'Sigma',
  ariaLabel: 'Uppercase Sigma',
  label: '\\Sigma',
  latex: '\\Sigma',
  write: '\\Sigma',
});

export const smallSigma = set({
  name: 'sigma',
  ariaLabel: 'Lowercase Sigma',
  label: '\\sigma',
  latex: '\\sigma',
  write: '\\sigma',
});
