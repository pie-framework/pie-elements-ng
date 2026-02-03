// @ts-nocheck
/**
 * @synced-from pie-lib/packages/drag/src/swap.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { cloneDeep } from 'lodash-es';

export default (arr, fromIndex, toIndex) => {
  if (!arr || arr.length <= 1 || fromIndex === undefined || toIndex === undefined) {
    throw new Error(`swap requires a non-empty array, fromIndex, toIndex: ${arr}, ${fromIndex} ${toIndex}`);
  }

  const update = cloneDeep(arr);
  const tmp = arr[toIndex];
  update[toIndex] = update[fromIndex];
  update[fromIndex] = tmp;

  return update;
};
