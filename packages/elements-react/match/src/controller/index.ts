import { cloneDeep, isEmpty, isEqual } from '@pie-element/shared-lodash';
import { getFeedbackForCorrectness, type Correctness, type Feedback } from '@pie-element/shared-feedback';
import { lockChoices, getShuffledChoices, partialScoring } from '@pie-element/shared-controller-utils';
import type { PieEnvironment, PieUpdateSession } from '@pie-element/shared-types';
import debug from 'debug';
import type { MatchConfiguration, MatchModel, MatchRow, MatchSession } from '../types.js';

const log = debug('@pie-element:match:controller');

import defaults from './defaults.js';

/** The learner's selections: for each row id, one flag per answer column. */
type Answers = Record<string, boolean[]>;

/** The session shape the shared choice utilities take; ours may carry numeric row ids. */
type SharedSession = Parameters<typeof getShuffledChoices>[1];

/** Errors `validate()` reports; `rowsErrors` is keyed by row id, `columnsErrors` by column index. */
export type MatchValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
  rationale?: string;
  noOfRowsError?: string;
  rowsErrors?: Record<string, string>;
  correctResponseError?: string;
  columnsLengthError?: string;
  columnsErrors?: Record<number, string>;
};

/** The model `model()` hands the delivery. */
type MatchViewModel = Omit<
  MatchModel,
  'feedback' | 'feedbackEnabled' | 'prompt' | 'promptEnabled' | 'lockChoiceOrder' | 'rationale' | 'teacherInstructions'
> & {
  allowFeedback?: boolean;
  prompt: string | null;
  shuffled: boolean;
  feedback?: string;
  disabled: boolean;
  view: boolean;
  rationale?: string | null;
  teacherInstructions?: string | null;
  correctResponse?: Answers;
  correctness?: { score: string; correctness?: Correctness };
};

const getResponseCorrectness = (
  model: MatchModel,
  answers: Answers | undefined,
  env: Partial<PieEnvironment> = {},
): Correctness => {
  const isPartialScoring = partialScoring.enabled(model, env);
  const rows = model.rows;
  const checkboxMode = model.choiceMode === 'checkbox';

  if (!answers || Object.keys(answers).length === 0) {
    return 'unanswered';
  }

  const totalCorrectAnswers = checkboxMode ? getTotalCorrectAnswers(model) : getTotalCorrect(model);
  let correctAnswers: number;
  let incorrectAnswers = 0;

  if (checkboxMode) {
    const checkboxes = getCheckboxes(rows, answers);

    correctAnswers = checkboxes.correctAnswers;
    incorrectAnswers = checkboxes.incorrectAnswers;
  } else {
    correctAnswers = getCorrectRadios(rows, answers);
  }

  if (totalCorrectAnswers === correctAnswers && !incorrectAnswers) {
    return 'correct';
  } else if (correctAnswers === 0) {
    return 'incorrect';
  } else if (isPartialScoring) {
    return 'partial';
  }

  return 'incorrect';
};

const getCorrectness = (
  question: MatchModel,
  env: Partial<PieEnvironment>,
  answers: Answers = {},
): Correctness | undefined => {
  if (env.mode === 'evaluate') {
    return getResponseCorrectness(question, answers, env);
  }
};

const getCheckboxes = (rows: MatchRow[], answers: Answers) => {
  let correctAnswers = 0;
  let incorrectAnswers = 0;

  rows.forEach((row) => {
    const answer = answers[row.id];

    if (answer) {
      row.values.forEach((v, i) => {
        if (answer[i] && answer[i] === v) {
          correctAnswers += 1;
        } else if (answer[i] && answer[i] !== v) {
          incorrectAnswers += 1;
        }
      });
    }
  });

  return { correctAnswers, incorrectAnswers };
};

const getCorrectRadios = (rows: MatchRow[], answers: Answers) => {
  let correctAnswers = 0;

  rows.forEach((row) => {
    if (isEqual(row.values, answers[row.id])) {
      correctAnswers += 1;
    }
  });

  return correctAnswers;
};

const getTotalCorrect = (question: MatchModel) => {
  const checkboxMode = question.choiceMode === 'checkbox';
  const matchingTable = checkboxMode ? (question.layout as number) - 1 : 1;
  return (question.rows.length || 0) * matchingTable;
};

