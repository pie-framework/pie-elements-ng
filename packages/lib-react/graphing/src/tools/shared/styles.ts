// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing/src/tools/shared/styles.js
 * @synced-commit a933f8d7661c0d7d814f8732bd246cef24eeb040
 * @sync-version v3
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
