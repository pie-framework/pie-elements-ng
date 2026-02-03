// @ts-nocheck
/**
 * @synced-from pie-elements/packages/inline-dropdown/controller/src/utils.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { forEach } from 'lodash-es';

export const getAllCorrectResponses = ({ choices, alternateResponse }) => {
  alternateResponse = alternateResponse || {};
  const correctAnswers = {};

  forEach(choices, (respArea, key) => {
    if (!correctAnswers[key]) {
      correctAnswers[key] = [];
    }

    if (respArea) {
      respArea.forEach((choice) => {
        if (choice.correct) {
          correctAnswers[key].push(choice.value);

          if (alternateResponse[key]) {
            correctAnswers[key] = [...correctAnswers[key], ...alternateResponse[key]];
          }
        }
      });
    }
  });

  return correctAnswers;
};
