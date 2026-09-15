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

export const graphingShapeFill = () => color.visualElementsColors.SHAPES_FILL_COLOR;

// Locked to the palette default rather than `color.disabledSecondary()`.
// The graph interior is a fixed-palette figure - grid lines, axes, active mark
// strokes and mark labels are all literals - so letting only the background and
// disabled marks follow `--pie-disabled-secondary` made their contrast against
// the plane depend on the host color scheme.
export const disabled = (key = 'fill') => ({
  [key]: color.defaults.DISABLED_SECONDARY, // this is needed to match previous disabled color for backward compatibility
  pointerEvents: 'none',
});

export const disabledSecondary = (key = 'fill') => ({
  [key]: color.defaults.DISABLED_SECONDARY,
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
