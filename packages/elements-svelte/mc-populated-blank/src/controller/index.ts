import { isEmpty } from 'lodash-es';
import defaults, { BLANK_TOKEN } from './defaults';

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
  if (!session || isEmpty(session) || !session.choiceId) {
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
    if (!session || isEmpty(session)) {
      resolve({ score: 0, empty: true });
      return;
    }

    session = normalizeSession(session);

    if (env.mode !== 'evaluate') {
      resolve({ score: undefined, completed: undefined });
    } else {
      const correctness = getCorrectness(question, session);
      if (correctness === 'unanswered') {
        resolve({ score: 0, empty: true });
        return;
      }
      const score = correctness === 'correct' ? 1 : 0;
      resolve({ score, empty: false });
    }
  });

export const createDefaultModel = (model: any = {}) => ({ ...defaults.model, ...model });

export const normalizeSession = (s: any) => ({ ...s });

export const model = (question: any, session: any, env: any) => {
  return new Promise((resolve) => {
    session = session || {};
    const normalizedQuestion = createDefaultModel(question);

    const out: any = {
      prompt: normalizedQuestion.promptEnabled ? normalizedQuestion.prompt : null,
      interactionMode: normalizedQuestion.interactionMode || 'populate_blank',
      layoutProfile: normalizedQuestion.layoutProfile || '',
      choiceLayout: normalizedQuestion.choiceLayout || '',
      sentenceHtml: normalizedQuestion.sentenceHtml || null,
      template: normalizedQuestion.template,
      choiceMode: normalizedQuestion.choiceMode,
      choices: normalizedQuestion.choices,
      correctChoiceId: normalizedQuestion.correctChoiceId,
      hasAudio: normalizedQuestion.hasAudio,
      autoplayAudioEnabled: !!normalizedQuestion.autoplayAudioEnabled,
      completeAudioEnabled: !!normalizedQuestion.completeAudioEnabled,
      audioUrl: normalizedQuestion.hasAudio ? normalizedQuestion.audioUrl : null,
      audioTranscript: normalizedQuestion.hasAudio ? normalizedQuestion.audioTranscript : null,
      showVisibleTranscript: !!normalizedQuestion.showVisibleTranscript,
      locale: normalizedQuestion.locale || '',
      disabled: env.mode !== 'gather',
      view: env.mode === 'view',
      env,
    };

    if (env.mode === 'evaluate') {
      const correctness = getCorrectness(normalizedQuestion, session);
      out.correctness = correctness;
    }

    if (env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate')) {
      out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
        ? normalizedQuestion.teacherInstructions
        : null;
    } else {
      out.teacherInstructions = null;
    }

    resolve(out);
  });
};

export const createCorrectResponseSession = (question: any, env: any) => {
  return new Promise((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      resolve({
        id: question?.id || '1',
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
    const hasTranscript = !!model.audioTranscript?.trim();
    if (!hasAudioUrl && !hasTranscript) {
      errors.audioTranscript = 'Audio transcript or audio URL is required when audio is enabled';
    }
  }

  return errors;
};
