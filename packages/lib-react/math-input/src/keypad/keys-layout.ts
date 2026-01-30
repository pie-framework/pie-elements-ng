// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keypad/keys-layout.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import * as _ from 'lodash-es';

/**
 * Sort additional keys.
 *
 * Expects an array of rows.
 * @param {} keys
 */
export const sortKeys = (keys) => {
  // add any missing rows
  _.times(5 - keys.length, () => {
    keys.push([]);
  });

  const out = _.zip.apply(null, keys);
  return out;
};
