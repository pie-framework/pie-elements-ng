// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drag-in-the-blank/configure/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const generateValidationMessage = (config) => {
  let { maxResponseAreas, minChoices, maxChoices } = config;
  minChoices = minChoices || 2;

  const responseAreasMessage =
    '\nThe tokens should ' +
    'not be empty and should be unique.\nThere should be at least 1 ' +
    (maxResponseAreas ? `and at most ${maxResponseAreas} ` : '') +
    'response area' +
    (maxResponseAreas ? 's' : '') +
    ' defined.' +
    `\nThere should be at least ${minChoices} ` +
    (maxChoices ? `and at most ${maxChoices} ` : '') +
    'tokens defined.';

  return 'Validation requirements:' + responseAreasMessage;
};
