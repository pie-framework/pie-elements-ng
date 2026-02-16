// @ts-nocheck
/**
 * @synced-from pie-elements/packages/categorize/configure/src/design/builder.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { cloneDeep } from 'lodash-es';

export const buildCategories = (categories, choices, correctResponse) => {
  const clonedCategories = cloneDeep(categories);

  return clonedCategories.map((category) => {
    const cr = correctResponse.find((cr) => cr.category === category.id);

    if (cr) {
      category.choices = (cr.choices || []).map((choiceId) => {
        const choice = choices.find((h) => h.id === choiceId);
        if (choice) {
          return Object.assign({}, { id: choice.id, content: choice.content });
        }
      });
    }

    return category;
  });
};

const getChoices = (cat, choices, index) => {
  if (!cat.alternateResponses || cat.alternateResponses.length === 0) {
    return [];
  }

  return (cat.alternateResponses[index] || []).map((alt) => {
    return choices.find((ch) => ch.id === alt);
  });
};

export const buildAlternateResponses = (categories, choices, correctResponse) => {
  const mostAlternates = correctResponse.reduce((mostAlt, cat) => {
    if (cat.alternateResponses && cat.alternateResponses.length >= mostAlt) {
      return cat.alternateResponses.length;
    }

    return mostAlt;
  }, 0);
  const alternatesArray = new Array(mostAlternates).fill(0);

  return alternatesArray.map((val, index) => {
    return correctResponse.map((cat, catIndex) => {
      const currentCategory = categories[catIndex];

      return {
        id: currentCategory.id,
        label: currentCategory.label,
        choices: getChoices(cat, choices, index),
      };
    });
  });
};
