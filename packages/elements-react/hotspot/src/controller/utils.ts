import { isEmpty, isEqual } from '@pie-element/shared-lodash';
import type { HotspotModel, HotspotSession, HotspotShape } from '../types.js';

export const getCorrectResponse = (choices: HotspotShape[]) =>
  choices
    .filter((c) => c.correct)
    .map((c) => c.id)
    .sort();

export const isResponseCorrect = (question: HotspotModel, session: HotspotSession | null | undefined) => {
  const {
    shapes: { rectangles = [], polygons = [], circles = [] },
  } = question;
  const choices: HotspotShape[] = [...rectangles, ...polygons, ...circles];
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
