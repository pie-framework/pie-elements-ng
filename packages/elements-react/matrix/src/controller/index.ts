// @ts-nocheck
/**
 * @synced-from pie-elements/packages/matrix/controller/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import defaults from './defaults';
import { isEmpty } from 'lodash-es';

export const createDefaultModel = (model = {}) => new Promise((resolve) => resolve({ ...defaults, ...model }));

/**
 *
 * @param {*} question
 * @param {*} session
 * @param {*} env
 */
export async function model(question, session, env) {
  const normalizedQuestion = { ...defaults, ...question };

  const out = {
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

export function outcome(model, session) {
  return new Promise((resolve) => {
    if (!session || isEmpty(session)) {
      return resolve({ score: 0, empty: true });
    }

    const score = Object.keys(session.value).reduce((acc, key) => {
      const matrixValue = model.matrixValues[key];
      return acc + (matrixValue || 0);
    }, 0);

    resolve({ score, empty: false });
  });
}

export const createCorrectResponseSession = (question, env) => {
  return new Promise((resolve) => {
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

// remove all html tags
const getInnerText = (html) => (html || '').replaceAll(/<[^>]*>/g, '');

// remove all html tags except img, iframe and source tag for audio
const getContent = (html) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (model = {}, config = {}) => {
  const errors = {};

  ['teacherInstructions', 'prompt'].forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  return errors;
};
