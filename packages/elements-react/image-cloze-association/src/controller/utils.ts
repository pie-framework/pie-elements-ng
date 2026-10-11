import type {
  ImageClozeAssociationAnswer,
  ImageClozeAssociationContainerResponse,
  ImageClozeAssociationValidation,
  ImageClozeAssociationValidResponse,
} from '../types.js';

// functions also used in src/utils-correctness.js

/** A placed image with whether its response container accepts it */
export type ImageClozeAssociationAnswerCorrectness = ImageClozeAssociationAnswer & { isCorrect: boolean };

const getAllCorrectness = (
  answers: ImageClozeAssociationAnswer[] | undefined,
  responses: ImageClozeAssociationContainerResponse[],
): ImageClozeAssociationAnswerCorrectness[] =>
  (answers || []).map((answer) => ({
    ...answer,
    isCorrect: ((responses[answer.containerIndex] && responses[answer.containerIndex].images) || []).includes(
      answer.value,
    ),
  }));

const getValidAnswer = (answer: ImageClozeAssociationAnswer, response: ImageClozeAssociationContainerResponse[]) =>
  ((response[answer.containerIndex] && response[answer.containerIndex].images) || []).filter(
    (res) => res === answer.value,
  );

export const getAllUniqueCorrectness = (
  answers: ImageClozeAssociationAnswer[],
  validResponses: ImageClozeAssociationContainerResponse[],
) => {
  let allCorrectness = getAllCorrectness(answers, validResponses);

  answers.forEach((answer1) => {
    const valuesToParse = answers.filter(
      (answer2) => answer2.value === answer1.value && answer2.containerIndex === answer1.containerIndex,
    );

    if (valuesToParse.length > 1) {
      // point only to duplicates but first
      valuesToParse.shift();
      // mark duplicates as incorrect
      valuesToParse.forEach((value, index) => {
        allCorrectness = (allCorrectness || []).map((finalAnswer) => {
          if (finalAnswer.id === value.id) {
            let valid = getValidAnswer(finalAnswer, validResponses);
            return {
              ...finalAnswer,
              isCorrect: valid.length > index + 1,
            };
          }
          return finalAnswer;
        });
      });
    }
  });
  return allCorrectness;
};

// calculate the minimum number of populated response areas (categories) in the correct answer or alternates
// and create an array with the possible responses ids
export const getCompleteResponseDetails = (
  validation: ImageClozeAssociationValidation | undefined,
  allChoices: string[],
) => {
  const extractImages = (response: ImageClozeAssociationValidResponse | undefined) =>
    (response?.value || []).map((container) => container.images as string[]);
  const countFilledResponseAreas = (container: string[][]) =>
    (container || []).filter((images) => images.length).length;

  const { validResponse, altResponses } = validation || {};
  const imagesPerContainer = extractImages(validResponse);
  const possibleResponses = [imagesPerContainer.flat()];
  let responseAreasToBeFilled = countFilledResponseAreas(imagesPerContainer);

  (altResponses || []).forEach((altResponse) => {
    const altImagesPerContainer = extractImages(altResponse);
    const filledResponseAreas = countFilledResponseAreas(altImagesPerContainer);
    possibleResponses.push(altImagesPerContainer.flat());

    if (filledResponseAreas < responseAreasToBeFilled) {
      responseAreasToBeFilled = filledResponseAreas;
    }
  });

  // check if any correct answer have any unplaced answer choices
  const hasUnplacedChoices = possibleResponses.some(
    (response) => !allChoices.every((val) => response.includes(val)),
  );

  return { responseAreasToBeFilled, possibleResponses, hasUnplacedChoices };
};