const getTotalCorrectAnswers = (question: MatchModel) => {
  let noOfTotalCorrectAnswers = 0;

  question.rows.forEach((row) => {
    row.values.forEach((value) => {
      if (value) {
        noOfTotalCorrectAnswers += 1;
      }
    });
  });

  return noOfTotalCorrectAnswers;
};

const getPartialScore = (question: MatchModel, answers: Answers) => {
  const checkboxMode = question.choiceMode === 'checkbox';

  if (checkboxMode) {
    const { correctAnswers, incorrectAnswers } = getCheckboxes(question.rows, answers);
    const totalCorrect = getTotalCorrectAnswers(question);

    const total = totalCorrect === 0 ? 1 : totalCorrect;

    if (correctAnswers + incorrectAnswers > totalCorrect) {
      const extraAnswers = correctAnswers + incorrectAnswers - totalCorrect;
      const score = parseFloat(((correctAnswers - extraAnswers) / total).toFixed(2));

      return score < 0 ? 0 : score;
    } else {
      return parseFloat((correctAnswers / total).toFixed(2));
    }
  } else {
    const correctAnswers = getCorrectRadios(question.rows, answers);
    const totalCorrect = getTotalCorrect(question) === 0 ? 1 : getTotalCorrect(question);

    return parseFloat((correctAnswers / totalCorrect).toFixed(2));
  }
};

const getOutComeScore = (question: MatchModel, env: Partial<PieEnvironment>, answers: Answers = {}) => {
  const correctness = getCorrectness(question, env, answers);
  const isPartialScoring = partialScoring.enabled(question, env);

  return correctness === 'correct'
    ? 1
    : correctness === 'partial' && isPartialScoring
      ? getPartialScore(question, answers)
      : 0;
};

/**
 * Generates detailed trace log for match item scoring evaluation
 * @param {Object} question
 * @param {Object} session
 * @param {Object} env
 * @returns {Array<string>} traceLog
 */
export const getLogTrace = (
  question: MatchModel,
  session: MatchSession | undefined,
  env: Partial<PieEnvironment>,
) => {
  const traceLog: string[] = [];

  const answers = session?.answers || {};
  const rows = question?.rows || [];
  const checkboxMode = question.choiceMode === 'checkbox';

  if (!answers || Object.keys(answers).length === 0) {
    traceLog.push('Student did not provide any answer.');
    return traceLog;
  }

  traceLog.push(`Match item contains ${rows.length} row(s).`);
  traceLog.push(`Matching mode: ${checkboxMode ? 'checkbox (multiple matches allowed)' : 'radio (single match per row)'}.`);

  let correctCount = 0;
  let incorrectCount = 0;
  let totalCorrect = 0;

  rows.forEach((row) => {
    const studentAnswer = answers[row.id];
    const correctValues = row.values || [];

    if (checkboxMode) {
      correctValues.forEach((v, idx) => {
        if (v) {
          totalCorrect++;
        }

        if (studentAnswer && studentAnswer[idx]) {
          if (studentAnswer[idx] === v) {
            correctCount++;
          } else {
            incorrectCount++;
          }
        }
      });
    } else {
      totalCorrect++;
      if (studentAnswer) {
        if (isEqual(correctValues, studentAnswer)) {
          correctCount++;
        } else {
          incorrectCount++;
        }
      }
    }
  });

  if (correctCount > 0) {
    traceLog.push(`${correctCount} correct match(es) selected.`);
  }

  if (incorrectCount > 0) {
    traceLog.push(`${incorrectCount} incorrect match(es) selected.`);
  }

  if (correctCount === 0 && incorrectCount === 0) {
    traceLog.push('Student provided answers, but none matched the correct responses.');
  }

  const partialScoringEnabled = partialScoring.enabled(question, env);

  if (partialScoringEnabled) {
    traceLog.push('Score calculated using partial scoring.');

    if (checkboxMode) {
      traceLog.push(
        'Score is based on the number of correct minus extra incorrect matches, divided by the total number of correct matches.',
      );

      if (correctCount + incorrectCount > totalCorrect) {
        traceLog.push('Extra selected matches beyond the correct set reduce the score.');
      }
    } else {
      traceLog.push(
        'Score is based on the number of correctly matched rows divided by the total number of rows.',
      );
    }
  } else {
    traceLog.push('Score calculated using all-or-nothing scoring.');
    traceLog.push('Student must match all rows correctly to receive full credit.');
  }

  const rawScore = getOutComeScore(question, env, answers);
  const finalScore = partialScoringEnabled ? rawScore : rawScore === 1 ? 1 : 0;

  traceLog.push(`Final score: ${finalScore}.`);

  return traceLog;
};

