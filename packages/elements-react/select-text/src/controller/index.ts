import debug from 'debug';
import { isEmpty } from '@pie-element/shared-lodash';
import { getFeedbackForCorrectness, type Correctness, type Feedback } from '@pie-element/shared-feedback';
import { partialScoring } from '@pie-element/shared-controller-utils';
import type { ExtraCSSRules, PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import type { SelectTextConfiguration, SelectTextModel, SelectTextSession, TextToken } from '../types.js';

const log = debug('@pie-element:select-text:controller');

type ResponseCorrectness = 'unknown' | 'correct' | 'partially-correct' | 'incorrect';

/** A token as the delivery view receives it; `correct` and `isMissing` are set in evaluate mode only. */
type TokenView = Omit<TextToken, 'correct'> & { correct: boolean | undefined; isMissing: boolean | undefined };

/** The model the delivery view receives. */
type ModelView = {
  tokens: TokenView[];
  highlightChoices?: boolean;
  prompt: string | null | undefined;
  text: string;
  disabled: boolean;
  maxSelections?: number;
  correctness: ResponseCorrectness | undefined;
  env: PieEnvironment;
  feedback: string | undefined;
  incorrect: boolean | undefined;
  language?: string;
  extraCSSRules?: ExtraCSSRules;
  rationale?: string | null;
  teacherInstructions?: string | null;
};

type Outcome = { score: number | undefined; empty?: boolean; completed?: undefined; logTrace: string[] };

/** Errors `validate()` reports, keyed by field. */
export type SelectTextValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
  rationale?: string;
  tokensError?: string;
  selectionsError?: string;
};

/** The session `model()` works on; without a session it starts from one carrying `selectedToken`. */
type ModelSession = SelectTextSession & { selectedToken?: TextToken[] };

const equalTokens = (token1: Partial<TextToken> = {}, token2: Partial<TextToken> = {}) =>
  (token1?.start === token2?.start && token1?.end === token2?.end) ||
  // this case is used for the cases when the token's start & end were recalculated
  (token1?.start === token2?.oldStart && token1?.end === token2?.oldEnd);

const normalizeTokens = (tokens: TextToken[] = [], selectedTokens: TextToken[] = [], evaluateMode = false): TokenView[] =>
  (tokens || []).map((token) => {
    const isCorrect = !!token.correct;
    // search if correct token is missing from session
    const isMissing = isCorrect && !(selectedTokens || []).find((selectedToken) => equalTokens(token, selectedToken));

    return {
      ...token,
      correct: evaluateMode ? isCorrect : undefined,
      isMissing: evaluateMode ? isMissing : undefined,
    };
  });

export const getCorrectness = (tokens: TextToken[], selected: TextToken[]): ResponseCorrectness => {
  const correct = tokens.filter((t) => t.correct === true);

  if (correct.length === 0) {
    return 'unknown';
  }

  const correctSelected = getCorrectSelected(tokens, selected);

  if (correctSelected.length === selected.length) {
    if (correctSelected.length === correct.length) {
      return 'correct';
    } else if (correctSelected.length > 0) {
      return 'partially-correct';
    }
  }

  if (correctSelected.length > 0) {
    return 'partially-correct';
  }

  return 'incorrect';
};

const getCorrectSelected = (tokens: TextToken[], selected: TextToken[] | undefined) =>
  (selected || []).filter((s) => tokens.findIndex((token) => token.correct && equalTokens(token, s)) !== -1);

export const getPartialScore = (
  question: SelectTextModel,
  session: SelectTextSession | undefined,
  totalCorrect: TextToken[],
) => {
  if (!session || isEmpty(session)) {
    return 0;
  }

  const correctCount = getCorrectSelected(question.tokens, session.selectedTokens).length;
  const correctTokens = (question.tokens || []).filter((t) => t.correct === true);
  const extraSelected = session.selectedTokens ? session.selectedTokens.length > correctTokens.length : 0;
  const incorrectCount = extraSelected && session.selectedTokens ? session.selectedTokens.length - correctCount : 0;
  const count = correctCount - incorrectCount;
  const positiveCount = count < 0 ? 0 : count;

  return totalCorrect.length ? parseFloat((positiveCount / totalCorrect.length).toFixed(2)) : 0;
};

/**
 * Generates detailed trace log for select-text scoring evaluation
 * @param {Object} question - the question model
 * @param {Object} session - the student session
 * @param {Object} env - the environment
 * @returns {Array<string>} traceLog
 */
export const getLogTrace = (question: SelectTextModel, session: SelectTextSession | undefined, env: PieEnvironment) => {
  const traceLog: string[] = [];

  const selectedTokens = session?.selectedTokens || [];
  const tokens = question?.tokens || [];

  if (selectedTokens.length === 0) {
    traceLog.push('Student did not select any token.');
    return traceLog;
  }

  traceLog.push(`Student selected ${selectedTokens.length} token(s).`);

  let totalCorrectTokens = 0;
  let correctSelected = 0;
  let missingCount = 0;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.correct) {
      totalCorrectTokens++;
      const matched = selectedTokens.some((s) => equalTokens(token, s));
      if (matched) {
        correctSelected++;
      } else {
        missingCount++;
      }
    }
  }

  const incorrectSelected = selectedTokens.length - correctSelected;

  if (correctSelected > 0) {
    traceLog.push(`${correctSelected} correct token(s) selected.`);
  }

  if (incorrectSelected > 0) {
    traceLog.push(`${incorrectSelected} incorrect token(s) selected.`);
  }

  if (missingCount > 0) {
    traceLog.push(`${missingCount} required correct token(s) were not selected.`);
  }

  const partialScoringEnabled = partialScoring.enabled(question, env, true);

  if (partialScoringEnabled) {
    traceLog.push('Score calculated using partial scoring.');
    traceLog.push(
      'Score is based on the number of correct minus incorrect selections, divided by the total number of correct tokens.',
    );

    if (incorrectSelected > 0 && selectedTokens.length > totalCorrectTokens) {
      traceLog.push(
        'Extra selected tokens beyond the correct set reduce the score.',
      );
    }
  } else {
    traceLog.push('Score calculated using all-or-nothing scoring.');
    traceLog.push(
      'Student must select all correct tokens and no incorrect tokens to receive full credit.',
    );
  }

  const rawScore = getPartialScore(question, session, tokens.filter((t) => t.correct));
  const finalScore = partialScoringEnabled ? rawScore : rawScore === 1 ? 1 : 0;

  traceLog.push(`Final score: ${finalScore}.`);

  return traceLog;
};

