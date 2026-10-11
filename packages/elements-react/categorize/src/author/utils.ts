import type { CategorizeConfiguration, CategorizeModel, MultiplePlacements } from '../types.js';

export const generateValidationMessage = (config?: CategorizeConfiguration) => {
  let { minChoices, maxChoices, maxCategories } = config || ({} as CategorizeConfiguration);
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
export const multiplePlacements = {
  enabled: 'Yes',
  disabled: 'No',
  perChoice: 'Set Per Choice',
} as const satisfies Record<string, MultiplePlacements>;

// Find the length of the largest array from an array
export const maxLength = (array: unknown[][] | undefined) =>
  (array || []).reduce((max: number, arr) => {
    return Math.max(max, arr.length);
  }, 0);

export const getMaxCategoryChoices = (model: Partial<CategorizeModel> | undefined) => {
  const { correctResponse = [] } = model || ({} as Partial<CategorizeModel>);
  return correctResponse.reduce((max: number, correctRes) => {
    const correctRespLength = correctRes?.choices?.length || 0;
    const alternates = correctRes?.alternateResponses || [];
    const maxChoices = Math.max(correctRespLength, maxLength(alternates));
    return maxChoices > max ? maxChoices : max;
  }, 0);
};
