// @ts-nocheck
/**
 * @synced-from pie-elements/packages/inline-dropdown/configure/src/utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const generateValidationMessage = (config) => {
  const { maxResponseAreas, maxResponseAreaChoices } = config;

  const responseAreasMessage =
    '\nThere should be at least 1 ' +
    (maxResponseAreas ? `and at most ${maxResponseAreas} ` : '') +
    'response area' +
    (maxResponseAreas ? 's' : '') +
    ' defined.' +
    (maxResponseAreaChoices
      ? `\nThere should be at most ${maxResponseAreaChoices} choices defined per response area.`
      : '');

  const message = 'Validation requirements:' + responseAreasMessage;

  return message;
};

export const getPluginProps = (props = {}, baseInputConfiguration = {}) => ({
  ...baseInputConfiguration,
  ...props,
});
