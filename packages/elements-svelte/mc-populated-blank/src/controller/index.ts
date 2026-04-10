import defaults, { BLANK_TOKEN, DEFAULT_LAYOUT_LIMITS } from './defaults';

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

export const getCorrectness = (question: any, session: any) => {
  if (!session || !session.choiceId) {
    return 'unanswered';
  }
  const correct = question?.correctChoiceId || '';
  if (session.choiceId === correct) {
    return 'correct';
  }
  return 'incorrect';
};

export const getPartialScore = (_question: any, session: any) => {
  if (!session || isEmptyObject(session) || !session.choiceId) {
    return 0;
  }
  return 1;
};

export const isComplete = (question: any, session: any, audioComplete = false) => {
  if (!session || !session.choiceId) {
    return false;
  }
  const autoplayAudioEnabled = !!question?.autoplayAudioEnabled;
  const completeAudioEnabled = !!question?.completeAudioEnabled;
  const requiresAudioCompletion =
    autoplayAudioEnabled && completeAudioEnabled && !!question?.hasAudio;
  if (requiresAudioCompletion && !audioComplete) {
    return false;
  }
  return true;
};

export const outcome = (question: any, session: any, env: any) =>
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
    const correctness = getCorrectness(question, session);

    if (correctness === 'unanswered') {
      resolve({
        score: 0,
        empty: true,
        traceLog: ['Student did not select any answers. Score is 0.'],
      });
      return;
    }

    const score = correctness === 'correct' ? 1 : 0;
    const traceLog = [
      `Mode: ${env?.mode || 'unknown'}.`,
      `Student selected choice: ${session.choiceId}.`,
      `Correct choice: ${question?.correctChoiceId || 'none'}.`,
      `Final score: ${score}.`,
    ];
    resolve({ score, empty: false, traceLog });
  });

export const createDefaultModel = (model: any = {}) => ({
  ...defaults.model,
  ...model,
  layoutLimits: {
    ...DEFAULT_LAYOUT_LIMITS,
    ...(model?.layoutLimits || {}),
  },
});

export const normalize = (question: any = {}) => createDefaultModel(question);

export const normalizeSession = (s: any) => ({ ...s });

const shouldShuffleChoices = (question: any) => !!question?.shuffle;

const shouldLockChoices = (question: any, env: any) => {
  if (question?.lockChoiceOrder) return true;
  if (env?.['@pie-element']?.lockChoiceOrder) return true;
  return env?.role === 'instructor';
};

function shuffleArray<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const getStoredShuffle = (session: any): string[] =>
  Array.isArray(session?.data?.shuffledValues)
    ? session.data.shuffledValues
    : Array.isArray(session?.shuffledValues)
      ? session.shuffledValues
      : [];

const applyShuffledValues = (choices: any[], shuffledValues: string[], choiceKey: string) => {
  const orderedChoices = shuffledValues
    .map((value) => choices.find((choice) => choice?.[choiceKey] === value))
    .filter(Boolean);

  if (orderedChoices.length === choices.length) {
    return orderedChoices;
  }

  const orderedValues = new Set(orderedChoices.map((choice: any) => choice[choiceKey]));
  const leftovers = choices.filter((choice) => !orderedValues.has(choice?.[choiceKey]));
  return [...orderedChoices, ...leftovers];
};

const getOrderedChoices = async (question: any, session: any, env: any, updateSession?: any) => {
  const choices = Array.isArray(question?.choices) ? [...question.choices] : [];
  if (!choices.length || !shouldShuffleChoices(question)) {
    return choices;
  }

  if (shouldLockChoices(question, env || {})) {
    return choices;
  }

  const shuffledValues = getStoredShuffle(session);
  if (shuffledValues.length) {
    return applyShuffledValues(choices, shuffledValues, 'id');
  }

  const shuffledChoices = shuffleArray(choices);

  if (updateSession && typeof updateSession === 'function' && session?.id && session?.element) {
    const shuffledIds = shuffledChoices.map((choice) => choice?.id).filter(Boolean);
    if (shuffledIds.length) {
      await updateSession(session.id, session.element, { shuffledValues: shuffledIds });
    }
  }

  return shuffledChoices;
};

