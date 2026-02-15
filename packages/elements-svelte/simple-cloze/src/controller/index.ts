import { isEmpty } from 'lodash-es';
import defaults from './defaults';

export const getCorrectness = (question: any, session: any) => {
  if (!session || !session.response) {
    return 'unanswered';
  }

  const correctAnswer = question?.correctAnswer || '';
  const userAnswer = session.response || '';

  // Simple string comparison for now
  if (userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()) {
    return 'correct';
  }

  return 'incorrect';
};

export const getPartialScore = (_question: any, session: any) => {
  if (!session || isEmpty(session)) {
    return 0;
  }

  return 1;
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
      const score = correctness === 'correct' ? 1 : 0;
      resolve({ score });
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
      disabled: env.mode !== 'gather',
      view: env.mode === 'view',
      env,
    };

    if (env.mode === 'evaluate') {
      const correctness = getCorrectness(normalizedQuestion, session);
      out.correctness = correctness;
      out.correctAnswer = normalizedQuestion.correctAnswer;
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
      resolve({ id: '1', response: question.correctAnswer || '' });
    } else {
      resolve(null);
    }
  });
};

export const validate = (model: any = {}, _config: any = {}) => {
  const errors: any = {};

  if (!model.prompt || model.prompt.trim() === '' || model.prompt === '<p></p>') {
    errors.prompt = 'Prompt is required';
  }

  return errors;
};
