// @ts-nocheck
/**
 * @synced-from pie-lib/packages/charting/src/common/styles.js
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
  [key]: `var(--graph-disabled, ${color.disabled()})`,
  pointerEvents: 'none',
  border: 'none',
});

export const correct = (key = 'fill') => ({
  [key]: color.correct(),
  pointerEvents: 'none',
  border: `solid 1px ${color.correct()}`,
});

export const incorrect = (key = 'fill') => ({
  [key]: color.incorrect(),
  pointerEvents: 'none',
  border: `solid 1px ${color.incorrect()}`,
});