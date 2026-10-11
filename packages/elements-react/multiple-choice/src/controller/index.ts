/* eslint-disable no-console */
import { isEmpty } from '@pie-element/shared-lodash';
import type { PieEnvironment, PieUpdateSession } from '@pie-element/shared-types';
import { isResponseCorrect } from './utils.js';
import defaults from './defaults.js';
import { lockChoices, partialScoring, getShuffledChoices } from '@pie-element/shared-controller-utils';
import type {
  Choice,
  MultipleChoiceConfiguration,
  MultipleChoiceModel,
  MultipleChoiceSession,
} from '../types.js';

type DefaultFeedback = { correct: string; incorrect: string };

/** A choice as the delivery view receives it. */
type ChoiceView = {
  label: string;
  value: string;
  rationale?: string | null;
  correct?: boolean;
  feedback?: string;
};

/** Errors `validate()` reports, keyed by field; `choices` and `rationale` are keyed by choice value. */
export type MultipleChoiceValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
  answerChoices?: string;
  correctResponse?: string;
  choices?: Record<string, string>;
  rationale?: Record<string, string>;
};

const prepareChoice =
  (model: MultipleChoiceModel, env: PieEnvironment | undefined, defaultFeedback: DefaultFeedback) =>
  (choice: Choice): ChoiceView => {
  const role = env?.role;
  const mode = env?.mode;
  const out: ChoiceView = {
    label: choice.label,
    value: choice.value,
  };

  if (role === 'instructor' && (mode === 'view' || mode === 'evaluate')) {
    out.rationale = model.rationaleEnabled ? choice.rationale : null;
  } else {
    out.rationale = null;
  }

  if (mode === 'evaluate') {
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

export function createDefaultModel(model: Partial<MultipleChoiceModel> = {}) {
  return new Promise<Partial<MultipleChoiceModel>>((resolve) => resolve({ ...defaults, ...model }));
}

export const normalize = (question: MultipleChoiceModel) => {
  const { verticalMode, choicesLayout, ...questionProps } = question || {};

  return {
    ...defaults,
    ...questionProps,
    // This is used for offering support for old models which have the property verticalMode
    // Same thing is set in authoring : packages/multiple-choice/configure/src/index.jsx - createDefaultModel
    choicesLayout: choicesLayout || (verticalMode === false && 'horizontal') || defaults.choicesLayout,
  };
};

/**
 *
 * @param {*} question
 * @param {*} session
 * @param {*} env
 * @param {*} updateSession - optional - a function that will set the properties passed into it on the session.
 */
export async function model(
  question: MultipleChoiceModel,
  session: MultipleChoiceSession | undefined,
  env: PieEnvironment,
  updateSession?: PieUpdateSession,
) {
  const normalizedQuestion = normalize(question);

  const defaultFeedback = Object.assign(
    { correct: 'Correct', incorrect: 'Incorrect' },
    normalizedQuestion.defaultFeedback,
  );

  let choices: ChoiceView[] | undefined = (normalizedQuestion.choices || []).map(prepareChoice(normalizedQuestion, env, defaultFeedback));

  const lockChoiceOrder = lockChoices(normalizedQuestion, session, env);

  if (!lockChoiceOrder) {
    choices = await getShuffledChoices(choices, session, updateSession, 'value');
  }

  const { role, mode } = env;

  const out = {
    disabled: env.mode !== 'gather',
    mode: env.mode,
    prompt: normalizedQuestion.promptEnabled ? normalizedQuestion.prompt : null,
    choicesLayout: normalizedQuestion.choicesLayout,
    gridColumns: normalizedQuestion.gridColumns,
    choiceMode: normalizedQuestion.choiceMode,
    keyMode: normalizedQuestion.choicePrefix,
    choices,
    responseCorrect: env.mode === 'evaluate' ? isResponseCorrect(normalizedQuestion, session) : undefined,
    language: normalizedQuestion.language,
    extraCSSRules: normalizedQuestion.extraCSSRules,
    fontSizeFactor: normalizedQuestion.fontSizeFactor,
    isSelectionButtonBelow: normalizedQuestion.isSelectionButtonBelow,
    selectedAnswerBackgroundColor: normalizedQuestion.selectedAnswerBackgroundColor || 'initial',
    selectedAnswerStrokeColor: normalizedQuestion.selectedAnswerStrokeColor || 'initial',
    selectedAnswerStrokeWidth: normalizedQuestion.selectedAnswerStrokeWidth || 'initial',
    hoverAnswerBackgroundColor: normalizedQuestion.hoverAnswerBackgroundColor || 'initial',
    hoverAnswerStrokeColor: normalizedQuestion.hoverAnswerStrokeColor || 'initial',
    hoverAnswerStrokeWidth: normalizedQuestion.hoverAnswerStrokeWidth || 'initial',
    minSelections: normalizedQuestion.minSelections,
    maxSelections: normalizedQuestion.maxSelections,
    keyboardEventsEnabled: normalizedQuestion.keyboardEventsEnabled,
    autoplayAudioEnabled: normalizedQuestion.autoplayAudioEnabled,
    completeAudioEnabled: normalizedQuestion.completeAudioEnabled,
    customAudioButton: normalizedQuestion.customAudioButton,
    teacherInstructions:
      role === 'instructor' && (mode === 'view' || mode === 'evaluate') && normalizedQuestion.teacherInstructionsEnabled
        ? normalizedQuestion.teacherInstructions
        : null,
  };

  return out;
}

export const getScore = (config: MultipleChoiceModel, session: MultipleChoiceSession | undefined) => {
  if (!session || isEmpty(session)) {
    return 0;
  }

  const selectedChoices = session?.value || [];
  const correctChoices = (config.choices || []).filter((ch) => ch.correct);

  let score = selectedChoices.reduce(
    (acc, selectedChoice) => acc + (correctChoices.find((ch) => ch.value === selectedChoice) ? 1 : 0),
    0,
  );

  if (correctChoices.length < selectedChoices.length) {
    score -= selectedChoices.length - correctChoices.length;

    if (score < 0) {
      score = 0;
    }
  }

  const str = correctChoices.length ? score / correctChoices.length : 0;

  return parseFloat(str.toFixed(2));
};

/**
 * Generates detailed trace log for scoring evaluation
 * @param {Object} model - the question model
 * @param {Object} session - the student session
 * @param {Object} env - the environment
 * @returns {Array} traceLog - array of trace messages
 */
export const getLogTrace = (
  model: MultipleChoiceModel,
  session: MultipleChoiceSession | undefined,
  env: PieEnvironment,
) => {
  const traceLog: string[] = [];
  const selected = session?.value || [];
  
  const questionType = model.choiceMode === 'radio' ? 'multiple-choice (radio)' : 'multiple-select (checkbox)';
  traceLog.push(`Question type: ${questionType}.`);
  
  if (selected.length) {
    traceLog.push(`Student selected ${selected.length} answer(s): ${selected.join(', ')}.`);
  } else {
    traceLog.push('Student did not select any answers.');
  }

  const correctChoices = (model.choices || []).filter((c) => c.correct);
  const correctValues = correctChoices.map((c) => c.value);
  traceLog.push(`${correctChoices.length} correct answer(s) are defined for this question.`);
  
  if (selected.length) {
    const correctSelected = selected.filter((v) => correctValues.includes(v));
    const incorrectSelected = selected.filter((v) => !correctValues.includes(v));
    traceLog.push(
      `Student selected ${correctSelected.length} correct and ${incorrectSelected.length} incorrect answer(s).`
    );
  }

  const partialScoringEnabled = partialScoring.enabled(model, env) && model.choiceMode !== 'radio';
  const scoringMethod = partialScoringEnabled ? 'partial scoring' : 'all-or-nothing scoring';
  traceLog.push(`Score calculated using ${scoringMethod}.`);

  const score = getScore(model, session);
  traceLog.push(`Final score: ${score}.`);

  return traceLog;
};

/**
 *
 * The score is partial by default for checkbox mode, allOrNothing for radio mode.
 * To disable partial scoring for checkbox mode you either set model.partialScoring = false or env.partialScoring = false. the value in `env` will
 * override the value in `model`.
 * @param {Object} model - the main model
 * @param {*} session
 * @param {Object} env
 */
export function outcome(model: MultipleChoiceModel, session: MultipleChoiceSession | undefined, env: PieEnvironment) {
  return new Promise<{ score: number; empty: boolean; traceLog: string[] }>((resolve) => {
    if (!session || isEmpty(session)) {
      resolve({ score: 0, empty: true, traceLog: ['Student did not select any answers. Score is 0.'] });
    } else {
      const traceLog = getLogTrace(model, session, env);
      const score = getScore(model, session);
      const partialScoringEnabled = partialScoring.enabled(model, env) && model.choiceMode !== 'radio';

      resolve({ 
        score: partialScoringEnabled ? score : score === 1 ? 1 : 0, 
        empty: false, 
        traceLog 
      });
    }
  });
}

export const createCorrectResponseSession = (question: MultipleChoiceModel, env: PieEnvironment) => {
  return new Promise<MultipleChoiceSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { choices } = question || { choices: [] };

      resolve({
        id: '1',
        value: choices.filter((c) => c.correct).map((c) => c.value),
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<MultipleChoiceModel> = {},
  config: MultipleChoiceConfiguration = {},
): MultipleChoiceValidationErrors => {
  const { choices } = model;
  const { minAnswerChoices = 2, maxAnswerChoices } = config;
  const reversedChoices = [...(choices || [])].reverse();
  const choicesErrors: Record<string, string> = {};
  const rationaleErrors: Record<string, string> = {};
  const errors: MultipleChoiceValidationErrors = {};

  (['teacherInstructions', 'prompt'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  let hasCorrectResponse = false;
  let correctCount = 0;

  reversedChoices.forEach((choice, index) => {
    const { correct, value, label, rationale } = choice;

    if (correct) {
      hasCorrectResponse = true;
      correctCount++;
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
  } else {
    const { maxSelections, choiceMode } = model;

    if (choiceMode !== 'radio' && maxSelections != null && correctCount > maxSelections) {
      errors.correctResponse = `The number of correct answers (${correctCount}) exceeds max selections (${maxSelections}). Students won't be able to select all correct answers.`;
    }
  }

  if (!isEmpty(choicesErrors)) {
    errors.choices = choicesErrors;
  }

  if (!isEmpty(rationaleErrors)) {
    errors.rationale = rationaleErrors;
  }

  return errors;
};
