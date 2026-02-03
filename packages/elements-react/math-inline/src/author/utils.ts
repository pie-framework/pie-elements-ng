// @ts-nocheck
/**
 * @synced-from pie-elements/packages/math-inline/configure/src/utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const ResponseTypes = {
  advanced: 'Advanced Multi',
  simple: 'Simple',
};

export const generateValidationMessage = (model = {}, config = {}) => {
  const { maxResponseAreas } = config;
  const { responseType } = model;
  let responseAreasMessage = '';

  const answersMessage =
    '\nAll correct answers (the primary and any alternates) should not be empty and should be unique.';

  if (responseType === 'Advanced Multi') {
    responseAreasMessage =
      '\nThere should be at least 1 ' +
      (maxResponseAreas ? `and at most ${maxResponseAreas} ` : '') +
      'response area' +
      (maxResponseAreas ? 's' : '') +
      ' defined.';
  }

  return 'Validation requirements:' + answersMessage + responseAreasMessage;
};

export const getPluginProps = (props = {}, baseInputConfiguration = {}) => ({
  ...baseInputConfiguration,
  ...props,
});
