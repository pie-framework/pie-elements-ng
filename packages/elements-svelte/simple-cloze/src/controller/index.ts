import defaults from './defaults';

export type SimpleClozeQuestion = {
  id?: string;
  element?: string;
  prompt?: string;
  promptEnabled?: boolean;
  correctAnswer?: string;
  teacherInstructions?: string;
  teacherInstructionsEnabled?: boolean;
  /** The learner-facing strings' language, as `@pie-lib/translator` reads it (`en_US`, `es_ES`, …). */
  language?: string;
  [key: string]: unknown;
};

export type SimpleClozeSession = {
  id?: string;
  element?: string;
  response?: unknown;
  [key: string]: unknown;
};

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

type FieldConfig = { required?: boolean };
export type SimpleClozeValidationConfig = {
  prompt?: FieldConfig;
  [key: string]: unknown;
};

/** Answers compare case-insensitively, ignoring surrounding whitespace. */
const comparable = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

// Strips tags except img, iframe and source (media counts as content), as
// multiple-choice's `getContent` does.
const hasContent = (html: unknown): boolean =>
  typeof html === 'string' &&
  html
    .replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;

/**
 * A response that is empty after trimming is unanswered; an answer key that is
 * empty after trimming matches nothing, so a blank key never scores.
 */
export const getCorrectness = (
  question: SimpleClozeQuestion | null | undefined,
  session: SimpleClozeSession | null | undefined
): SimpleClozeCorrectness => {
  const response = comparable(session?.response);
  if (!response) {
    return 'unanswered';
  }

  const key = comparable(question?.correctAnswer);
  if (key && response === key) {
    return 'correct';
  }

  return 'incorrect';
};

/** Single response, all-or-nothing: 1 when it matches the answer key, else 0. */
export const getPartialScore = (
  question: SimpleClozeQuestion | null | undefined,
  session: SimpleClozeSession | null | undefined
): number => (getCorrectness(question, session) === 'correct' ? 1 : 0);

const getTraceLog = (
  question: SimpleClozeQuestion | null | undefined,
  correctness: SimpleClozeCorrectness,
  score: number
): string[] => {
  const traceLog = ['Response is compared with the answer key, ignoring case and outer spaces.'];
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
  question: SimpleClozeQuestion | null | undefined,
  session: SimpleClozeSession | null | undefined,
  _env: SimpleClozeEnv = {}
): Promise<SimpleClozeOutcome> =>
  new Promise((resolve) => {
    const correctness = getCorrectness(question, session);

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

export const createDefaultModel = (model: SimpleClozeQuestion = {}): SimpleClozeQuestion => ({
  ...defaults.model,
  ...model,
});

export const normalizeSession = (s: SimpleClozeSession | null | undefined): SimpleClozeSession => ({
  ...s,
});

export const model = (
  question: SimpleClozeQuestion | null | undefined,
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
      view: safeEnv.mode === 'view',
      mode: safeEnv.mode,
      role: safeEnv.role,
      language: normalizedQuestion.language,
    };

    if (safeEnv.mode === 'evaluate') {
      out.correctness = getCorrectness(normalizedQuestion, safeSession);
      out.correctAnswer = normalizedQuestion.correctAnswer;
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
  question: SimpleClozeQuestion | null | undefined,
  env: SimpleClozeEnv | null | undefined
): Promise<SimpleClozeSession | null> => {
  return new Promise((resolve) => {
    if (env?.mode !== 'evaluate' && env?.role === 'instructor') {
      // The player sets `id` and `element` on the entry from the item config.
      resolve({ id: '1', response: question?.correctAnswer || '' });
    } else {
      resolve(null);
    }
  });
};

export const validate = (
  model: SimpleClozeQuestion = {},
  config: SimpleClozeValidationConfig = {}
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
