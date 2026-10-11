import debug from 'debug';
import { isEmpty } from '@pie-element/shared-lodash';
import { getActualFeedbackForCorrectness } from '@pie-element/shared-feedback';
import type { Correctness, Feedback } from '@pie-element/shared-feedback';
import type { ExtraCSSRules, PieEnvironment } from '@pie-element/shared-types';
import type {
  MathInlineAnswer,
  MathInlineConfiguration,
  MathInlineModel,
  MathInlineResponse,
  MathInlineSession,
} from '../types.js';

import { ResponseTypes } from './utils.js';
import Translator from '@pie-lib/translator';

const { translator } = Translator;
import defaults from './defaults.js';

import * as mv from '@pie-framework/math-validation';

const log = debug('@pie-element:math-inline:controller');

/** Correctness of the learner's answer; `score` is a number for `outcome()` and a percentage for `model()`. */
type MathInlineCorrectness = {
  correctness: 'correct' | 'incorrect' | 'unanswered';
  score: number | string;
  correct: boolean;
};

/** Options `latexEqual()` reads; the published `Opts` type leaves out `literal`. */
type LatexEqualOpts = mv.Opts & {
  literal?: { allowTrailingZeros: boolean; ignoreOrder: boolean };
};

/** The model with the controller defaults applied. */
type NormalizedQuestion = ReturnType<typeof normalize>;

/** The model as the delivery view receives it. */
type MathInlineViewConfig = Omit<
  NormalizedQuestion,
  'extraCSSRules' | 'responses' | 'language' | 'prompt' | 'rationale' | 'teacherInstructions'
> & {
  responses?: MathInlineResponse[];
  prompt?: string | null;
  rationale?: string | null;
  teacherInstructions?: string | null;
  showNote?: boolean;
  note?: string;
  env?: PieEnvironment;
};

type MathInlineViewModel = {
  extraCSSRules?: ExtraCSSRules;
  config: MathInlineViewConfig;
  correctness?: MathInlineCorrectness;
  feedback?: string;
  disabled: boolean;
  view: boolean;
  correctResponse?: Record<string, never>;
  rationale?: string | null;
  teacherInstructions?: string | null;
  language?: string;
};

type MathInlineOutcome = {
  score: number | string | undefined;
  completed?: undefined;
  empty?: boolean;
  logTrace: string[];
};

/** Errors `validate()` reports, keyed by field; `responsesErrors` is keyed by response index, then by `answer` or alternate id. */
export type MathInlineValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
  rationale?: string;
  responseAreasError?: string;
  responsesErrors?: Record<number, Record<string, string>>;
};

const getResponseCorrectness = (
  model: MathInlineModel,
  answerItem: string | undefined,
  isOutcome?: boolean,
): MathInlineCorrectness => {
  // An unnormalized model reaches here from `outcome()`, so `responses` can be absent.
  const correctResponses = model.responses as MathInlineResponse[];
  const isAdvanced = model.responseType === ResponseTypes.advanced;

  if (!answerItem) {
    return {
      correctness: 'unanswered',
      score: isOutcome ? 0 : '0%',
      correct: false,
    };
  }

  const isAnswerCorrect = getIsAnswerCorrect(isAdvanced ? correctResponses : correctResponses.slice(0, 1), answerItem);

  const correctnessObject: MathInlineCorrectness = {
    correctness: 'incorrect',
    score: isOutcome ? 0 : '0%',
    correct: false,
  };

  if (isAnswerCorrect) {
    correctnessObject.correctness = 'correct';
    correctnessObject.score = isOutcome ? 1 : '100%';
    correctnessObject.correct = true;
  }

  return correctnessObject;
};

