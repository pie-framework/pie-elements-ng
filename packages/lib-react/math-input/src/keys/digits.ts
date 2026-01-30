// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keys/digits.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { times } from 'lodash-es';

const digitMap = {
  0: 'zero',
  1: 'one',
  2: 'two',
  3: 'three',
  4: 'four',
  5: 'five',
  6: 'six',
  7: 'seven',
  8: 'eight',
  9: 'nine',
};

const comma = { name: 'comma', label: ',', write: ',', category: 'digit' };

const decimalPoint = {
  name: 'decimal-point',
  label: '.',
  write: '.',
  category: 'digit',
};

export default times(10, String)
  .map((n) => {
    return {
      name: digitMap[n],
      write: n,
      label: n,
      category: 'digit',
    };
  })
  .reduce(
    (acc, o) => {
      acc[o.name] = o;
      return acc;
    },
    { comma, decimalPoint },
  );
