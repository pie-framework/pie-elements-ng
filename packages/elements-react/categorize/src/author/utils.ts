// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/utils.js
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
  let { minChoices, maxChoices, maxCategories } = config || {};
  minChoices = minChoices || 1;

  const validationMessage =
    '\nThe choices content should ' +
    'not be empty and should be unique.\nThere should be at least 1 ' +
    (maxCategories ? `and at most ${maxCategories} ` : '') +
    'category' +
    (maxCategories ? 's' : '') +
    ' defined.' +
    (minChoices ? `\nThere should be at least ${minChoices} choices defined.` : '') +
    (maxChoices ? `\nNo more than ${maxChoices} choices should be defined.` : '') +
    '\nAt least one token should be assigned to at least one category.';

  return 'Validation requirements:' + validationMessage;
};

// used in controller too, for consistency modify it there too
export const multiplePlacements = { enabled: 'Yes', disabled: 'No', perChoice: 'Set Per Choice' };

// Find the length of the largest array from an array
export const maxLength = (array) =>
  (array || []).reduce((max, arr) => {
    return Math.max(max, arr.length);
  }, 0);

export const getMaxCategoryChoices = (model) => {
  const { correctResponse = [] } = model || {};
  return correctResponse.reduce((max, correctRes) => {
    const correctRespLength = correctRes?.choices?.length || 0;
    const alternates = correctRes?.alternateResponses || [];
    const maxChoices = Math.max(correctRespLength, maxLength(alternates));
    return maxChoices > max ? maxChoices : max;
  }, 0);
};
