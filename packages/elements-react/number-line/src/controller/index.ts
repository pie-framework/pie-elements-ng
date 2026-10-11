import { cloneDeep, find, isEmpty, isEqualWith, merge, omitBy } from '@pie-element/shared-lodash';
import { getFeedbackForCorrectness, type Correctness, type Feedback } from '@pie-element/shared-feedback';
import { partialScoring } from '@pie-element/shared-controller-utils';
import type { PieEnvironment } from '@pie-element/shared-types';
import * as math from 'mathjs';

import defaults from './defaults.js';
import { reloadTicksData } from './utils.js';
import type {
  NumberLineGraph,
  NumberLineModel,
  NumberLineResponse,
  NumberLineSession,
  NumberLineTicks,
  NumberLineConfiguration,
} from '../types.js';

/** The environment, plus the accessibility settings a host may pass */
type NumberLineEnvironment = PieEnvironment & { accessibility?: { colorContrast?: string } };

/** A rule of the legacy partial scoring that `getScore` reads */
type PartialScoringRule = { numberOfCorrect: number; scorePercentage: number };

/** The legacy question shape `getScore` reads: `partialScoring` holds rules, gated by `allowPartialScoring` */
type LegacyScoredQuestion = {
  correctResponse: NumberLineResponse[];
  allowPartialScoring?: boolean;
  partialScoring?: PartialScoringRule[];
};

type Corrected = {
  /** Indices of the answers that match a correct response */
  correct: number[];
  /** Indices of the answers that match no correct response */
  incorrect: number[];
  /** Correct responses no answer matched */
  notInAnswer: NumberLineResponse[];
  noCorrectResponse?: boolean;
};

type NumberLineCorrectness = 'unknown' | 'unanswered' | 'correct' | 'partial' | 'incorrect';

export type NumberLineValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
  widthError?: string;
  domainError?: string;
  maxError?: string;
  pointsError?: string;
  correctResponseError?: string;
};

const score = (number: number) => {
  return {
    score: {
      scaled: number,
    },
  };
};

const getPartialScore = (corrected: Corrected, ps: PartialScoringRule[]) => {
  const { correct } = corrected;
  const rule = ps.find((r) => r.numberOfCorrect === correct.length);

  if (rule) {
    return 1.0 * (rule.scorePercentage / 100);
  } else {
    return 0;
  }
};

const accumulateAnswer = (correctResponse: NumberLineResponse[]) => (total: number, answer: NumberLineResponse) => {
  const isCorrectResponse = correctResponse.some((cr) => matches(cr)(answer));
  return total + (isCorrectResponse ? 1 : 0);
};

/**
 * Generates detailed trace log for scoring evaluation
 * @param {Object} model - the question model
 * @param {Object} session - the student session
 * @param {Object} env - the environment
 * @returns {Array} traceLog - array of trace messages
 */
