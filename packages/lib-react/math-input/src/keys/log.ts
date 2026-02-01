// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/log.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { mkSet } from './utils';

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
