import defaults from './defaults.js';
import { lockChoices, getShuffledChoices, partialScoring } from '@pie-element/shared-controller-utils';
import { isResponseCorrect } from './utils.js';
import { get, isEmpty } from '@pie-element/shared-lodash';
import Translator from '@pie-lib/translator';
import type { Choice, MultipleChoiceConfiguration, MultipleChoiceSession } from '@pie-element/multiple-choice';
import type { MultipleChoiceValidationErrors } from '@pie-element/multiple-choice/controller';
import type { PieEnvironment, PieUpdateSession } from '@pie-element/shared-types';
import type { EbsrConfiguration, EbsrModel, EbsrPart, EbsrSession } from '../types.js';

const { translator } = Translator;

type PartKey = 'partA' | 'partB';

type DefaultFeedback = { correct: string; incorrect: string };

/** A choice as the delivery view receives it. */
type ChoiceView = {
  label: string;
  value: string;
  rationale?: string | null;
  correct?: boolean;
  feedback?: string;
};

/** A part as the delivery view receives it. */
type PartView = Omit<EbsrPart, 'choices' | 'prompt' | 'teacherInstructions'> & {
  choices: ChoiceView[] | undefined;
  disabled: boolean;
  complete: { min: number };
  responseCorrect: boolean | undefined;
  partLabel?: string;
  prompt?: string | null;
  teacherInstructions?: string | null;
};

/** Errors `validate()` reports for each part, shaped as the multiple-choice part reports them. */
export type EbsrValidationErrors = {
  partA: MultipleChoiceValidationErrors;
  partB: MultipleChoiceValidationErrors;
};

const prepareChoice = (model: EbsrPart, env: PieEnvironment, defaultFeedback: DefaultFeedback) => (choice: Choice) => {
  const out: ChoiceView = {
    label: choice.label,
    value: choice.value,
  };

  if (env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate')) {
    out.rationale = model.rationaleEnabled ? choice.rationale : null;
  } else {
    out.rationale = null;
  }

  if (env.mode === 'evaluate') {
    out.correct = !!choice.correct;

    if (model.feedbackEnabled) {
      const feedbackType = (choice.feedback && choice.feedback.type) || 'none';

      if (feedbackType === 'default') {
        out.feedback = defaultFeedback[choice.correct ? 'correct' : 'incorrect'];
      } else if (feedbackType === 'custom') {
        out.feedback = choice.feedback?.value;
      }
    }
  }

  return out;
};

const parsePart = (part: EbsrPart, key: PartKey, session: EbsrSession, env: PieEnvironment): PartView => {
  const defaultFeedback = Object.assign({ correct: 'Correct', incorrect: 'Incorrect' }, part.defaultFeedback);

  let choices = part.choices ? part.choices.map(prepareChoice(part, env, defaultFeedback)) : [];

  return {
    ...part,
    choices,
    disabled: env.mode !== 'gather',
    complete: {
      min: part.choices.filter((c) => c.correct).length,
    },
    responseCorrect: env.mode === 'evaluate' ? isResponseCorrect(part, key, session) : undefined,
  };
};

const normalizePart = (model: Partial<EbsrPart>, base: EbsrPart): EbsrPart => ({
  ...base,
  ...model,
  choicesLayout: model.choicesLayout || (model.verticalMode === false && 'horizontal') || 'vertical',
});

/** A model whose parts may omit what the defaults supply. */
type NormalizeInput = Omit<EbsrModel, 'partA' | 'partB'> & {
  partA?: Partial<EbsrPart>;
  partB?: Partial<EbsrPart>;
};

export const normalize = ({ partA = {}, partB = {}, language, ...question }: NormalizeInput) => ({
  ...defaults,
  ...question,
  language,
  partA: normalizePart(partA, { ...defaults.partA, language }),
  partB: normalizePart(partB, { ...defaults.partB, language }),
});

/**
 *
 * @param {*} question
 * @param {*} session
 * @param {*} env
 * @param {*} updateSession - optional - a function that will set the properties passed into it on the session.
 */