export const getLogTrace = (
  model: NumberLineModel,
  session: NumberLineSession | null | undefined,
  env: PieEnvironment,
): string[] => {
  const traceLog: string[] = [];

  const studentAnswers = session?.answer || [];
  const correctResponse = model?.correctResponse || [];

  if (!studentAnswers.length) {
   return ['Student did not interact with the number line.'];
  }

  const corrected = getCorrected(studentAnswers, cloneDeep(correctResponse));
  const { correct, incorrect, notInAnswer, noCorrectResponse } = corrected;

  if (noCorrectResponse) {
    return ['No correct response is defined for this item.'];
  }

  const correctCount = correct.length;
  const incorrectCount = incorrect.length;
  const missingCount = notInAnswer.length;

  if (correctCount > 0) {
    traceLog.push(`${correctCount} object(s) correctly placed.`);
  }

  if (incorrectCount > 0) {
    traceLog.push(`${incorrectCount} incorrect object(s) placed.`);
  }

  if (missingCount > 0) {
    traceLog.push(`${missingCount} expected object(s) were not placed.`);
  }

  const studentAnswersCopy = [...studentAnswers];

  correct.forEach((index) => {
    const answer = studentAnswersCopy[index];
    const objectType = answer?.type || 'object';
    traceLog.push(`${objectType.charAt(0).toUpperCase() + objectType.slice(1)} at position ${answer.domainPosition} is correct.`);
  });

  incorrect.forEach((index) => {
    const answer = studentAnswersCopy[index];
    const objectType = answer?.type || 'object';
    traceLog.push(`${objectType.charAt(0).toUpperCase() + objectType.slice(1)} at position ${answer.domainPosition} does not match the expected response.`);
  });

  notInAnswer.forEach((expectedObject) => {
    const objectType = expectedObject?.type || 'object';
    traceLog.push(`Expected ${objectType} at position ${expectedObject.domainPosition} was not placed by the student.`);
  });

  const partialScoringEnabled = partialScoring.enabled(model, env);

  if (partialScoringEnabled) {
    traceLog.push('Score calculated using partial scoring.');
    traceLog.push(`Partial scoring is based on the number of correct objects, with deductions for extras.`);
  } else {
    traceLog.push('Score calculated using all-or-nothing scoring.');
  }

  const total = correctResponse.length || 1;
  const extraPlacements =
    studentAnswers.length > total ? studentAnswers.length - total : 0;

  if (extraPlacements > 0) {
    traceLog.push(
      `${extraPlacements} extra object(s) beyond the required amount were placed and deducted.`,
    );
  }

  const rawScore = Math.max(0, (correctCount - extraPlacements) / total);
  const finalScore = partialScoringEnabled ? rawScore : rawScore === 1 ? 1 : 0;

  traceLog.push(`Final score: ${finalScore}.`);

  return traceLog;
};


/**
 */
export function outcome(
  model: NumberLineModel,
  session: NumberLineSession | null | undefined,
  env: PieEnvironment,
): Promise<{ score: number; empty?: boolean; logTrace: string[] }> {
  return new Promise((resolve) => {
    if (!session || isEmpty(session)) {
      resolve({ score: 0, empty: true, logTrace: ['Student did not interact with the number line.'] });
    } else {
      const partialScoringEnabled = partialScoring.enabled(model, env);
      // Read without the defaults: a model without correctResponse throws here.
      const correctResponse = model.correctResponse as NumberLineResponse[];
      const numCorrect = (session.answer || []).reduce(accumulateAnswer(correctResponse), 0);

      let total = correctResponse.length;
      let numIncorrect = 0;

      if ((session.answer || []).length > total) {
        numIncorrect = (session.answer || []).length - total;
      }

      if (total === 0) {
        total = 1;
      }

      let score = numCorrect < 0 ? 0 : (numCorrect - numIncorrect) / total;

      if (score < 0) {
        score = 0;
      }

      resolve({ 
        score: partialScoringEnabled ? score : score === 1 ? 1 : 0,
        logTrace: getLogTrace(model, session, env)
      });
    }
  });
}

export function getScore(
  question: LegacyScoredQuestion,
  session: NumberLineSession | null | undefined,
): Promise<{ score: { scaled: number } }> {
  return new Promise((resolve) => {
    if (!session || isEmpty(session)) {
      resolve({ score: { scaled: 0 } });
    } else {
      session.answer = session.answer || [];

      const corrected = getCorrected(session.answer, cloneDeep(question.correctResponse));

      const correctness = getCorrectness(corrected);

      if (correctness === 'correct') {
        resolve(score(1.0));
      } else if (correctness === 'incorrect') {
        resolve(score(0.0));
      } else if (correctness === 'partial') {
        const { allowPartialScoring, partialScoring } = question;
        const ps = (partialScoring || []).filter((o) => !isEmpty(o));
        const canDoPartialScoring = allowPartialScoring && ps.length > 0;
        if (canDoPartialScoring) {
          resolve(score(getPartialScore(corrected, ps)));
        } else {
          resolve(score(0.0));
        }
      } else {
        resolve({ score: { scaled: -1 } });
      }
    }
  });
}