export const outcome = (question: MatchModel, session: MatchSession | undefined, env: PieEnvironment) => {
  return new Promise<{ score?: number; completed?: boolean; empty?: boolean; logTrace: string[] }>((resolve) => {
    if (env.mode !== 'evaluate') {
      resolve({ score: undefined, completed: undefined, logTrace: [] });
    } else {
      if (!session || isEmpty(session)) {
        resolve({ score: 0, empty: true, logTrace: ['Student did not provide any answer.'] });
      }

      const out = {
        score: getOutComeScore(question, env, (session as MatchSession).answers),
        empty: false,
        logTrace: getLogTrace(question, session, env),
      };

      resolve(out);
    }
  });
};

export function createDefaultModel(model: Partial<MatchModel> = {}) {
  return new Promise<Partial<MatchModel>>((resolve) => {
    resolve({
      ...defaults,
      ...model,
    });
  });
}

export const normalize = (question: MatchModel) => ({ ...defaults, ...question });

/**
 *
 * @param {*} question
 * @param {*} session
 * @param {*} env
 * @param {*} updateSession - optional - a function that will set the properties passed into it on the session.
 */
export async function model(
  question: MatchModel,
  session: MatchSession | undefined,
  env: PieEnvironment,
  updateSession?: PieUpdateSession,
) {
  const normalizedQuestion = cloneDeep(normalize(question));
  let correctness: Correctness | undefined, score: string;

  if ((!session || isEmpty(session)) && env.mode === 'evaluate') {
    correctness = 'unanswered';
    score = '0%';
  } else {
    correctness = getCorrectness(normalizedQuestion, env, session && session.answers);
    score = `${getOutComeScore(normalizedQuestion, env, session && session.answers) * 100}%`;
  }

  const correctResponse: Answers = {};
  const correctInfo = {
    score,
    correctness,
  };

  const lockChoiceOrder = lockChoices(normalizedQuestion, session as SharedSession, env);

  if (!lockChoiceOrder) {
    // `undefined` without a session, which the `forEach` below then throws on
    normalizedQuestion.rows = (await getShuffledChoices(
      normalizedQuestion.rows,
      session as SharedSession,
      updateSession,
      'id',
    )) as MatchRow[];
  }

  normalizedQuestion.rows.forEach((row) => {
    correctResponse[row.id] = row.values;

    if (env.mode !== 'evaluate') {
      delete (row as Partial<MatchRow>).values;
    }
  });

  const feedback =
    env.mode === 'evaluate' && normalizedQuestion.feedbackEnabled
      ? await getFeedbackForCorrectness(
          correctInfo.correctness as Correctness,
          normalizedQuestion.feedback as Partial<Feedback> | undefined,
        )
      : undefined;

  const {
    extraCSSRules,
    feedbackEnabled,
    promptEnabled,
    prompt,
    lockChoiceOrder: _,
    ...essentials
  } = normalizedQuestion;
  const out: MatchViewModel = {
    ...essentials,
    extraCSSRules,
    allowFeedback: feedbackEnabled,
    prompt: promptEnabled ? prompt : null,
    shuffled: !lockChoiceOrder,
    feedback,
    disabled: env.mode !== 'gather',
    view: env.mode === 'view',
  };

  if (env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate')) {
    out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
      ? normalizedQuestion.teacherInstructions
      : null;
    out.rationale = normalizedQuestion.rationaleEnabled ? normalizedQuestion.rationale : null;
  } else {
    out.rationale = null;
    out.teacherInstructions = null;
  }

  if (env.mode === 'evaluate') {
    Object.assign(out, {
      correctResponse,
      correctness: correctInfo,
    });
  }

  log('out: ', out);
  return out;
}

