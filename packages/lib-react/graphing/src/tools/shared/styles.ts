// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/shared/styles.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { color } from '@pie-lib/render-ui';

export const disabled = (key = 'fill') => ({
  [key]: color.disabled(),
  pointerEvents: 'none',
});

export const disabledSecondary = (key = 'fill') => ({
  [key]: color.disabledSecondary(),
  pointerEvents: 'none',
});

export const correct = (key = 'fill') => ({
  [key]: color.correctWithIcon(),
  pointerEvents: 'none',
});
export const incorrect = (key = 'fill') => ({
  [key]: color.incorrectWithIcon(),
  pointerEvents: 'none',
});

export const missing = (key = 'fill') => ({
  [key]: color.missingWithIcon(),
  pointerEvents: 'none',
});
