// @ts-nocheck
/**
 * @synced-from pie-elements/packages/match/configure/src/utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export const getPluginProps = (props = {}, baseInputConfiguration = {}) => ({
  ...baseInputConfiguration,
  ...props,
});

export const generateValidationMessage = (model, configuration) => {
  const { choiceMode } = model;
  const { minQuestions, maxQuestions, maxAnswers } = configuration;

  const baselineValidationMessage =
    `\nThere should be at least ${minQuestions}` +
    (maxQuestions ? ` and at most ${maxQuestions}` : '') +
    ' question row' + (minQuestions > 1 || maxQuestions ? 's.' : '.') +
    '\nRow and column headings should be non-blank and unique. \nFirst column heading is excluded from validation.' +
    (maxAnswers ? `\nThere should be at most ${maxAnswers} answer choices.` : '')
  ;

  const correctResponseMessage =
    choiceMode === 'radio'
      ? '\nThere should be a correct response defined for every row.'
      : '\nThere should be at least one correct response defined for every row.';

  return 'Validation requirements:' + baselineValidationMessage + correctResponseMessage;
};
