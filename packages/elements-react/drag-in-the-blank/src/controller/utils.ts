import { cloneDeep, reduce } from '@pie-element/shared-lodash';
import type { Choice, DragInTheBlankModel } from '../types.js';

/** Every accepted choice id per response area, and the fewest any area accepts. */
export type AllCorrectResponses = {
  possibleResponses: Record<string, string[]>;
  numberOfPossibleResponses: number | undefined;
};

const replaceHtmlRegex = /<(?!img)[^>]*>?/gm;

export const getAllCorrectResponses = ({
  correctResponse,
  alternateResponses,
}: Pick<DragInTheBlankModel, 'correctResponse' | 'alternateResponses'>) => {
  // An array of arrays or an object keyed by area index; both index the same way.
  const alternates = alternateResponses as Record<string, string[]> | undefined;

  return reduce<string, AllCorrectResponses>(
    correctResponse || {},
    (obj, val, key) => {
      obj.possibleResponses[key] = [val];

      if (alternates && alternates[key]) {
        obj.possibleResponses[key] = [...obj.possibleResponses[key], ...cloneDeep(alternates[key])];
      }

      if (
        obj.numberOfPossibleResponses === undefined ||
        obj.numberOfPossibleResponses > obj.possibleResponses[key].length
      ) {
        obj.numberOfPossibleResponses = obj.possibleResponses[key].length;
      }

      return obj;
    },
    {
      possibleResponses: {},
      numberOfPossibleResponses: undefined,
    },
  );
};

export const choiceIsEmpty = (choice: Choice | undefined) => {
  if (choice) {
    const { value = '' } = choice;
    const withoutEmptyTags = value.replace(replaceHtmlRegex, '') || '';

    return withoutEmptyTags.trim() === '';
  }

  return false;
};