export async function model(
  question: EbsrModel,
  session: EbsrSession,
  env: PieEnvironment,
  updateSession?: PieUpdateSession,
) {
  const normalizedQuestion = normalize(question);
  const partA = parsePart(normalizedQuestion.partA, 'partA', session, env);
  const partB = parsePart(normalizedQuestion.partB, 'partB', session, env);

  const shuffledValues: NonNullable<EbsrSession['shuffledValues']> = {};

  const us =
    (part: PartKey): PieUpdateSession =>
    (_id, _element, update) =>
    new Promise((resolve) => {
      shuffledValues[part] = update.shuffledValues as string[];
      resolve();
    });

  const partASession = get(session, 'value.partA');
  const partALockChoiceOrder = lockChoices(normalizedQuestion.partA, partASession, env);

  const { choices: partAChoices } = partA || {};
  const { choices: partBChoices } = partB || {};

  if (!partALockChoiceOrder && partAChoices && partAChoices.length) {
    partA.choices = await getShuffledChoices(
      partAChoices,
      { shuffledValues: (session.shuffledValues || {}).partA },
      us('partA'),
      'value',
    );
  }

  const partBSession = get(session, 'value.partB');
  const partBLockChoiceOrder = lockChoices(normalizedQuestion.partB, partBSession, env);

  if (!partBLockChoiceOrder && partBChoices && partBChoices.length) {
    partB.choices = await getShuffledChoices(
      partBChoices,
      { shuffledValues: (session.shuffledValues || {}).partB },
      us('partB'),
      'value',
    );
  }

  if (!isEmpty(shuffledValues)) {
    if (updateSession && typeof updateSession === 'function') {
      updateSession(session.id as string, session.element as string, {
        shuffledValues,
      }).catch((e) => {
        // eslint-disable-next-line no-console
        console.error('update session failed', e);
      });
    }
  }

  if (normalizedQuestion.partLabels) {
    const language = normalizedQuestion.language;
    partA.partLabel = translator.t('ebsr.part', {
      lng: language,
      index: normalizedQuestion.partLabelType === 'Letters' ? 'A' : '1',
    });
    partB.partLabel = translator.t('ebsr.part', {
      lng: language,
      index: normalizedQuestion.partLabelType === 'Letters' ? 'B' : '2',
    });
  } else {
    partA.partLabel = undefined;
    partB.partLabel = undefined;
  }

  if (env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate')) {
    partA.teacherInstructions = normalizedQuestion.partA.teacherInstructionsEnabled
      ? normalizedQuestion.partA.teacherInstructions
      : null;
    partB.teacherInstructions = normalizedQuestion.partB.teacherInstructionsEnabled
      ? normalizedQuestion.partB.teacherInstructions
      : null;
  } else {
    partA.teacherInstructions = null;
    partB.teacherInstructions = null;
  }

  partA.prompt = normalizedQuestion.partA.promptEnabled ? normalizedQuestion.partA.prompt : null;
  partB.prompt = normalizedQuestion.partB.promptEnabled ? normalizedQuestion.partB.prompt : null;

  // A hold on the item holds both parts, which each read only their own model.
  if (normalizedQuestion.autoplayAudioHeld) {
    partA.autoplayAudioHeld = true;
    partB.autoplayAudioHeld = true;
  }

  return new Promise((resolve) => {
    resolve({
      disabled: env.mode !== 'gather',
      mode: env.mode,
      extraCSSRules: normalizedQuestion.extraCSSRules,
      language: normalizedQuestion.language,
      partA,
      partB,
    });
  });
}

export const createDefaultModel = (model: Partial<EbsrModel> = {}) =>
  new Promise<Partial<EbsrModel>>((resolve) => {
    resolve({
      ...defaults,
      ...model,
    });
  });

const isCorrect = (c: Choice) => c.correct === true;

const getScore = (
  config: EbsrModel,
  sessionPart: MultipleChoiceSession | undefined,
  key: PartKey,
  partialScoringEnabled: boolean,
) => {
  const { choices = [] } = (config && config[key]) || {};
  const maxScore = choices.length;
  const { value: sessionPartValue } = sessionPart || {};

  const chosen = (c: Choice) => !!(sessionPartValue || []).find((v) => v === c.value);
  const correctAndNotChosen = (c: Choice) => isCorrect(c) && !chosen(c);
  const incorrectAndChosen = (c: Choice) => !isCorrect(c) && chosen(c);
  const correctChoices = choices.reduce((total, choice) => {
    if (correctAndNotChosen(choice) || incorrectAndChosen(choice)) {
      return total - 1;
    } else {
      return total;
    }
  }, choices.length);

  // determine score for a part
  if (!partialScoringEnabled && correctChoices < maxScore) {
    return 0;
  }

  return parseFloat(maxScore ? (correctChoices / maxScore).toFixed(2) : '0');
};

