import debug from 'debug';
import { isEmpty } from '@pie-element/shared-lodash';
import { partialScoring } from '@pie-element/shared-controller-utils';
import type { PieEnvironment } from '@pie-element/shared-types';

import { isResponseCorrect } from './utils.js';

import defaults from './defaults.js';
import type {
  HotspotAnswer,
  HotspotConfiguration,
  HotspotModel,
  HotspotSession,
  HotspotShape,
  Polygon,
} from '../types.js';

const log = debug('pie-elements:hotspot:controller');

/** Errors `validate()` reports, keyed by field. */
export type HotspotValidationErrors = {
  teacherInstructions?: string;
  prompt?: string;
  rationale?: string;
  shapes?: string;
  selections?: string;
};

const checkNullish = (value: unknown) => value !== null && value !== undefined;

export const normalize = (question: HotspotModel): HotspotModel => ({
  ...defaults,
  ...question,
});

export function model(question: HotspotModel, session: HotspotSession | null | undefined, env: PieEnvironment) {
  const normalizedQuestion = normalize(question);
  const {
    imageUrl,
    dimensions,
    hotspotColor,
    hoverOutlineColor,
    selectedHotspotColor,
    multipleCorrect,
    outlineColor,
    partialScoring,
    prompt,
    shapes,
    language,
    fontSizeFactor,
    autoplayAudioEnabled,
    autoplayAudioHeld,
    completeAudioEnabled,
    customAudioButton,
  } = normalizedQuestion;
  const { rectangles, polygons, circles } = shapes || {};

  const shouldIncludeCorrectResponse = env.mode === 'evaluate' || (env.role === 'instructor' && env.mode === 'view');

  const isInstructorReview = env.role === 'instructor' && (env.mode === 'view' || env.mode === 'evaluate');

  return new Promise((resolve) => {
    const out = {
      disabled: env.mode !== 'gather',
      mode: env.mode,
      dimensions,
      imageUrl,
      outlineColor,
      hotspotColor,
      hoverOutlineColor: checkNullish(hoverOutlineColor) ? hoverOutlineColor : 'black',
      selectedHotspotColor,
      multipleCorrect,
      partialScoring,
      language,
      fontSizeFactor,
      autoplayAudioEnabled,
      autoplayAudioHeld,
      completeAudioEnabled,
      customAudioButton,
      shapes: {
        ...shapes,
        // eslint-disable-next-line no-unused-vars
        rectangles: (rectangles || []).map(({ index, correct, ...rectProps }) =>
          shouldIncludeCorrectResponse ? { correct, ...rectProps } : { ...rectProps },
        ),
        // eslint-disable-next-line no-unused-vars
        polygons: (polygons || []).map(({ index, correct, ...polyProps }) =>
          shouldIncludeCorrectResponse ? { correct, ...polyProps } : { ...polyProps },
        ),
        // eslint-disable-next-line no-unused-vars
        circles: (circles || []).map(({ index, correct, ...circleProps }) =>
          shouldIncludeCorrectResponse ? { correct, ...circleProps } : { ...circleProps },
        ),
      },
      responseCorrect: env.mode === 'evaluate' ? isResponseCorrect(normalizedQuestion, session) : undefined,
      extraCSSRules: normalizedQuestion.extraCSSRules,
      rationale: isInstructorReview && normalizedQuestion.rationaleEnabled ? normalizedQuestion.rationale : null,
      teacherInstructions:
        isInstructorReview && normalizedQuestion.teacherInstructionsEnabled
          ? normalizedQuestion.teacherInstructions
          : null,
      prompt: normalizedQuestion.promptEnabled ? prompt : null,
      strokeWidth: normalizedQuestion.strokeWidth,
    };

    resolve(out);
  });
}

export const createDefaultModel = (model: Partial<HotspotModel> = {}) =>
  new Promise<Partial<HotspotModel>>((resolve) => {
    resolve({
      ...defaults,
      ...model,
    });
  });

