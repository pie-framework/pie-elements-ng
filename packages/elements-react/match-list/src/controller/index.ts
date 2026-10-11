import { isEmpty } from '@pie-element/shared-lodash';
import { getFeedbackForCorrectness, type Correctness, type Feedback } from '@pie-element/shared-feedback';
import { lockChoices, getShuffledChoices, partialScoring } from '@pie-element/shared-controller-utils';
import type { PieEnvironment, PieUpdateSession } from '@pie-element/shared-types';
import debug from 'debug';

const log = debug('@pie-element:match-list:controller');

import defaults from './defaults.js';
import type { MatchListAnswer, MatchListModel, MatchListPrompt, MatchListSession } from '../types.js';

type SessionValue = NonNullable<MatchListSession['value']>;

export type MatchListOutcome = { score?: number; empty?: boolean; completed?: boolean; logTrace: string[] };

export type ModelView = {
  config: MatchListModel & { prompts: MatchListPrompt[] | undefined; answers: MatchListAnswer[] | undefined };
  correctness: { score: string; correctness: Correctness | undefined };
  feedback: string | undefined;
  mode: PieEnvironment['mode'];
  rationale?: string | null;
  correctResponse: Record<string, string | number>;
};

const getResponseCorrectness = (
  model: MatchListModel,
  answers: SessionValue | undefined,
  env: PieEnvironment,
): Correctness => {
  const isPartialScoring = partialScoring.enabled(model, env);
  const prompts = model.prompts;

  if (!answers || Object.keys(answers).length === 0) {
    return 'unanswered';
  }

  const totalCorrectAnswers = getTotalCorrect(model);
  const correctAnswers = getCorrectSelected(prompts, answers);

  if (totalCorrectAnswers === correctAnswers) {
    return 'correct';
  } else if (correctAnswers === 0) {
    return 'incorrect';
  } else if (isPartialScoring) {
    return 'partial';
  }

  return 'incorrect';
};

const getCorrectness = (question: MatchListModel, env: PieEnvironment, answers: SessionValue | undefined) => {
  if (env.mode === 'evaluate') {
    return getResponseCorrectness(question, answers, env);
  }
};

const getCorrectSelected = (prompts: MatchListPrompt[] = [], answers: SessionValue) => {
  let correctAnswers = 0;

  prompts.forEach((p) => {
    if (p.relatedAnswer === answers[p.id]) {
      correctAnswers += 1;
    }
  });

  return correctAnswers;
};

const getTotalCorrect = (question: MatchListModel) => {
  return question && question.prompts ? question.prompts.length : 0;
};

const getPartialScore = (question: MatchListModel, answers: SessionValue) => {
  const count = getCorrectSelected(question && question.prompts, answers);
  const totalCorrect = getTotalCorrect(question);

  return parseFloat((count / totalCorrect).toFixed(2));
};

const getOutComeScore = (question: MatchListModel, env: PieEnvironment, answers: SessionValue | undefined) => {
  const correctness = getCorrectness(question, env, answers);

  return correctness === 'correct' ? 1 : correctness === 'partial' && true ? getPartialScore(question, answers!) : 0;
};

/**
 * Generates detailed trace log for match-list scoring evaluation
 */
export const getLogTrace = (
  question: MatchListModel,
  session: MatchListSession | undefined,
  env: PieEnvironment,
): string[] => {
  const traceLog: string[] = [];

  const prompts = question?.prompts || [];
  const answers = session?.value || {};

  if (!answers || Object.keys(answers).length === 0) {
    traceLog.push('Student did not provide any answer.');
    return traceLog;
  }

  const totalPrompts = prompts.length;
  traceLog.push(`Match-list item contains ${totalPrompts} question(s).`);

  let correctCount = 0;
  let answeredCount = 0;

  prompts.forEach((prompt) => {
    const expectedAnswer = prompt.relatedAnswer;
    const studentAnswer = answers[prompt.id];

    if (studentAnswer !== undefined) {
      answeredCount += 1;

      if (studentAnswer === expectedAnswer) {
        correctCount += 1;
        traceLog.push(`Question ${prompt.id}: correctly matched.`);
      } else {
        traceLog.push(
          `Question ${prompt.id}: incorrectly matched (selected '${studentAnswer}', expected '${expectedAnswer}').`,
        );
      }
    } else {
      traceLog.push(`Question ${prompt.id}: no answer provided.`);
    }
  });

  traceLog.push(
    `Student correctly matched ${correctCount} out of ${totalPrompts} question(s).`,
  );

  const partialScoringEnabled = partialScoring.enabled(question, env);

  if (partialScoringEnabled) {
    traceLog.push('Score calculated using partial scoring.');
    traceLog.push(
      'Score is the number of correct matches divided by the total number of questions.',
    );
  } else {
    traceLog.push('Score calculated using all-or-nothing scoring.');
    traceLog.push(
      'Student must match all questions correctly to receive full credit.',
    );
  }

  const rawScore = getOutComeScore(question, env, answers);
  const finalScore = partialScoringEnabled ? rawScore : rawScore === 1 ? 1 : 0;

  traceLog.push(`Final score: ${finalScore}.`);

  return traceLog;
};

