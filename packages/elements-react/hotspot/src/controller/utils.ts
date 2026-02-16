// @ts-nocheck
/**
 * @synced-from pie-elements/packages/hotspot/controller/src/utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { isEmpty, isEqual } from 'lodash-es';

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