const getScore = (
  config: HotspotModel,
  session: HotspotSession | null | undefined,
  env: Partial<PieEnvironment> = {},
) => {
  const { answers } = session || {};

  if (!config.shapes || (!config.shapes.rectangles && !config.shapes.polygons && !config.shapes.circles)) {
    return 0;
  }

  const { shapes: { rectangles = [], polygons = [], circles = [] } = {} } = config;
  const partialScoringEnabled = partialScoring.enabled(config, env);

  if (!partialScoringEnabled) {
    return isResponseCorrect(config, session) ? 1 : 0;
  }

  let correctAnswers = 0;
  let selectedChoices = 0;

  const choices: HotspotShape[] = [...rectangles, ...polygons, ...circles];

  const correctChoices = choices.filter((choice) => choice.correct);

  choices.forEach((shape) => {
    const selected = answers && answers.filter((answer) => answer.id === shape.id)[0];
    const correctlySelected = shape.correct && selected;

    if (selected) {
      selectedChoices += 1;
    }

    if (correctlySelected) {
      correctAnswers += 1;
    }
  });

  const extraAnswers = selectedChoices > correctChoices.length ? selectedChoices - correctChoices.length : 0;

  const total = correctChoices.length === 0 ? 1 : correctChoices.length;
  const str = ((correctAnswers - extraAnswers) / total).toFixed(2);

  return Number(str) < 0 ? 0 : parseFloat(str);
};

  /**
 * Generates detailed trace log for scoring evaluation
 * @param {Object} model - the question model
 * @param {Object} session - the student session
 * @param {Object} env - the environment
 * @returns {Array} traceLog - array of trace messages
 */
export const getLogTrace = (
  model: HotspotModel,
  session: HotspotSession | null | undefined,
  env: Partial<PieEnvironment>,
) => {
  const traceLog: string[] = [];
  const { answers } = session || {};
  const { shapes } = model || {};

  const allShapes: HotspotShape[] = [];
  if (shapes) {
    if (shapes.rectangles) allShapes.push(...shapes.rectangles);
    if (shapes.polygons) allShapes.push(...shapes.polygons);
    if (shapes.circles) allShapes.push(...shapes.circles);
  }

  const correctShapes = allShapes.filter(shape => shape.correct);
  const totalShapes = allShapes.length;

  traceLog.push(`Total of ${totalShapes} hotspot(s) defined, ${correctShapes.length} correct.`);

  if (answers && answers.length > 0) {
    traceLog.push(`Student selected ${answers.length} hotspot(s).`);

    let correctSelections = 0;
    let incorrectSelections = 0;

    answers.forEach(answer => {
      const shape = allShapes.find(s => s.id === answer.id);
      if (shape && shape.correct) {
        correctSelections++;
      } else {
        incorrectSelections++;
      }
    });

    const missedCorrect = correctShapes.filter(correctShape =>
      !answers.some(answer => answer.id === correctShape.id)
    ).length;

    if (correctSelections > 0) {
      traceLog.push(`${correctSelections} correct hotspot(s) selected.`);
    }
    if (incorrectSelections > 0) {
      traceLog.push(`${incorrectSelections} incorrect hotspot(s) selected.`);
    }
    if (missedCorrect > 0) {
      traceLog.push(`${missedCorrect} correct hotspot(s) missed.`);
    }
  } else {
    traceLog.push('No hotspots selected.');
  }

  const partialScoringEnabled = partialScoring.enabled(model, env);

  if (partialScoringEnabled) {
    traceLog.push(`Score calculated using partial scoring.`);

    if (answers && answers.length > 0) {
      let correctSelections = 0;
      let incorrectSelections = 0;

      answers.forEach(answer => {
        const shape = allShapes.find(s => s.id === answer.id);
        if (shape && shape.correct) {
          correctSelections++;
        } else {
          incorrectSelections++;
        }
      });

      const totalCorrectAvailable = correctShapes.length;
      traceLog.push(`Partial scoring calculation: ${correctSelections} correct selections out of ${totalCorrectAvailable} available.`);

      if (incorrectSelections > totalCorrectAvailable) {
        const extraSelections = incorrectSelections - (totalCorrectAvailable - correctSelections);
        traceLog.push(`${extraSelections} extra incorrect selection(s) beyond required amount are deducted from score.`);
      }
    }
  } else {
    traceLog.push(`Score calculated using all-or-nothing scoring.`);
  }

  const score = getScore(model, session, env);
  traceLog.push(`Score: ${score}.`);

  return traceLog;
}