export const outcome = (question: MatchListModel, session: MatchListSession | undefined, env: PieEnvironment) => {
  return new Promise<MatchListOutcome>((resolve) => {
    if (env.mode !== 'evaluate') {
      resolve({ score: undefined, completed: undefined, logTrace: [] });
    } else {
      if (!session || isEmpty(session)) {
        resolve({ score: 0, empty: true, logTrace: ['Student did not provide any answer.'] });
      } else {
        const out = {
          score: getOutComeScore(question, env, session!.value),
          empty: false,
          logTrace: getLogTrace(question, session, env),
        };

        resolve(out);
      }
    }
  });
};

export function createDefaultModel(model: Partial<MatchListModel> = {}) {
  return new Promise<Omit<MatchListModel, 'id' | 'element'> & Partial<MatchListModel>>((resolve) => {
    resolve({
      ...defaults,
      ...model,
    });
  });
}

export const normalize = (model: MatchListModel): MatchListModel => ({ ...defaults, ...model });

/**
 * @param updateSession - optional - a function that will set the properties passed into it on the session.
 */
export async function model(
  question: MatchListModel,
  session: MatchListSession | undefined,
  env: PieEnvironment,
  updateSession?: PieUpdateSession,
): Promise<ModelView> {
  question = normalize(question);
  const correctness = getCorrectness(question, env, session && session.value);
  const correctResponse: Record<string, string | number> = {};
  const score = `${getOutComeScore(question, env, session && session.value) * 100}%`;
  const correctInfo = {
    score,
    correctness,
  };

  const shuffledValues: NonNullable<MatchListSession['shuffledValues']> = {};
  let prompts = question.prompts;
  let answers = question.answers;

  const us = (part: 'prompts' | 'answers'): PieUpdateSession => (_id, _element, update) => {
    return new Promise((resolve) => {
      shuffledValues[part] = update.shuffledValues as (string | number)[];
      resolve();
    });
  };

  const lockChoiceOrder = lockChoices(question, session as { id?: string; element?: string } | undefined, env);

  if (!lockChoiceOrder) {
    prompts = await getShuffledChoices(
      prompts!,
      { shuffledValues: ((session && session.shuffledValues) || {}).prompts as string[] | undefined },
      us('prompts'),
      'id',
    );
    answers = await getShuffledChoices(
      answers!,
      { shuffledValues: ((session && session.shuffledValues) || {}).answers as string[] | undefined },
      us('answers'),
      'id',
    );
  }

  if (!isEmpty(shuffledValues)) {
    if (updateSession && typeof updateSession === 'function') {
      updateSession(session!.id as string, session!.element as string, {
        shuffledValues,
      }).catch((e: unknown) => {
        // eslint-disable-next-line no-console
        console.error('update session failed', e);
      });
    }
  }

  if (question && prompts) {
    prompts.forEach((prompt) => {
      correctResponse[prompt.id] = prompt.relatedAnswer;
    });
  }

  const feedback =
    env.mode === 'evaluate'
      ? await getFeedbackForCorrectness(correctInfo.correctness!, question.feedback as Partial<Feedback>)
      : undefined;

  const base: Omit<ModelView, 'correctResponse'> = {
    config: {
      ...question,
      prompts,
      answers,
    },
    correctness: correctInfo,
    feedback,
    mode: env.mode,
  };

  if (env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate')) {
    base.rationale = question.rationale;
  } else {
    base.rationale = null;
  }

  const out = Object.assign(base, {
    correctResponse,
  });

  log('out: ', out);
  return out;
}

export const createCorrectResponseSession = (question: MatchListModel, env: PieEnvironment) => {
  return new Promise<MatchListSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { prompts, answers } = question;
      const value: SessionValue = {};

      prompts!.forEach((p) => {
        if (answers!.filter((a) => a.id === p.relatedAnswer).length) {
          value[p.id] = p.relatedAnswer;
        }
      });

      resolve({
        value,
        id: '1',
      });
    } else {
      resolve(null);
    }
  });
};
