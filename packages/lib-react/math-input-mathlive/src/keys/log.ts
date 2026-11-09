// @ts-nocheck

import { mkSet } from './utils.js';

const set = mkSet('log');

export const log = set({
  name: 'Log',
  label: 'log',
  command: '\\log',
  latex: '\\log',
});
export const logSubscript = set({
  name: 'log base n',
  label: 'log s',
  latex: '\\log_{}',
  command: ['\\log', '_'],
});
export const ln = set({
  name: 'natural log',
  label: 'ln',
  command: '\\ln',
  latex: '\\ln',
});