export function outcome(
  config: HotspotModel,
  session: HotspotSession | null | undefined,
  env: Partial<PieEnvironment> = {},
) {
  return new Promise<{ score: number; empty: boolean; traceLog: string[] }>((resolve) => {
    log('outcome...');

    if (!session || isEmpty(session)) {
      resolve({
        score: 0,
        empty: true,
        traceLog: ['No hotspots selected. Score: 0.']
      });
    }

    if (session?.answers) {
      const traceLog = getLogTrace(config, session, env);
      const score = getScore(config, session, env);

      resolve({ score, empty: false, traceLog });
    } else {
      resolve({
        score: 0,
        empty: true,
        traceLog: ['No hotspots selected. Score: 0.']
      });
    }
  });
}

const returnShapesCorrect = (shapes: HotspotShape[]) => {
  let answers: HotspotAnswer[] = [];

  shapes.forEach((i) => {
    const { correct, id } = i;
    if (correct) {
      answers.push({ id });
    }
  });
  return answers;
};

export const createCorrectResponseSession = (question: HotspotModel, env: PieEnvironment) => {
  return new Promise<HotspotSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      const { shapes: { rectangles = [], circles = [], polygons = {} as Polygon[] } = {} } = question;

      const rectangleCorrect = returnShapesCorrect(rectangles);
      const polygonsCorrect = returnShapesCorrect(polygons);
      const circlesCorrect = returnShapesCorrect(circles);

      resolve({
        answers: [...rectangleCorrect, ...polygonsCorrect, ...circlesCorrect],
        id: '1',
      });
    } else {
      resolve(null);
    }
  });
};

// remove all html tags except img, iframe and source tag for audio
const getContent = (html: string | null | undefined) => (html || '').replace(/(<(?!img|iframe|source)([^>]+)>)/gi, '');

export const validate = (
  model: Partial<HotspotModel> = {},
  config: HotspotConfiguration = {},
): HotspotValidationErrors => {
  const { shapes } = model;
  const { minShapes = 2, maxShapes, maxSelections } = config;
  const errors: HotspotValidationErrors = {};

  (['teacherInstructions', 'prompt', 'rationale'] as const).forEach((field) => {
    if (config[field]?.required && !getContent(model[field])) {
      errors[field] = 'This field is required.';
    }
  });

  const allShapes = Object.values(shapes || {}).reduce<HotspotShape[]>(
    (acc, shape) => [...acc, ...(shape as HotspotShape[])],
    [],
  );

  const nbOfSelections = (allShapes || []).reduce((acc, shape) => (shape.correct ? acc + 1 : acc), 0);

  const nbOfShapes = (allShapes || []).length;

  if (nbOfShapes < minShapes) {
    errors.shapes = `There should be at least ${minShapes} shapes defined.`;
  } else if (maxShapes !== undefined && nbOfShapes > maxShapes) {
    errors.shapes = `No more than ${maxShapes} shapes should be defined.`;
  }

  if (nbOfSelections < 1) {
    errors.selections = 'There should be at least 1 shape selected.';
  } else if (maxSelections !== undefined && nbOfSelections > maxSelections) {
    errors.selections = `No more than ${maxSelections} shapes should be selected.`;
  }

  return errors;
};
