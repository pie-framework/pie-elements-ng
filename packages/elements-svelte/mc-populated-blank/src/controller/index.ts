import { getShuffledChoices, lockChoices } from '@pie-element/shared-controller-utils';
import type { PieUpdateSession } from '@pie-element/shared-types';
import authorDefaults from '../author/defaults.js';
import defaults, { BLANK_TOKEN, DEFAULT_LAYOUT_LIMITS } from './defaults.js';
import type {
  McpbChoice,
  McpbQuestion,
  McpbSession,
  McpbEnv,
  McpbCorrectness,
} from '../shared/types.js';
import { selectedChoiceId } from '../shared/session.js';

const isEmptyObject = (value: unknown): boolean =>
  !!value &&
  typeof value === 'object' &&
  !Array.isArray(value) &&
  Object.keys(value as Record<string, unknown>).length === 0;

export function countBlankTokens(template: string): number {
  if (!template) return 0;
  const re = /\{\{blank\}\}/g;
  return (template.match(re) || []).length;
}

export const getCorrectness = (question: McpbQuestion, session: McpbSession): McpbCorrectness => {
  const picked = selectedChoiceId(session);
  if (!picked) {
    return 'unanswered';
  }
  const correct = question?.correctChoiceId || '';
  if (picked === correct) {
    return 'correct';
  }
  return 'incorrect';
};

/** One blank, one key: an answered session scores 1 only when it picked the key. */
export const getPartialScore = (question: McpbQuestion, session: McpbSession) =>
  getCorrectness(question, session) === 'correct' ? 1 : 0;

export const outcome = (question: McpbQuestion, session: McpbSession, env: McpbEnv) =>
  new Promise((resolve) => {
    if (!session || isEmptyObject(session)) {
      resolve({
        score: 0,
        empty: true,
        traceLog: ['Student did not select any answers. Score is 0.'],
      });
      return;
    }

    session = normalizeSession(session);
    const normalizedQuestion = normalize(question);
    const correctness = getCorrectness(normalizedQuestion, session);

    if (correctness === 'unanswered') {
      resolve({
        score: 0,
        empty: true,
        traceLog: ['Student did not select any answers. Score is 0.'],
      });
      return;
    }

    const score = getPartialScore(normalizedQuestion, session);
    const traceLog = [
      `Mode: ${env?.mode || 'unknown'}.`,
      `Student selected choice: ${selectedChoiceId(session)}.`,
      `Correct choice: ${normalizedQuestion.correctChoiceId || 'none'}.`,
      `Final score: ${score}.`,
    ];
    resolve({ score, empty: false, traceLog });
  });

const withDefaults = (base: McpbQuestion, model: McpbQuestion = {}) => ({
  ...base,
  ...model,
  layoutLimits: {
    ...DEFAULT_LAYOUT_LIMITS,
    ...(model?.layoutLimits || {}),
  },
});

/** The authoring starting point: a question that passes `validate()` as it stands. */
export const createDefaultModel = (model: McpbQuestion = {}) =>
  withDefaults(authorDefaults.model, model);

/**
 * What `model()` and `outcome()` read: the item's own fields, with neutral
 * values for the rest. Starter content here would reach a learner as the
 * item's prompt or choices.
 */
export const normalize = (question: McpbQuestion = {}) => {
  const { shuffle, ...rest } = question || {};
  return {
    ...withDefaults(defaults.model, rest),
    // `lockChoiceOrder` alone decides the order, as in multiple-choice. Older items
    // spell an unlocked order `shuffle: true`, which counts only when it is unset.
    lockChoiceOrder:
      typeof rest.lockChoiceOrder === 'boolean' ? rest.lockChoiceOrder : shuffle !== true,
  };
};

export const normalizeSession = (s: McpbSession): McpbSession => ({ ...s });

/**
 * The fields delivery renders. An imported choice can carry more, such as a
 * correctness flag or feedback, which must not reach a learner's browser.
 */
const toDeliveryChoice = ({ id, labelHtml, imageUrl, imageAlt }: McpbChoice): McpbChoice => ({
  id,
  ...(labelHtml !== undefined ? { labelHtml } : {}),
  ...(imageUrl !== undefined ? { imageUrl } : {}),
  ...(imageAlt !== undefined ? { imageAlt } : {}),
});

