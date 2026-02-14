// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drag-in-the-blank/controller/src/utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { cloneDeep, reduce } from 'lodash-es';

const replaceHtmlRegex = /<(?!img)[^>]*>?/gm;

export const getAllCorrectResponses = ({ correctResponse, alternateResponses }) => {
  return reduce(
    correctResponse || {},
    (obj, val, key) => {
      obj.possibleResponses[key] = [val];

      if (alternateResponses && alternateResponses[key]) {
        obj.possibleResponses[key] = [...obj.possibleResponses[key], ...cloneDeep(alternateResponses[key])];
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

export const choiceIsEmpty = (choice) => {
  if (choice) {
    const { value = '' } = choice;
    const withoutEmptyTags = value.replace(replaceHtmlRegex, '') || '';

    return withoutEmptyTags.trim() === '';
  }

  return false;
};
