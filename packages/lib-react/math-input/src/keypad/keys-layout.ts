// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-input/src/keypad/keys-layout.js
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