export const model = async (
  question: McpbQuestion,
  session: McpbSession | null,
  env: McpbEnv | null,
  updateSession?: PieUpdateSession
) => {
  const safeSession: McpbSession = session || {};
  const safeEnv: McpbEnv = env || {};
  const normalizedQuestion = normalize(question);
  let orderedChoices = Array.isArray(normalizedQuestion.choices)
    ? [...normalizedQuestion.choices]
    : [];
  if (orderedChoices.length && !lockChoices(normalizedQuestion, safeSession, safeEnv)) {
    orderedChoices =
      (await getShuffledChoices(orderedChoices, safeSession, updateSession, 'id')) ??
      orderedChoices;
  }
  const choices = orderedChoices
    .filter((c): c is McpbChoice => !!c && typeof c === 'object')
    .map(toDeliveryChoice);

  const out: Record<string, unknown> = {
    prompt: normalizedQuestion.promptEnabled ? normalizedQuestion.prompt : null,
    interactionMode: normalizedQuestion.interactionMode || 'populate_blank',
    layoutProfile: normalizedQuestion.layoutProfile || '',
    choiceLayout: normalizedQuestion.choiceLayout || '',
    layoutProfilePresets:
      normalizedQuestion.layoutProfilePresets &&
      typeof normalizedQuestion.layoutProfilePresets === 'object'
        ? normalizedQuestion.layoutProfilePresets
        : {},
    layoutLimits: normalizedQuestion.layoutLimits || { ...DEFAULT_LAYOUT_LIMITS },
    audioButtonSkin:
      normalizedQuestion.audioButtonSkin && typeof normalizedQuestion.audioButtonSkin === 'object'
        ? normalizedQuestion.audioButtonSkin
        : null,
    audioButtonSkinsByLocale:
      normalizedQuestion.audioButtonSkinsByLocale &&
      typeof normalizedQuestion.audioButtonSkinsByLocale === 'object'
        ? normalizedQuestion.audioButtonSkinsByLocale
        : {},
    sentenceHtml: normalizedQuestion.sentenceHtml || null,
    template: normalizedQuestion.template,
    choiceMode: normalizedQuestion.choiceMode,
    choices,
    choiceGroupLabel: normalizedQuestion.choiceGroupLabel || '',
    hasAudio: normalizedQuestion.hasAudio,
    autoplayAudioEnabled: !!normalizedQuestion.autoplayAudioEnabled,
    completeAudioEnabled: !!normalizedQuestion.completeAudioEnabled,
    audioUrl: normalizedQuestion.hasAudio ? normalizedQuestion.audioUrl : null,
    audioTranscript: normalizedQuestion.hasAudio ? normalizedQuestion.audioTranscript : null,
    customType: normalizedQuestion.customType || '',
    useFeatureButtonAudio:
      typeof normalizedQuestion.useFeatureButtonAudio === 'boolean'
        ? normalizedQuestion.useFeatureButtonAudio
        : undefined,
    locale: normalizedQuestion.locale || '',
    language: normalizedQuestion.language || normalizedQuestion.locale || undefined,
    disabled: safeEnv.mode !== 'gather',
    mode: safeEnv.mode,
  };

  if (safeEnv.mode === 'evaluate') {
    const correctness = getCorrectness(normalizedQuestion, safeSession);
    out.correctness = correctness;
    out.responseCorrect = correctness === 'correct';
    out.correctChoiceId = normalizedQuestion.correctChoiceId;
  }

  if (safeEnv.role === 'instructor' && (safeEnv.mode === 'view' || safeEnv.mode === 'evaluate')) {
    out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
      ? normalizedQuestion.teacherInstructions
      : null;
  } else {
    out.teacherInstructions = null;
  }

  return out;
};

export const createCorrectResponseSession = (question: McpbQuestion, env: McpbEnv) => {
  return new Promise((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      // The player sets `id` and `element` on the entry from the item config.
      resolve({
        id: '1',
        value: question?.correctChoiceId ? [question.correctChoiceId] : [],
      });
    } else {
      resolve(null);
    }
  });
};

/** Markup with its tags removed, keeping media an author can answer from. */
const getContent = (html?: string) =>
  (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '').trim();

type ValidateConfig = {
  minAnswerChoices?: number;
  maxAnswerChoices?: number;
  prompt?: { required?: boolean };
  teacherInstructions?: { required?: boolean };
};

/**
 * Authoring errors in multiple-choice's shape: a message per field, and under
 * `choices` a message per choice keyed by its id.
 */