/**
 * Generates detailed trace log for math-templated scoring evaluation
 * @param {Object} question
 * @param {Object} session
 * @param {Object} env
 * @returns {Array<string>} traceLog
 */
export const getLogTrace = (question: EbsrModel, session: EbsrSession | undefined, env: PieEnvironment) => {
  const traceLog: string[] = [];

  if (!session || !session.value) {
    traceLog.push('Student did not answer the question.');
    return traceLog;
  }

  const { value } = session;
  const { partA, partB } = value;

  const partialScoringEnabled = partialScoring.enabled(question, env);

  traceLog.push(
    `Scoring method: ${partialScoringEnabled ? 'partial scoring' : 'all-or-nothing scoring'}.`
  );

  const partAquestionType =
    question.partA.choiceMode === 'radio'
      ? 'multiple-choice (radio)'
      : 'multiple-select (checkbox)';
  traceLog.push(`Part A question type: ${partAquestionType}.`);

  const partASelections = partA?.value || [];
  const partACorrectChoices = (question.partA.choices || []).filter((c) => c.correct);
  const partACorrectValues = partACorrectChoices.map((c) => c.value);
  const partACorrectSelected = partASelections.filter((v) => partACorrectValues.includes(v));
  const partAIncorrectSelected = partASelections.filter((v) => !partACorrectValues.includes(v));

  if (partASelections.length) {
    traceLog.push(
      `Part A: student selected ${partASelections.length} choice(s) (${partACorrectSelected.length} correct, ${partAIncorrectSelected.length} incorrect).`
    );
  }
  
  const scoreA = getScore(question, partA, 'partA', partialScoringEnabled);
  traceLog.push(`Part A score: ${scoreA}.`);

  const partBquestionType =
    question.partB.choiceMode === 'radio'
      ? 'multiple-choice (radio)'
      : 'multiple-select (checkbox)';
  traceLog.push(`Part B question type: ${partBquestionType}.`);

  const partBSelections = partB?.value || [];
  const partBCorrectChoices = (question.partB.choices || []).filter((c) => c.correct);
  const partBCorrectValues = partBCorrectChoices.map((c) => c.value);
  const correctSelected = partBSelections.filter((v) => partBCorrectValues.includes(v));
  const incorrectSelected = partBSelections.filter((v) => !partBCorrectValues.includes(v));

  if (partBSelections.length) {
    traceLog.push(
      `Part B: student selected ${partBSelections.length} choice(s) (${correctSelected.length} correct, ${incorrectSelected.length} incorrect).`
    );
  }

  const scoreB = getScore(question, partB, 'partB', partialScoringEnabled);
  traceLog.push(`Part B score: ${scoreB}.`);

  if (!partialScoringEnabled) {
    traceLog.push(
      'Final score is awarded only if both Part A and Part B are completely correct.'
    );
    traceLog.push(`Final score: ${scoreA === 1 && scoreB === 1 ? 1 : 0}.`);
  } else {
    traceLog.push(
      'With partial scoring enabled, Part A must be correct to earn any credit.'
    );

    let finalScore = 0;
    if (scoreA === 1 && scoreB === 1) {
      finalScore = 2;
    } else if (scoreA === 1 && scoreB < 1) {
      finalScore = 1;
    }

    traceLog.push(`Final score: ${finalScore}.`);
  }

  return traceLog;
};

type Outcome = {
  score: number;
  scoreA: number;
  scoreB: number;
  empty?: boolean;
  max?: number;
  logTrace: string[];
};

