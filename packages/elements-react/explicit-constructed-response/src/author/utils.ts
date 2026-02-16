// @ts-nocheck
/**
 * @synced-from pie-elements/packages/explicit-constructed-response/configure/src/utils.js
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