function getIsAnswerCorrect(correctResponseItems: MathInlineResponse[] | undefined, answerItem: string) {
  let answerCorrect = false;

  (correctResponseItems || []).forEach((correctResponse) => {
    if (answerCorrect) return;

    const opts: LatexEqualOpts = {
      mode: correctResponse.validation || defaults.validationDefault,
    };

    if (opts.mode === 'literal') {
      opts.literal = {
        allowTrailingZeros: correctResponse.allowTrailingZeros || false,
        ignoreOrder: correctResponse.ignoreOrder || false,
      };
    }

    const alternates = correctResponse.alternates || {};
    const acceptedValues = [correctResponse.answer].concat(
      Object.keys(alternates).map((alternateId) => alternates[alternateId]),
    );

    for (let i = 0; i < acceptedValues.length; i++) {
      try {
        if (mv.latexEqual(answerItem, acceptedValues[i], opts)) {
          answerCorrect = true;
          break;
        }
      } catch (e) {
        log('Parse failure when evaluating math', acceptedValues[i], answerItem, e);
        continue;
      }
    }
  });

  return answerCorrect;
}

const getCorrectness = (
  question: MathInlineModel,
  env: PieEnvironment,
  session: MathInlineSession | undefined,
  isOutcome?: boolean,
) => {
  if (env.mode === 'evaluate') {
    return getResponseCorrectness(
      question,
      question.responseType === ResponseTypes.advanced
        ? (session && session.completeAnswer) || ''
        : session && session.response,
      isOutcome,
    );
  }

  return undefined;
};

export function createDefaultModel(model: Partial<MathInlineModel> = {}) {
  return new Promise<Partial<MathInlineModel>>((resolve) => {
    resolve({
      config: {
        ...defaults,
        ...model,
      },
    });
  });
}

/**
 * Generates detailed trace log for math-inline scoring evaluation
 * @param {Object} question
 * @param {Object} session
 * @param {Object} env
 * @returns {Array<string>} traceLog
 */
export const getLogTrace = (
  question: MathInlineModel,
  session: MathInlineSession | undefined,
  env: PieEnvironment,
) => {
  const traceLog: string[] = [];

  if (!session || (!session.response && !session.completeAnswer)) {
    traceLog.push('Student did not enter a response.');
    return traceLog;
  }

  const responseType = question?.responseType;
  const isAdvanced = responseType === ResponseTypes.advanced;
  const studentAnswer = isAdvanced ? session.completeAnswer : session.response;

  const cleanStudentAnswer = studentAnswer ? studentAnswer.replace(/\\/g, '') : '';

  if (!cleanStudentAnswer) {
    traceLog.push('Student entered a response, but then it was removed.');
    return traceLog;
  }

  traceLog.push(`Student entered response: ${cleanStudentAnswer}.`);
  traceLog.push(`Response type: ${isAdvanced ? 'advanced' : 'simple'}.`);

  const responses = question.responses || [];
  const responsesToCheck = isAdvanced ? responses : responses.slice(0, 1);
  
  responsesToCheck.forEach((response, index) => {
    const validation = response.validation || question.validationDefault;
    traceLog.push(`Response ${index + 1} validation mode: ${validation}.`);
    
    if (validation === 'literal') {
      const allowTrailingZeros = response.allowTrailingZeros || false;
      const ignoreOrder = response.ignoreOrder || false;

      traceLog.push(`Allow trailing zeros: ${allowTrailingZeros ? 'enabled' : 'disabled'}.`);
      traceLog.push(`Ignore order: ${ignoreOrder ? 'enabled' : 'disabled'}.`);
    }
    
    const alternates = response.alternates || {};
    const acceptedValues = [response.answer].concat(
      Object.keys(alternates).map((alternateId) => alternates[alternateId])
    );
    
    if (acceptedValues.length > 1) {
      traceLog.push(`Accepted answers: ${acceptedValues.length} (including alternates).`);
    }
  });

  // A session reaches here only from `outcome()` in evaluate mode, where correctness is computed.
  const correctness = getCorrectness(question, env, session, true) as MathInlineCorrectness;

  if (correctness.correctness === 'correct') {
    traceLog.push('Student answer matches one of the accepted responses.');
  } else if (correctness.correctness === 'incorrect') {
    traceLog.push('Student answer does not match any of the accepted responses.');
  } else {
    traceLog.push('Student answer could not be evaluated.');
  }

  traceLog.push(`Response evaluated as ${correctness.correctness}.`);
  traceLog.push(`Final score: ${correctness.score}.`);

  return traceLog;
};

