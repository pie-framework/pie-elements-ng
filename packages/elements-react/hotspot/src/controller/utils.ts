// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/controller/src/utils.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { isEqual } from 'lodash-es';
import { isEmpty } from 'lodash-es';

export const getCorrectResponse = (choices) =>
  choices
    .filter((c) => c.correct)
    .map((c) => c.id)
    .sort();

export const isResponseCorrect = (question, session) => {
  const {
    shapes: { rectangles = [], polygons = [], circles = [] },
  } = question;
  const choices = [...rectangles, ...polygons, ...circles];
  let correctResponseIds = getCorrectResponse(choices);

  if (!session || isEmpty(session)) {
    return false;
  }

  if (session.answers && session.answers.length) {
    let answerIds = (session.answers || []).map((a) => a.id);

    return isEqual(answerIds.sort(), correctResponseIds);
  } else if (!(correctResponseIds && correctResponseIds.length)) {
    return true;
  }

  return false;
};
