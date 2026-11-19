// @ts-nocheck

import { mkSet } from './utils.js';

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