export const CLOSE_TO_PRECISION = 3;

export const closeTo = (a: number, b: number, precision?: number) => {
  precision = precision || 5;
  const expectedDiff = Math.pow(10, -precision) / 2;
  const receivedDiff = Math.abs(a - b);
  const close = receivedDiff <= expectedDiff;
  return close;
};

const matches = (a: NumberLineResponse) => (v: NumberLineResponse) => {
  return isEqualWith(a, v, (v: unknown, ov: unknown) => {
    if (typeof v === 'number' && typeof ov === 'number') {
      return closeTo(v, ov, CLOSE_TO_PRECISION);
    }
  });
};

export const getCorrected = (answer: NumberLineResponse[], correctResponse: NumberLineResponse[]): Corrected => {
  if (isEmpty(correctResponse) && answer.length > 0) {
    return {
      correct: [],
      incorrect: [],
      notInAnswer: [],
      noCorrectResponse: true,
    };
  }

  return answer.reduce<Corrected>(
    (acc, a, index) => {
      const { correct, incorrect, notInAnswer } = acc;

      const match = find(notInAnswer, matches(a));
      if (match) {
        correct.push(index);
        notInAnswer.splice(notInAnswer.indexOf(match), 1);
      } else {
        incorrect.push(index);
      }

      return {
        correct: correct,
        incorrect: incorrect,
        notInAnswer: notInAnswer,
      };
    },
    {
      correct: [],
      incorrect: [],
      notInAnswer: correctResponse,
    },
  );
};

export const getCorrectness = (corrected: Corrected): NumberLineCorrectness => {
  const { incorrect, correct, notInAnswer, noCorrectResponse } = corrected;

  if (noCorrectResponse) {
    return 'unknown';
  }

  if (incorrect.length === 0 && correct.length === 0) {
    return 'unanswered';
  }

  if (incorrect.length === 0 && notInAnswer.length === 0) {
    return 'correct';
  }

  if (incorrect.length > 0 || notInAnswer.length > 0) {
    if (correct.length > 0) {
      return 'partial';
    } else {
      return 'incorrect';
    }
  }

  return 'unknown';
};

/**
 * A sample of a normalize function see:
 * https://github.com/pie-framework/pie-elements/issues/21
 */
export function normalize(question: NumberLineModel) {
  // A copy: merge and model()'s tick updates write into the objects they are given.
  const base = cloneDeep(defaults);
  const feedback = merge(base.feedback, question.feedback);

  return { ...base, ...question, feedback };
}

export function createDefaultModel(model: Partial<NumberLineModel> = {}): Promise<Partial<NumberLineModel>> {
  return new Promise((resolve) => {
    const out = {
      ...model,
      graph: {
        ...cloneDeep(defaults.graph),
        ...model.graph,
      },
      colorContrast: 'black_on_white',
    };

    resolve(omitBy(out, (v) => !v));
  });
}

// this function is duplicated in configure; at some point, use the same shared function
const updateTicks = <T extends { graph: NumberLineGraph }>(model: T): T => {
  const { graph: { domain, labelStep, ticks = {} as NumberLineTicks } = {} as NumberLineGraph } = model;
  const { minor, major } = ticks;

  if (domain) {
    domain.min = Number((domain.min || 0).toFixed(2));
    domain.max = Number((domain.max || 0).toFixed(2));
  }

  if (labelStep && typeof labelStep === 'string' && labelStep.match(/^[1-9][0-9]*\/[1-9][0-9]*$/g)) {
    model.graph.fraction = true;
    ticks.tickIntervalType = 'Fraction';

    // update the ticks frequency and label value to match the label step if needed
    const step: number = math.evaluate(labelStep);

    if (step !== major) {
      ticks.major = step;
      ticks.minor = step / (major / minor);
    }
  }

  return model;
};