export const validate = (question: McpbQuestion = {}, config: ValidateConfig = {}) => {
  const errors: Record<string, string | Record<string, string>> = {};
  const { minAnswerChoices = 2, maxAnswerChoices } = config;

  if ((question.promptEnabled || config.prompt?.required) && !getContent(question.prompt)) {
    errors.prompt = 'This field is required.';
  }

  if (config.teacherInstructions?.required && !getContent(question.teacherInstructions)) {
    errors.teacherInstructions = 'This field is required.';
  }

  const interactionMode = question.interactionMode || 'populate_blank';
  const template = question.template || '';
  const n = countBlankTokens(template);
  if (interactionMode === 'audio_mc_only') {
    if (n > 0) {
      errors.template = `Template cannot contain ${BLANK_TOKEN} in audio-only mode`;
    }
  } else if (interactionMode === 'populate_blank') {
    if (n === 0) {
      errors.template = `Template must contain exactly one ${BLANK_TOKEN} placeholder`;
    } else if (n > 1) {
      errors.template = `Template must contain only one ${BLANK_TOKEN} placeholder`;
    }
  } else {
    errors.interactionMode = 'Unknown interaction mode';
  }

  const choices = Array.isArray(question.choices) ? question.choices : [];
  if (choices.length < minAnswerChoices) {
    errors.answerChoices = `There should be at least ${minAnswerChoices} choices defined.`;
  } else if (maxAnswerChoices != null && choices.length > maxAnswerChoices) {
    errors.answerChoices = `No more than ${maxAnswerChoices} choices should be defined.`;
  }

  const mode = question.choiceMode || 'text';
  const choicesErrors: Record<string, string> = {};
  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();
  choices.forEach((c, i) => {
    const key = c?.id || String(i);
    if (!c?.id) {
      choicesErrors[key] = 'Choice needs an id.';
      return;
    }
    // The session stores the picked id, so two choices sharing one cannot be told apart.
    if (seenIds.has(c.id)) {
      choicesErrors[key] = 'Choice id should be unique.';
      return;
    }
    seenIds.add(c.id);
    if (mode === 'text') {
      const label = getContent(c.labelHtml);
      if (!label) {
        choicesErrors[key] = 'Content should not be empty.';
      } else if (seenLabels.has(label)) {
        choicesErrors[key] = 'Content should be unique.';
      }
      seenLabels.add(label);
    } else if (!c.imageUrl?.trim()) {
      choicesErrors[key] = 'An image is required.';
    } else if (!c.imageAlt?.trim()) {
      choicesErrors[key] = 'Image alt text is required.';
    }
  });
  if (Object.keys(choicesErrors).length) {
    errors.choices = choicesErrors;
  }

  const correct = question.correctChoiceId;
  if (!correct) {
    errors.correctResponse = 'No correct response defined.';
  } else if (!choices.some((c) => c?.id === correct)) {
    errors.correctResponse = 'The correct response must be one of the choices.';
  }

  if (question.hasAudio) {
    const hasAudioUrl = !!question.audioUrl?.trim();
    if (!hasAudioUrl) {
      errors.audioUrl = 'A playable audio URL is required when audio is enabled';
    }
  }

  const limits = question?.layoutLimits;
  if (limits && typeof limits === 'object') {
    const numericLimitKeys = [
      'blankStandaloneWidthRem',
      'blankWideWidthRem',
      'blankUnderlineWidthPx',
      'blankUnderlineWideWidthPx',
      'horizontalChoiceWidthPx',
      'horizontalChoiceWidthVw',
      'horizontalChoiceTileMinHeightRem',
      'horizontalChoiceContentMinHeightRem',
      'choiceImageMaxHeightRem',
      'choiceImageMaxWidthRem',
      'listenButtonSizePx',
      'stimulusMinColumnPx',
      'textMinColumnPx',
      'legendMaxChars',
      'choiceGroupGapRem',
      'choiceRowGapRem',
      'toggleButtonGapRem',
      'horizontalChoiceRadioTopMarginRem',
      'audioBlankTemplateMarginTopRem',
      'audioBlankTemplateMarginBottomRem',
      'audioInstructionsMaxWidthPx',
      'stimulusGridColumnGapRem',
      'stimulusGridRowGapRem',
      'stimulusSentenceMarginTopRem',
      'stimulusChoicesMarginTopRem',
      'tokenGridColumnGapRem',
      'tokenGridRowGapRem',
      'tokenTemplateMarginTopRem',
      'tokenInlineTokenGapRem',
      'tokenChoicesMarginTopRem',
      'inlineGridColumnGapRem',
      'inlineGridRowGapRem',
      'inlineTemplateMarginTopRem',
      'inlineChoicesMarginTopRem',
    ] as const;
    for (const key of numericLimitKeys) {
      if (limits[key] === undefined || limits[key] === null) continue;
      const value = Number(limits[key]);
      if (!Number.isFinite(value) || value <= 0) {
        errors.layoutLimits = `${key} must be a positive number when provided`;
        break;
      }
    }
  }

  return errors;
};
