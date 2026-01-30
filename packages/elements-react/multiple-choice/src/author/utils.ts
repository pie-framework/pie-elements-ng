// @ts-nocheck
/**
 * @synced-from pie-elements/packages/multiple-choice/configure/src/utils.js
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
  const { minAnswerChoices, maxAnswerChoices } = config;

  const answerChoicesMessage =
    `\nThere should be at least ${minAnswerChoices} ` +
    (maxAnswerChoices ? `and at most ${maxAnswerChoices} ` : '') +
    'answer choices defined.' +
    '\nEvery answer choice should be non-blank and unique.';

  const correctAnswerMessage = '\nA correct answer must be defined.';

  const message = 'Validation requirements:' + answerChoicesMessage + correctAnswerMessage;

  return message;
};