export const outcome = (question: MathInlineModel, session: MathInlineSession | undefined, env: PieEnvironment) => {
  return new Promise<MathInlineOutcome>((resolve) => {
    if (env.mode !== 'evaluate') {
      resolve({ score: undefined, completed: undefined, logTrace: [] });
    } else {
      if (!session || isEmpty(session)) {
        resolve({ score: 0, empty: true, logTrace: ['Student did not enter a response.'] });
      } else {
        const correctness = getCorrectness(question, env, session, true) as MathInlineCorrectness;

        resolve({ score: correctness.score, logTrace: getLogTrace(question, session, env) });
      }
    }
  });
};

export const normalize = (question: MathInlineModel) => {
  // making sure that defaults are set
  if (!isEmpty(question.responses)) {
    question.responses = (question.responses as MathInlineResponse[]).map((correctResponse) => ({
      ...correctResponse,
      validation: correctResponse.validation || question.validationDefault,
      allowTrailingZeros: correctResponse.allowTrailingZeros || question.allowTrailingZerosDefault,
      ignoreOrder: correctResponse.ignoreOrder || question.ignoreOrderDefault,
    }));
  }

  return { ...defaults, ...question };
};

export const model = (question: MathInlineModel, session: MathInlineSession | undefined, env: PieEnvironment) =>
  new Promise<MathInlineViewModel>((resolve) => {
    const normalizedQuestion = normalize(question);
    const correctness = getCorrectness(normalizedQuestion, env, session);
    const { extraCSSRules, responses, language, ...rest } = normalizedQuestion;
    const config: MathInlineViewConfig = rest;

    config.responses = config.responseType === ResponseTypes.simple ? responses.slice(0, 1) : responses;

    const feedback =
      env.mode === 'evaluate' && normalizedQuestion.feedbackEnabled
        ? getActualFeedbackForCorrectness(
            correctness?.correctness as Correctness,
            normalizedQuestion.feedback as Partial<Feedback>,
          )
        : undefined;

    const out: MathInlineViewModel = {
      extraCSSRules,
      config,
      correctness,
      feedback,
      disabled: env.mode !== 'gather',
      view: env.mode === 'view',
    };

    const note = normalizedQuestion.note || translator.t('mathInline.primaryCorrectWithAlternates', { lng: language });
    const showNote =
      (config?.responses?.length ?? 0) > 1 ||
      (config?.responses || []).some(
        (response) => response.validation === 'symbolic' || Object.keys(response.alternates || {}).length > 0,
      );

    if (env.mode === 'evaluate') {
      out.correctResponse = {};
      out.config.showNote = showNote;
      out.config.note = note;
    } else {
      out.config.responses = [];
      out.config.showNote = false;
    }

    if (env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate')) {
      out.rationale = normalizedQuestion.rationaleEnabled ? normalizedQuestion.rationale : null;
      out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
        ? normalizedQuestion.teacherInstructions
        : null;
    } else {
      out.rationale = null;
      out.teacherInstructions = null;
      out.config.rationale = null;
      out.config.teacherInstructions = null;
    }

    out.config.env = env;
    out.config.prompt = normalizedQuestion.promptEnabled ? normalizedQuestion.prompt : null;
    out.language = language;

    log('out: ', out);
    resolve(out);
  });

const escape = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string

const simpleSessionResponse = (question: MathInlineModel) =>
  new Promise<MathInlineSession>((resolve) => {
    const { responses, id } = question;
    const { answer } = responses && responses.length ? responses[0] : ({} as Partial<MathInlineResponse>);

    resolve({
      id,
      response: answer || '',
      completeAnswer: answer || '',
    });
  });

// use this for items like E672793
const removeTrailingEscape = (str: string) => (str.endsWith('\\') ? str.slice(0, -1) : str);

