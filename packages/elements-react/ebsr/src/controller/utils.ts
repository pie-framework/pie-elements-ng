// @ts-nocheck
/**
 * @synced-from pie-elements/packages/ebsr/controller/src/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { isEqual } from 'lodash-es';

export const getCorrectResponse = (choices) =>
  choices &&
  choices
    .filter((c) => c.correct)
    .map((c) => c.value)
    .sort();

export const isResponseCorrect = (question, key, session) => {
  let correctResponse = getCorrectResponse(question.choices);

  if (session && session.value) {
    return isEqual((session.value[key].value || []).sort(), correctResponse);
  }

  return false;
};
