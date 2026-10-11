import debug from 'debug';
import type { PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import type { DrawingResponseConfiguration, DrawingResponseModel, DrawingResponseSession } from '../types.js';

const log = debug('pie-elements:drawing-response:controller');

/** Errors `validate()` reports, keyed by field. */
export type DrawingResponseValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
};

export const normalize = (question: DrawingResponseModel): DrawingResponseModel => ({ ...defaults, ...question });

export function model(
  question: DrawingResponseModel,
  _session: DrawingResponseSession | null | undefined,
  env: PieEnvironment,
) {
  const normalizedQuestion = normalize(question);
  const { extraCSSRules, imageUrl, imageDimensions, prompt, promptEnabled, backgroundImageEnabled, language } = normalizedQuestion;

  return new Promise((resolve) => {
    const out = {
      disabled: env.mode !== 'gather',
      mode: env.mode,
      imageDimensions,
      imageUrl,
      prompt: promptEnabled ? prompt : null,
      backgroundImageEnabled,
      language,
      extraCSSRules,
      teacherInstructions:
        env.role === 'instructor' &&
        (env.mode === 'view' || env.mode === 'evaluate') &&
        normalizedQuestion.teacherInstructionsEnabled
          ? normalizedQuestion.teacherInstructions
          : null,
    };

    resolve(out);
  });
}

export const createDefaultModel = (model: Partial<DrawingResponseModel> = {}) =>
  new Promise<Partial<DrawingResponseModel>>((resolve) => {
    resolve({
      ...defaults,
      ...model,
    });
  });

export function outcome(/*config, session*/) {
  return new Promise<{ score: number; completed: string; note: string }>((resolve) => {
    log('outcome...');
    resolve({
      score: 0,
      completed: 'n/a',
      note: 'Requires manual scoring',
    });
  });
}

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<DrawingResponseModel> = {},
  config: DrawingResponseConfiguration = {},
): DrawingResponseValidationErrors => {
  const errors: DrawingResponseValidationErrors = {};

  (['teacherInstructions', 'prompt'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  return errors;
};