const advancedSessionResponse = (question: MathInlineModel) =>
  new Promise<MathInlineSession>((resolve) => {
    const { responses, id } = question;
    const { answer } = responses && responses.length ? responses[0] : ({} as Partial<MathInlineResponse>);

    if (!answer) {
      resolve({
        id,
        answers: {},
        completeAnswer: '',
      });

      return;
    }

    try {
      // `escape` throws on an absent expression; the catch below handles it.
      const e = question.expression as string;
      const RESPONSE_TOKEN = /\\{\\{\s*response\s*\\}\\}/g;

      const o = escape(e).split(RESPONSE_TOKEN);
      const to = o.map((t) => (t === '' ? t : t.replace(/\s+/g, () => '\\s*')));
      const tt = to.join('(.*)');

      const m = answer.match(new RegExp(tt));

      const count = o.length - 1;

      if (!m) {
        resolve({
          id,
          answers: {},
          completeAnswer: answer,
        });

        // eslint-disable-next-line no-console
        console.log(`can not find match: ${o} in ${answer}`);

        return;
      }

      m.shift();

      const answers: Record<string, MathInlineAnswer> = {};

      for (var i = 0; i < count; i++) {
        answers[`r${i + 1}`] = { value: removeTrailingEscape(m[i].trim()) };
      }

      resolve({
        id,
        answers,
        completeAnswer: answer,
      });
    } catch (e) {
      resolve({
        id,
        answers: {},
        completeAnswer: answer,
      });
      // eslint-disable-next-line no-console
      console.error((e as Error).toString());
    }
  });

export const createCorrectResponseSession = (
  question: MathInlineModel,
  env: PieEnvironment,
): Promise<MathInlineSession | null> => {
  if (env.mode === 'evaluate' || env.role !== 'instructor') {
    // eslint-disable-next-line no-console
    console.error('can not create correct response session if mode is evaluate or role is not instructor');

    return Promise.resolve(null);
  }

  if ((question.responseType || '').toLowerCase() === 'simple') {
    return simpleSessionResponse(question);
  } else {
    return advancedSessionResponse(question);
  }
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<MathInlineModel> = {},
  config: MathInlineConfiguration = {},
): MathInlineValidationErrors => {
  const { expression = '', responses, responseType } = model;
  const { maxResponseAreas } = config;
  const responsesErrors: Record<number, Record<string, string>> = {};
  const errors: MathInlineValidationErrors = {};

  (['teacherInstructions', 'prompt', 'rationale'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  (responses || []).forEach((response, index) => {
    const { answer } = response;
    const reversedAlternates = [...Object.entries(response.alternates || {})].reverse();
    const alternatesErrors: Record<string, string> = {};
    const responseError: { answer?: string } = {};

    if (answer === '') {
      responseError.answer = 'Content should not be empty.';
    }

    reversedAlternates.forEach(([key, value], index) => {
      if (value === '') {
        alternatesErrors[key] = 'Content should not be empty.';
      } else {
        const identicalAnswer =
          answer === value || reversedAlternates.slice(index + 1).some(([, val]) => val === value);

        if (identicalAnswer) {
          alternatesErrors[key] = 'Content should be unique.';
        }
      }
    });

    if (!isEmpty(responseError) || !isEmpty(alternatesErrors)) {
      responsesErrors[index] = { ...responseError, ...alternatesErrors };
    }
  });

  if (responseType === 'Advanced Multi') {
    const nbOfResponseAreas = (expression.match(/\{\{response\}\}/g) || []).length;

    // `undefined > n` is false, so an absent `maxResponseAreas` sets no upper bound.
    if (nbOfResponseAreas > (maxResponseAreas as number)) {
      errors.responseAreasError = `No more than ${maxResponseAreas} response areas should be defined.`;
    } else if (nbOfResponseAreas < 1) {
      errors.responseAreasError = 'There should be at least 1 response area defined.';
    }
  }

  if (!isEmpty(responsesErrors)) {
    errors.responsesErrors = responsesErrors;
  }

  return errors;
};