export async function model(
  question: NumberLineModel,
  session: NumberLineSession | null | undefined,
  env: NumberLineEnvironment,
) {
  if (!question) {
    throw new Error('question is null');
  }

  const normalizedQuestion = await normalize(question);
  const normalizedModel = updateTicks(normalizedQuestion);
  // this function is also called in configure, it is a duplicate to maintain consistency and correctness
  const graph = reloadTicksData(normalizedModel.graph);

  if (graph) {
    const evaluateMode = env.mode === 'evaluate';

    const correctResponse = cloneDeep(normalizedQuestion.correctResponse);
    const corrected = evaluateMode && getCorrected(session ? session.answer || [] : [], correctResponse);
    const correctness = evaluateMode && getCorrectness(corrected as Corrected);

    const { exhibitOnly } = graph;
    const disabled = env.mode !== 'gather' || exhibitOnly === true;
    let teacherInstructions = null;

    if (env.role === 'instructor' && (env.mode === 'view' || evaluateMode)) {
      teacherInstructions = normalizedQuestion.teacherInstructions;
    }

    const feedbackMessage = evaluateMode
      ? // 'unknown' (no correct response) has no default feedback, so it gets no message.
        await getFeedbackForCorrectness(correctness as Correctness, normalizedQuestion.feedback as Partial<Feedback>)
      : undefined;

    const out = {
      prompt: normalizedQuestion.prompt,
      teacherInstructions,
      graph,
      disabled,
      corrected,
      correctResponse:
        evaluateMode && ['unanswered', 'correct'].indexOf(correctness as string) === -1 && normalizedQuestion.correctResponse,
      feedback: feedbackMessage && {
        type: correctness,
        message: feedbackMessage,
      },
      colorContrast: (env.accessibility && env.accessibility.colorContrast) || 'black_on_white',
      language: normalizedQuestion.language,
      extraCSSRules: normalizedQuestion.extraCSSRules,
    };
    return omitBy(out, (v) => !v);
  } else {
    throw new Error('graph is undefined');
  }
}

export const createCorrectResponseSession = (
  question: NumberLineModel,
  env: PieEnvironment,
): Promise<NumberLineSession | null> => {
  return new Promise((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { correctResponse: answer } = question;

      resolve({
        answer,
        id: '1',
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<NumberLineModel> = {},
  config: NumberLineConfiguration = {},
): NumberLineValidationErrors => {
  const { graph, correctResponse } = model || {};
  const { maxMaxElements = 20, numberLineDimensions: { min: minWidth = 200, max: maxWidth = 800 } = {} } = config || {};
  const { width, domain, maxNumberOfPoints } = graph || {};
  const { min, max } = domain || {};
  const errors: NumberLineValidationErrors = {};

  (['teacherInstructions', 'prompt'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  // A missing value compares false, so it raises no error.
  if ((width as number) < minWidth || (width as number) > maxWidth) {
    errors.widthError = `Width should be a value between ${minWidth} and ${maxWidth}.`;
  }

  const MIN_DOMAIN = -100000;
  const MAX_DOMAIN = 100000;

  if (
    (min as number) < MIN_DOMAIN ||
    (min as number) > MAX_DOMAIN ||
    (max as number) < MIN_DOMAIN ||
    (max as number) > MAX_DOMAIN
  ) {
    errors.domainError = `Min and max values must both be in the range [${MIN_DOMAIN}, ${MAX_DOMAIN}].`;
  }

  if ((min as number) >= (max as number)) {
    errors.maxError = 'Max value must be greater than min value.';
  }

  if ((maxNumberOfPoints as number) < 1 || (maxNumberOfPoints as number) > maxMaxElements) {
    errors.pointsError = `Max number of elements should be between 1 and ${maxMaxElements}.`;
  }

  if (correctResponse && correctResponse.length === 0) {
    errors.correctResponseError = 'The correct answer should include at least one number line object.';
  }

  return errors;
};
