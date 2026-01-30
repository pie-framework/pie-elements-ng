// @ts-nocheck
/**
 * @synced-from pie-elements/packages/math-templated/configure/src/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const generateValidationMessage = (config) => {
  const { maxResponseAreas } = config;

  const responseAreasMessage =
    '\nCorrect answers should not be blank.' +
    '\nEach answer defined for a response area should be unique.' +
    '\nThere should be at least 1 ' +
    (maxResponseAreas ? `and at most ${maxResponseAreas} ` : '') +
    'response area' +
    (maxResponseAreas ? 's' : '') +
    ' defined.';

  return 'Validation requirements:' + responseAreasMessage;
};