export const outcome = (question: SelectTextModel, session: SelectTextSession | undefined, env: PieEnvironment) =>
  new Promise<Outcome>((resolve) => {
    if (!session || isEmpty(session)) {
      resolve({ score: 0, empty: true, logTrace: ['Student did not select any token.'] });
    }

    session = normalizeSession(session);

    if (env.mode !== 'evaluate') {
      resolve({ score: undefined, completed: undefined, logTrace: [] });
    } else {
      const enabled = partialScoring.enabled(question, env, true);
      const totalCorrect = question.tokens.filter((t) => t.correct);
      const score = getPartialScore(question, session, totalCorrect);
      resolve({
        score: enabled ? score : score === 1 ? 1 : 0,
        logTrace: getLogTrace(question, session, env),
      });
    }
  });

export function createDefaultModel(model: Partial<SelectTextModel> = {}) {
  return new Promise<Partial<SelectTextModel>>((resolve) => {
    resolve({ ...defaults, ...model });
  });
}

export const normalizeSession = (session: SelectTextSession | undefined) => ({
  selectedTokens: [] as TextToken[],
  ...session,
});

export const normalize = (question: SelectTextModel) => ({ ...defaults, ...question });

export const model = (question: SelectTextModel, session: ModelSession | null | undefined, env: PieEnvironment) => {
  session = session || { selectedToken: [] };
  session.selectedTokens = session.selectedTokens || [];
  const normalizedQuestion = normalize(question);

  return new Promise<ModelView>((resolve) => {
    log('[model]', 'normalizedQuestion: ', normalizedQuestion);
    log('[model]', 'session: ', session);

    const tokens = normalizeTokens(normalizedQuestion.tokens, session.selectedTokens, env.mode === 'evaluate');
    log('[model] tokens:', tokens);

    const correctness =
      env.mode === 'evaluate' ? getCorrectness(normalizedQuestion.tokens, session.selectedTokens as TextToken[]) : undefined;

    const fb =
      env.mode === 'evaluate' && normalizedQuestion.feedbackEnabled
        ? getFeedbackForCorrectness(correctness as Correctness, normalizedQuestion.feedback as Partial<Feedback>)
        : Promise.resolve(undefined);

    fb.then((feedback) => {
      const out: ModelView = {
        tokens,
        highlightChoices: normalizedQuestion.highlightChoices,
        prompt: normalizedQuestion.promptEnabled ? normalizedQuestion.prompt : null,
        text: normalizedQuestion.text,
        disabled: env.mode !== 'gather',
        maxSelections: normalizedQuestion.maxSelections,
        correctness,
        env,
        feedback,
        incorrect: env.mode === 'evaluate' ? correctness !== 'correct' : undefined,
        language: normalizedQuestion.language,
        extraCSSRules: normalizedQuestion.extraCSSRules,
      };

      if (env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate')) {
        out.rationale = normalizedQuestion.rationaleEnabled ? normalizedQuestion.rationale : null;
        out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
          ? normalizedQuestion.teacherInstructions
          : null;
      } else {
        out.rationale = null;
        out.teacherInstructions = null;
      }

      resolve(out);
    });
  });
};

export const createCorrectResponseSession = (question: SelectTextModel, env: PieEnvironment) => {
  return new Promise<SelectTextSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { tokens } = question;
      const selectedTokens = tokens.filter((t) => t.correct);

      resolve({
        id: '1',
        selectedTokens,
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<SelectTextModel> = {},
  config: SelectTextConfiguration = {},
): SelectTextValidationErrors => {
  const { tokens } = model;
  const { minTokens = 2, maxTokens, maxSelections } = config;
  const errors: SelectTextValidationErrors = {};
  const nbOfTokens = (tokens || []).length;

  (['teacherInstructions', 'prompt', 'rationale'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  const nbOfSelections = (tokens || []).reduce((acc, token) => (token.correct ? acc + 1 : acc), 0);

  if (nbOfTokens < minTokens) {
    errors.tokensError = `There should be at least ${minTokens} tokens defined.`;
  } else if (maxTokens !== undefined && nbOfTokens > maxTokens) {
    errors.tokensError = `No more than ${maxTokens} tokens should be defined.`;
  }

  if (nbOfSelections < 1) {
    errors.selectionsError = 'There should be at least 1 token selected.';
  } else if (maxSelections !== undefined && nbOfSelections > maxSelections) {
    errors.selectionsError = `No more than ${maxSelections} tokens should be selected.`;
  }

  return errors;
};