export const model = async (question: any, session: any, env: any, updateSession?: any) => {
  session = session || {};
  const safeEnv = env || {};
  const normalizedQuestion = normalize(question);
  const choices = await getOrderedChoices(normalizedQuestion, session, safeEnv, updateSession);

  const out: any = {
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
    uiText:
      normalizedQuestion.uiText && typeof normalizedQuestion.uiText === 'object'
        ? normalizedQuestion.uiText
        : {},
    sentenceHtml: normalizedQuestion.sentenceHtml || null,
    template: normalizedQuestion.template,
    choiceMode: normalizedQuestion.choiceMode,
    choices,
    hasAudio: normalizedQuestion.hasAudio,
    autoplayAudioEnabled: !!normalizedQuestion.autoplayAudioEnabled,
    completeAudioEnabled: !!normalizedQuestion.completeAudioEnabled,
    audioUrl: normalizedQuestion.hasAudio ? normalizedQuestion.audioUrl : null,
    audioTranscript: normalizedQuestion.hasAudio ? normalizedQuestion.audioTranscript : null,
    showVisibleTranscript: !!normalizedQuestion.showVisibleTranscript,
    useFeatureButtonAudio:
      typeof normalizedQuestion.useFeatureButtonAudio === 'boolean'
        ? normalizedQuestion.useFeatureButtonAudio
        : undefined,
    locale: normalizedQuestion.locale || '',
    disabled: safeEnv.mode !== 'gather',
    mode: safeEnv.mode,
  };

  if (safeEnv.mode === 'evaluate') {
    const correctness = getCorrectness(normalizedQuestion, session);
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

export const createCorrectResponseSession = (question: any, env: any) => {
  return new Promise((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      resolve({
        id: '1',
        element: 'mc-populated-blank',
        choiceId: question?.correctChoiceId || '',
      });
    } else {
      resolve(null);
    }
  });
};

export const validate = (model: any = {}, _config: any = {}) => {
  const errors: any = {};

  if (model.promptEnabled) {
    const p = model.prompt?.trim() || '';
    if (!p || p === '<p></p>') {
      errors.prompt = 'Prompt is required when prompt is enabled';
    }
  }

  const interactionMode = model.interactionMode || 'populate_blank';
  const template = model.template || '';
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

  const choices = Array.isArray(model.choices) ? model.choices : [];
  if (choices.length < 2) {
    errors.choices = 'At least two choices are required';
  }

  const mode = model.choiceMode || 'text';
  for (let i = 0; i < choices.length; i++) {
    const c = choices[i];
    if (!c?.id) {
      errors.choices = `Choice ${i + 1} is missing an id`;
      break;
    }
    if (mode === 'text') {
      const lbl = (c.labelHtml || '').trim();
      if (!lbl || lbl === '<p></p>') {
        errors.choices = `Choice ${i + 1} needs label text`;
        break;
      }
    } else {
      if (!c.imageUrl?.trim()) {
        errors.choices = `Choice ${i + 1} needs an image URL`;
        break;
      }
      if (!c.imageAlt?.trim()) {
        errors.choices = `Choice ${i + 1} needs image alt text`;
        break;
      }
    }
  }

  const correct = model.correctChoiceId;
  if (!correct || !choices.some((c: any) => c.id === correct)) {
    errors.correctChoiceId = 'Correct choice must match one of the choice ids';
  }

  if (model.hasAudio) {
    const hasAudioUrl = !!model.audioUrl?.trim();
    if (!hasAudioUrl) {
      errors.audioUrl = 'A playable audio URL is required when audio is enabled';
    }
  }

  const limits = model?.layoutLimits;
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
      'selectedImageMaxHeightRem',
      'choiceImageMaxHeightRem',
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
      'narrowHorizontalChoiceMaxWidthPx',
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
    ];
    for (const key of numericLimitKeys) {
      if (limits[key] === undefined || limits[key] === null || limits[key] === '') continue;
      const value = Number(limits[key]);
      if (!Number.isFinite(value) || value <= 0) {
        errors.layoutLimits = `${key} must be a positive number when provided`;
        break;
      }
    }
  }

  return errors;
};
