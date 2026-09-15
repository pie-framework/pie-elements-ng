// @ts-nocheck
/**
 * @synced-from pie-lib/packages/graphing-solution-set/src/tools/shared/styles.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { color } from '@pie-lib/render-ui';

// Locked to the palette default rather than `color.disabled()`, matching
// `@pie-lib/graphing`. The graph interior is a fixed-palette figure - active
// strokes, points and arrowheads are all `color.defaults.*` literals - so
// letting only the disabled and background marks follow `--pie-disabled` made
// their contrast against the plane depend on the host color scheme.
export const disabled = (key = 'fill') => ({
  [key]: color.defaults.DISABLED,
  pointerEvents: 'none',
});

export const correct = (key = 'fill') => ({
  [key]: color.correct(),
  pointerEvents: 'none',
});
export const incorrect = (key = 'fill') => ({
  [key]: color.incorrect(),
  pointerEvents: 'none',
});

export const missing = (key = 'fill') => ({
  [key]: color.missing(),
  pointerEvents: 'none',
});
