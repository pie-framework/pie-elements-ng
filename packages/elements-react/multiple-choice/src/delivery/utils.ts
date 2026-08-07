// @ts-nocheck
/**
 * @synced-from pie-elements/packages/multiple-choice/src/utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

// Returns true when count is at or above maxSelections (use to block the next selection).
export const reachedMaxSelections = (count, maxSelections) =>
  maxSelections != null && count >= maxSelections;

// Returns true when count strictly exceeds maxSelections (use for validation / isComplete checks).
export const exceedsMaxSelections = (count, maxSelections) =>
  maxSelections != null && count > maxSelections;