export const createCorrectResponseSession = (question: MatchModel, env: PieEnvironment) => {
  return new Promise<MatchSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { rows } = question;
      const answers: Answers = {};

      rows.forEach((r) => {
        answers[r.id] = r.values;
      });

      resolve({
        answers,
        id: '1',
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags
const getInnerText = (html: string | undefined) => (html || '').replaceAll(/<[^>]*>/g, '');

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<MatchModel> = {},
  config: MatchConfiguration = {},
): MatchValidationErrors => {
  const { rows, choiceMode, headers } = model;
  const {
    minQuestions,
    maxQuestions,
    maxLengthQuestionsHeading,
    maxAnswers,
    maxLengthAnswers,
    maxLengthFirstColumnHeading,
  } = config;
  const rowsErrors: Record<string, string> = {};
  const columnsErrors: Record<number, string> = {};
  const errors: MatchValidationErrors = {};

  (['teacherInstructions', 'prompt', 'rationale'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  // without `rows` this throws; a missing bound compares false
  if ((rows as MatchRow[]).length < (minQuestions as number)) {
    errors.noOfRowsError = `There should be at least ${minQuestions} question rows.`;
  } else if ((rows as MatchRow[]).length > (maxQuestions as number)) {
    errors.noOfRowsError = `No more than ${maxQuestions} question rows should be defined.`;
  }

  (rows || []).forEach((row, index) => {
    const { id, values = [], title } = row;
    rowsErrors[id] = '';

    if (maxLengthQuestionsHeading && getInnerText(title).length > maxLengthQuestionsHeading) {
      rowsErrors[id] += `Content length should be maximum ${maxLengthQuestionsHeading} characters. `;
    }

    if (!getContent(title)) {
      rowsErrors[id] += 'Content should not be empty. ';
    } else {
      // check for identical content with the previous answers
      const identicalAnswer = (rows as MatchRow[])
        .slice(0, index)
        .some((r) => getContent(r.title) === getContent(title));

      if (identicalAnswer) {
        rowsErrors[id] += 'Content should be unique. ';
      }
    }

    const hasCorrectResponse = values.some((value) => !!value);

    if (!hasCorrectResponse) {
      rowsErrors[id] += 'No correct response defined.';
    }
  });

  if (maxAnswers && (headers as string[]).length - 1 > maxAnswers) {
    errors.columnsLengthError = `There should be maximum ${maxAnswers} answers.`;
  }

  if (maxLengthFirstColumnHeading && (headers as string[])[0].length > maxLengthFirstColumnHeading) {
    columnsErrors[0] = `Content length should be maximum ${maxLengthFirstColumnHeading} characters.`;
  }

  const headersContent = (headers || []).map((heading) => getContent(heading));
  headersContent.shift(); // remove first column since it does not require validation

  headersContent.forEach((heading, index) => {
    const headerIndex = index + 1; // we need to add 1 because we removed first header from validation
    columnsErrors[headerIndex] = '';

    if (maxLengthAnswers && getInnerText(heading).length > maxLengthAnswers) {
      columnsErrors[headerIndex] += `Content length should be maximum ${maxLengthAnswers} characters. `;
    }

    if (!heading) {
      columnsErrors[headerIndex] += 'Content should not be empty.';
    } else {
      // check for identical content with the previous headers
      const identicalAnswer = headersContent.slice(0, index).some((head) => head === heading);

      if (identicalAnswer) {
        columnsErrors[index + 1] += 'Content should be unique.';
      }
    }
  });

  const hasRowErrors = Object.values(rowsErrors).some((error) => (error || '').length);

  if (hasRowErrors) {
    errors.rowsErrors = rowsErrors;

    const noCorrectAnswer = Object.values(rowsErrors).some((error) =>
      (error || '').includes('No correct response defined.'),
    );

    if (noCorrectAnswer) {
      errors.correctResponseError =
        choiceMode === 'radio'
          ? 'There should be a correct response defined for every row.'
          : 'There should be at least one correct response defined for every row.';
    }
  }

  const hasColumnErrors = Object.values(columnsErrors).some((error) => (error || '').length);

  if (hasColumnErrors) {
    errors.columnsErrors = columnsErrors;
  }

  return errors;
};
