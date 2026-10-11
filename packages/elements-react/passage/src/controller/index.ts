import { isEmpty } from '@pie-element/shared-lodash';
import type { PieEnvironment } from '@pie-element/shared-types';

import defaults from './defaults.js';
import type { PassageConfiguration, PassageModel, PassageSession } from '../types.js';

/** A passage as the delivery renders it: each field is empty when disabled */
export interface PassageView {
  teacherInstructions: string;
  label: string;
  title: string;
  subtitle: string;
  author: string;
  text: string;
}

export type ModelView = Omit<PassageModel, 'passages'> & { passages: PassageView[] };

type PassageField = 'teacherInstructions' | 'title' | 'subtitle' | 'author' | 'text';

export type PassageFieldErrors = Partial<Record<PassageField, string>>;

/** Errors from `validate()`, keyed by passage index */
export type PassageValidationErrors = {
  passages?: Record<number, PassageFieldErrors>;
};

const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

const checkNullish = (value: boolean | undefined) => value !== null && value !== undefined;

const isEnabled = (value: boolean | undefined, defaultValue: boolean | undefined) => (checkNullish(value) ? value : defaultValue);

export function createDefaultModel(model: Partial<PassageModel> = {}) {
  return new Promise<Omit<PassageModel, 'id' | 'element'> & Partial<PassageModel>>((resolve) => {
    resolve({ ...defaults, ...model });
  });
}

export const normalize = (question: PassageModel) => ({ ...defaults, ...question });

const normalizeTeacherInstructions = (instructions: string | undefined, env: PieEnvironment) => {
  const { role, mode } = env;

  if (role === 'instructor' && (mode === 'view' || mode === 'evaluate')) {
    return instructions || '';
  }

  return '';
};

export async function model(
  question: PassageModel,
  _session: PassageSession | undefined,
  env: PieEnvironment
): Promise<ModelView> {
  const normalizedQuestion = normalize(question);

  const normalizedPassages = normalizedQuestion.passages.map((passage, index): PassageView => ({
    teacherInstructions: isEnabled(passage.teacherInstructionsEnabled, normalizedQuestion.teacherInstructionsEnabled)
      ? normalizeTeacherInstructions(passage.teacherInstructions, env)
      : '',
    label: getContent(passage.title) ? passage.title! : `Passage ${index + 1}`,
    title: isEnabled(passage.titleEnabled, normalizedQuestion.titleEnabled) ? passage.title || '' : '',
    subtitle: isEnabled(passage.subtitleEnabled, normalizedQuestion.subtitleEnabled) ? passage.subtitle || '' : '',
    author: isEnabled(passage.authorEnabled, normalizedQuestion.authorEnabled) ? passage.author || '' : '',
    text: isEnabled(passage.textEnabled, normalizedQuestion.textEnabled) ? passage.text || '' : '',
  }));

  return {
    ...normalizedQuestion,
    passages: normalizedPassages,
  };
}

export const validate = (
  model: Partial<PassageModel> = {},
  config: PassageConfiguration = {}
): PassageValidationErrors => {
  const errors: PassageValidationErrors = {};
  const passagesErrors: Record<number, PassageFieldErrors> = {};

  (model.passages || []).forEach((passage, index) => {
    const err: PassageFieldErrors = {};

    (['teacherInstructions', 'title', 'subtitle', 'author', 'text'] as const).forEach((field) => {
      if (config[field]?.required && !getContent(passage[field])) {
        err[field] = 'This field is required.';
      }
    });

    if (!isEmpty(err)) {
      passagesErrors[index] = err;
    }
  });

  if (!isEmpty(passagesErrors)) {
    errors.passages = passagesErrors;
  }

  return errors;
};