export function outcome(config: EbsrModel, session: EbsrSession | undefined, env: PieEnvironment) {
  return new Promise<Outcome>((resolve) => {
    const { value } = session || {};

    if (!session || !value) {
      resolve({ score: 0, scoreA: 0, scoreB: 0, empty: true, logTrace: ['Student did not answer the question.'] });
    }

    if (value) {
      const { partA, partB } = value || {};

      const partialScoringEnabled = partialScoring.enabled(config, env);

      const scoreA = getScore(config, partA, 'partA', partialScoringEnabled);
      const scoreB = getScore(config, partB, 'partB', partialScoringEnabled);
      const logTrace = getLogTrace(config, session, env);

      if (!partialScoringEnabled) {
        // The EBSR item is worth 1 point
        // That point is awarded if and only if both parts are fully correct, otherwise no points are awarded
        resolve({ score: scoreA === 1 && scoreB === 1 ? 1 : 0, scoreA, scoreB, max: 1, logTrace });
      } else {
        // The EBSR item is worth 2 points
        if (scoreA === 1) {
          if (scoreB === 1) {
            // If Part A and Part B are both correct, 2 points are awarded
            resolve({ score: 2, scoreA, scoreB, max: 2, logTrace });
          } else {
            // If Part A is correct and part B is incorrect, 1 point is awarded
            resolve({ score: 1, scoreA, scoreB, max: 2, logTrace });
          }
        } else {
          // For all other combinations, no points are awarded
          resolve({ score: 0, scoreA, scoreB, max: 2, logTrace });
        }
      }
    }
  });
}

const returnPartCorrect = (choices: Choice[]) => {
  let answers: string[] = [];

  choices.forEach((i) => {
    const { correct, value } = i;
    if (correct) {
      answers.push(value);
    }
  });
  return answers;
};

export const createCorrectResponseSession = (question: EbsrModel, env: PieEnvironment) => {
  return new Promise<EbsrSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { partA, partB } = question;

      const partACorrect = returnPartCorrect(partA.choices);
      const partBCorrect = returnPartCorrect(partB.choices);

      resolve({
        value: {
          partA: {
            id: 'partA',
            value: partACorrect,
          },
          partB: {
            id: 'partB',
            value: partBCorrect,
          },
        },
        id: '1',
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

const validatePart = (
  model: Partial<EbsrPart> = {},
  config: MultipleChoiceConfiguration = {},
): MultipleChoiceValidationErrors => {
  const { choices } = model;
  const { minAnswerChoices = 2, maxAnswerChoices } = config;
  const reversedChoices = [...(choices || [])].reverse();
  const errors: MultipleChoiceValidationErrors = {};
  const choicesErrors: Record<string, string> = {};
  const rationaleErrors: Record<string, string> = {};
  let hasCorrectResponse = false;

  (['teacherInstructions', 'prompt'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  reversedChoices.forEach((choice, index) => {
    const { correct, value, label, rationale } = choice;

    if (correct) {
      hasCorrectResponse = true;
    }

    if (!getContent(label)) {
      choicesErrors[value] = 'Content should not be empty.';
    } else {
      const identicalAnswer = reversedChoices.slice(index + 1).some((c) => c.label === label);

      if (identicalAnswer) {
        choicesErrors[value] = 'Content should be unique.';
      }
    }

    if (config.rationale?.required && !getContent(rationale)) {
      rationaleErrors[value] = 'This field is required.';
    }
  });

  const nbOfChoices = (choices || []).length;

  if (nbOfChoices < minAnswerChoices) {
    errors.answerChoices = `There should be at least ${minAnswerChoices} choices defined.`;
  } else if (maxAnswerChoices !== undefined && nbOfChoices > maxAnswerChoices) {
    errors.answerChoices = `No more than ${maxAnswerChoices} choices should be defined.`;
  }

  if (!hasCorrectResponse) {
    errors.correctResponse = 'No correct response defined.';
  }

  if (!isEmpty(choicesErrors)) {
    errors.choices = choicesErrors;
  }

  if (!isEmpty(rationaleErrors)) {
    errors.rationale = rationaleErrors;
  }

  return errors;
};

export const validate = (
  model: Partial<EbsrModel> = {},
  config: EbsrConfiguration = {},
): EbsrValidationErrors => {
  const { partA, partB } = model || {};
  const { partA: partAConfig, partB: partBConfig } = config || {};

  const partAErrors = validatePart(partA, partAConfig);
  const partBErrors = validatePart(partB, partBConfig);

  return { partA: partAErrors, partB: partBErrors };
};
