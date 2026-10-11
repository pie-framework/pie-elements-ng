import defaults from './defaults.js';
import { isEmpty } from '@pie-element/shared-lodash';
import type { PieEnvironment } from '@pie-element/shared-types';
import type { MatrixConfiguration, MatrixModel, MatrixSession } from '../types.js';

/** Errors `validate()` reports. */
export type MatrixValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
};

/** The model `model()` hands the delivery. */
type MatrixViewModel = Omit<MatrixModel, 'teacherInstructions'> & {
  disabled: boolean;
  mode: PieEnvironment['mode'];
  teacherInstructions?: string | null;
};

export const createDefaultModel = (model: Partial<MatrixModel> = {}) =>
  new Promise<Partial<MatrixModel>>((resolve) => resolve({ ...defaults, ...model }));

/**
 *
 * @param {*} question
 * @param {*} session
 * @param {*} env
 */
export async function model(question: MatrixModel, _session: MatrixSession | undefined, env: PieEnvironment) {
  const normalizedQuestion = { ...defaults, ...question };

  const out: MatrixViewModel = {
    ...normalizedQuestion,
    disabled: env.mode !== 'gather',
    mode: env.mode,
  };

  const { role, mode } = env || {};

  if (role === 'instructor' && (mode === 'view' || mode === 'evaluate')) {
    out.teacherInstructions = normalizedQuestion.teacherInstructionsEnabled
      ? normalizedQuestion.teacherInstructions
      : null;
  } else {
    out.teacherInstructions = null;
  }

  return out;
}

export function outcome(model: MatrixModel, session: MatrixSession | undefined) {
  return new Promise<{ score: number; empty: boolean }>((resolve) => {
    // A player sends an untouched item's session as `{ id, element }`, without `value`.
    if (!session || isEmpty(session) || !session.value) {
      return resolve({ score: 0, empty: true });
    }

    const score = Object.keys(session.value).reduce((acc, key) => {
      // `model` is not normalized here, so a model without `matrixValues` throws
      const matrixValue = (model.matrixValues as Record<string, number>)[key];
      return acc + (matrixValue || 0);
    }, 0);

    resolve({ score, empty: false });
  });
}

export const createCorrectResponseSession = (question: MatrixModel, env: PieEnvironment) => {
  return new Promise<MatrixSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { matrixValues } = question || [];

      resolve({
        id: '1',
        value: matrixValues,
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<MatrixModel> = {},
  config: MatrixConfiguration = {},
): MatrixValidationErrors => {
  const errors: MatrixValidationErrors = {};

  (['teacherInstructions', 'prompt'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  return errors;
};
