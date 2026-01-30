// @ts-nocheck
/**
 * @synced-from pie-elements/packages/boilerplate-item-type/controller/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { isEmpty } from 'lodash-es';
import defaults from './defaults';

export const getCorrectness = (model) => {
  const correctnessCondition = 'c';

  switch (correctnessCondition) {
    case 'c':
      return 'correct';
    case 'pc':
      return 'partially-correct';
    case 'i':
      return 'incorrect';
    default:
      return 'unknown';
  }
};

export const getPartialScore = (question, session) => {
  if (!session || isEmpty(session)) {
    return 0;
  }

  return 1;
};

export const outcome = (question, session, env) =>
  new Promise((resolve) => {
    if (!session || isEmpty(session)) {
      resolve({ score: 0, empty: true });
    }

    session = normalizeSession(session);

    if (env.mode !== 'evaluate') {
      resolve({ score: undefined, completed: undefined });
    } else {
      resolve({ score: 1 });
    }
  });

export const createDefaultModel = (model = {}) => ({ ...defaults.model, ...model });

export const normalizeSession = (s) => ({ ...s });

export const model = (question, session, env) => {
  return new Promise((resolve) => {
    session = session || {};
    const normalizedQuestion = createDefaultModel(question);

    const out = {
      prompt: normalizedQuestion.promptEnabled ? normalizedQuestion.prompt : null,
      extraCSSRules: normalizedQuestion.extraCSSRules,
      env,
    };

    resolve(out);
  });
};

export const createCorrectResponseSession = (question, env) => {
  return new Promise((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      resolve({ id: '1' });
    } else {
      resolve(null);
    }
  });
};

export const validate = (model = {}, config = {}) => {
  const errors = {};

  return errors;
};
