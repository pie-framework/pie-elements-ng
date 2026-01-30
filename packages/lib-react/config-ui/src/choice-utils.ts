// @ts-nocheck
/**
 * @synced-from pie-lib/packages/config-ui/src/choice-utils.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { includes } from 'lodash-es';

/**
 * Add value to every model.choices.
 * @param {Object} model the model to normalize
 * @return {Object} the updated model
 */
export const normalizeChoices = (model) => {
  const choices = model.choices.map((c, index) => {
    if (!c.value) {
      c.value = `${index}`;
    }
    return c;
  });
  return { ...model, choices };
};

/**
 * Find the first available index.
 * @param {string[]} values
 * @param {number} index
 * @return {string}
 */
export const firstAvailableIndex = (values, index) => {
  if (includes(values, `${index}`)) {
    return firstAvailableIndex(values, index + 1);
  } else {
    return `${index}`;
  }
};
