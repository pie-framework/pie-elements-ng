import { contentLanguage, normalizeResponse } from '@pie-element/shared-controller-utils';
import defaults from './defaults.js';
import { toPlainText } from './plain-text.js';
import type { SimpleClozeConfiguration, SimpleClozeModel, SimpleClozeSession } from '../types.js';

export type SimpleClozeEnv = {
  mode?: string;
  role?: string;
  [key: string]: unknown;
};

export type SimpleClozeCorrectness = 'correct' | 'incorrect' | 'unanswered';

export type SimpleClozeOutcome = {
  score: number;
  empty: boolean;
  traceLog: string[];
};

/**
 * Both sides compare as plain text through the shared response normalizer,
 * case folded in the content language: an answer key authored as HTML matches
 * the text a learner types, in any digit system.
 */
const comparable = (value: unknown, language?: string): string =>
  normalizeResponse(toPlainText(value), { language, ignoreCase: true });

// Strips tags except img, iframe and source (media counts as content), as
// multiple-choice's `getContent` does.
const hasContent = (html: unknown): boolean =>
  typeof html === 'string' &&
  html
    .replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;

/**
 * A response with no text is unanswered; an answer key with no text matches
 * nothing, so a blank key never scores.
 */
export const getCorrectness = (
  question: Partial<SimpleClozeModel> | null | undefined,
  session: SimpleClozeSession | null | undefined,
  env?: SimpleClozeEnv | null
): SimpleClozeCorrectness => {
  const language = contentLanguage(question, env);
  const response = comparable(session?.value, language);
  if (!response) {
    return 'unanswered';
  }

  const key = comparable(question?.correctAnswer, language);
  if (key && response === key) {
    return 'correct';
  }

  return 'incorrect';
};

/** Single response, all-or-nothing: 1 when it matches the answer key, else 0. */
export const getPartialScore = (
  question: Partial<SimpleClozeModel> | null | undefined,
  session: SimpleClozeSession | null | undefined,
  env?: SimpleClozeEnv | null
): number => (getCorrectness(question, session, env) === 'correct' ? 1 : 0);

const getTraceLog = (
  question: Partial<SimpleClozeModel> | null | undefined,
  correctness: SimpleClozeCorrectness,
  score: number
): string[] => {
  const traceLog = [
    'Response is compared with the answer key as plain text, ignoring case, extra spaces and the digit system.',
  ];
  if (!comparable(question?.correctAnswer)) {
    traceLog.push('No correct answer is defined, so no response can score.');
  } else {
    traceLog.push(
      correctness === 'correct'
        ? 'Response matches the answer key.'
        : 'Response does not match the answer key.'
    );
  }
  traceLog.push(`Final score: ${score}.`);
  return traceLog;
};

export const outcome = (
  question: Partial<SimpleClozeModel> | null | undefined,
  session: SimpleClozeSession | null | undefined,
  env: SimpleClozeEnv = {}
): Promise<SimpleClozeOutcome> =>
  new Promise((resolve) => {
    const correctness = getCorrectness(question, session, env);

    if (correctness === 'unanswered') {
      resolve({
        score: 0,
        empty: true,
        traceLog: ['Student did not enter a response. Score is 0.'],
      });
      return;
    }

    const score = correctness === 'correct' ? 1 : 0;
    resolve({ score, empty: false, traceLog: getTraceLog(question, correctness, score) });
  });

export const createDefaultModel = (
  model: Partial<SimpleClozeModel> = {}
): Partial<SimpleClozeModel> => ({
  ...defaults.model,
  ...model,
});

export const normalizeSession = (s: SimpleClozeSession | null | undefined): SimpleClozeSession => ({
  ...s,
});

export const model = (
  question: Partial<SimpleClozeModel> | null | undefined,
  session: SimpleClozeSession | null | undefined,
  env: SimpleClozeEnv | null | undefined
): Promise<Record<string, unknown>> => {
  return new Promise((resolve) => {
    const safeSession = session || {};
    const safeEnv = env || {};
    const normalizedQuestion = createDefaultModel(question || {});

    const out: Record<string, unknown> = {
      prompt: normalizedQuestion.promptEnabled ? normalizedQuestion.prompt : null,
      disabled: safeEnv.mode !== 'gather',
      mode: safeEnv.mode,
      role: safeEnv.role,
      language: normalizedQuestion.language,
    };

    if (safeEnv.mode === 'evaluate') {
      out.correctness = getCorrectness(normalizedQuestion, safeSession, safeEnv);
      // The key is shown in the text input, so it goes out as plain text.
      out.correctAnswer = toPlainText(normalizedQuestion.correctAnswer);
    }

    if (safeEnv.role === 'instructor' && (safeEnv.mode === 'view' || safeEnv.mode === 'evaluate')) {
      out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
        ? normalizedQuestion.teacherInstructions
        : null;
    } else {
      out.teacherInstructions = null;
    }

    resolve(out);
  });
};

export const createCorrectResponseSession = (
  question: Partial<SimpleClozeModel> | null | undefined,
  env: SimpleClozeEnv | null | undefined
): Promise<SimpleClozeSession | null> => {
  return new Promise((resolve) => {
    if (env?.mode !== 'evaluate' && env?.role === 'instructor') {
      // The player sets `id` and `element` on the entry from the item config.
      resolve({ id: '1', value: toPlainText(question?.correctAnswer) });
    } else {
      resolve(null);
    }
  });
};

export const validate = (
  model: Partial<SimpleClozeModel> = {},
  config: SimpleClozeConfiguration = {}
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (config?.prompt?.required && !hasContent(model?.prompt)) {
    errors.prompt = 'This field is required.';
  }

  if (!comparable(model?.correctAnswer)) {
    errors.correctAnswer = 'No correct answer defined.';
  }

  return errors;
};
