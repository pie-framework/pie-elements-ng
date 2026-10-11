import type { PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import type { LikertChoice, LikertConfiguration, LikertModel, LikertSession } from '../types.js';

/** Errors `validate()` reports, keyed by field. */
export type LikertValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
};

const prepareChoice = (choice: LikertChoice): LikertChoice => {
  return {
    label: choice.label,
    value: choice.value,
  };
};

export function createDefaultModel(model: Partial<LikertModel> = {}) {
  return new Promise<ReturnType<typeof normalize>>((resolve) => resolve({ ...defaults, ...model }));
}

export const normalize = (question: Partial<LikertModel>) => ({ ...defaults, ...question });

/**
 *
 * @param {*} question
 * @param {*} session
 * @param {*} env
 */
export async function model(question: LikertModel, _session: LikertSession | undefined, env: PieEnvironment) {
  const normalizedQuestion = normalize(question);

  let choices = normalizedQuestion.choices.map(prepareChoice);

  const out: Omit<typeof normalizedQuestion, 'teacherInstructions'> & {
    disabled: boolean;
    mode: PieEnvironment['mode'];
    teacherInstructions?: string | null;
  } = {
    ...normalizedQuestion,
    choices,
    disabled: env.mode !== 'gather',
    mode: env.mode,
  };

  const { role, mode } = env || ({} as Partial<PieEnvironment>);

  if (role === 'instructor' && (mode === 'view' || mode === 'evaluate')) {
    out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
      ? normalizedQuestion.teacherInstructions
      : null;
  } else {
    out.teacherInstructions = null;
  }

  return out;
}

export function outcome() {
  return new Promise<{ score: number; empty: boolean }>((resolve) => {
    resolve({ score: 0, empty: false });
  });
}

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<LikertModel> = {},
  config: LikertConfiguration = {},
): LikertValidationErrors => {
  const errors: LikertValidationErrors = {};

  (['teacherInstructions', 'prompt'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  return errors;
};
