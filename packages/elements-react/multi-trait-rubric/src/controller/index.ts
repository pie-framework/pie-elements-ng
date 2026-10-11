import type { PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import { markupToText } from './utils.js';
import type { MultiTraitRubricConfiguration, MultiTraitRubricModel, MultiTraitRubricSession } from '../types.js';

/** Errors of one trait: `name` and `description` messages. */
export type TraitErrors = { name?: string; description?: string };

/** Errors `validate()` reports, keyed by scale index, then by trait or score point index. */
export type MultiTraitRubricValidationErrors = {
  traitsErrors?: Record<number, Record<number, TraitErrors>>;
  scorePointsErrors?: Record<number, Record<number, string>>;
};

export const normalize = (question: Partial<MultiTraitRubricModel>) => ({ ...defaults, ...question });

export function createDefaultModel(model: Partial<MultiTraitRubricModel> = {}) {
  return new Promise<ReturnType<typeof normalize>>((resolve) => resolve({ ...defaults, ...model }));
}

/**
 *
 * @param {*} question
 * @param {*} session
 * @param {*} env
 */
export async function model(
  question: MultiTraitRubricModel,
  _session: MultiTraitRubricSession | undefined,
  env: PieEnvironment,
) {
  const normalizedQuestion: ReturnType<typeof normalize> & { visible?: boolean } = normalize(question);

  if (!env.role || env.role === 'student') {
    normalizedQuestion.visible = normalizedQuestion.visibleToStudent;
  } else {
    normalizedQuestion.visible = true;
  }

  // todo update pie-ui instead of parsing this here:
  const { scales, excludeZero } = normalizedQuestion || {};
  const parsedScales = (scales || []).map((scale) => ({ ...scale, excludeZero }));

  return {
    ...normalizedQuestion,
    scales: parsedScales,
  };
}

export const getScore = () => 0;

/**
 * @param {Object} model - the main model
 * @param {*} session
 * @param {Object} env
 */
export function outcome() {
  return new Promise((resolve) => resolve({ score: 0, empty: true }));
}

export const createCorrectResponseSession = (_question: MultiTraitRubricModel, env: PieEnvironment) => {
  return new Promise<MultiTraitRubricSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      resolve({ id: '1' });
    } else {
      resolve(null);
    }
  });
};

// IMPORTANT! If you make any changes to this function, please make sure you also update complex-rubric/controller/validateMultiTraitRubric function!“.
export const validate = (
  model: Partial<MultiTraitRubricModel>,
  _config?: MultiTraitRubricConfiguration,
): MultiTraitRubricValidationErrors => {
  const { scales, description = false, pointLabels = false } = model;
  const errors: MultiTraitRubricValidationErrors = {};
  const traitsErrors: Record<number, Record<number, TraitErrors>> = {};
  const scorePointsErrors: Record<number, Record<number, string>> = {};

  (scales || []).forEach((scale, scaleIndex) => {
    const { traits = [] } = scale;
    const { scorePointsLabels = [] } = scale;
    const scaleErrors: Record<number, TraitErrors> = {};
    const scorePointsLabelsErrors: Record<number, string> = {};

    if (pointLabels) {
      scorePointsLabels.forEach((scorePointLabel, scoreIndex) => {
        if (!scorePointLabel || scorePointLabel === '<div></div>') {
          scorePointsLabelsErrors[scoreIndex] = 'Points labels should not be empty.';
        } else {
          const identicalScorePointLabel = scorePointsLabels
            .slice(scoreIndex + 1)
            .some((s) => markupToText(s) === markupToText(scorePointLabel));

          if (identicalScorePointLabel) {
            scorePointsLabelsErrors[scoreIndex] = 'Points labels should be unique.';
          }
        }
      });
    }

    if (Object.keys(scorePointsLabelsErrors).length > 0) {
      scorePointsErrors[scaleIndex] = scorePointsLabelsErrors;
    }

    traits.forEach((trait, traitIndex) => {
      if (!trait.name || trait.name === '<div></div>') {
        scaleErrors[traitIndex] = { name: 'Trait names should not be empty.' };
      } else {
        const identicalTraitName = traits
          .slice(traitIndex + 1)
          .some((t) => markupToText(t.name) === markupToText(trait.name));

        if (identicalTraitName) {
          scaleErrors[traitIndex] = { name: 'Trait names should be unique.' };
        }
      }
      if (description && (!trait.description || trait.description === '<div></div>')) {
        scaleErrors[traitIndex] = { ...scaleErrors[traitIndex], description: 'Trait description should not be empty' };
      } else {
        const identicalTraitDescr = traits
          .slice(traitIndex + 1)
          .some((t) => markupToText(t.description) === markupToText(trait.description));

        if (description && identicalTraitDescr) {
          scaleErrors[traitIndex] = { ...scaleErrors[traitIndex], description: 'Trait descriptions should be unique.' };
        }
      }
    });
    if (Object.keys(scaleErrors).length > 0) {
      traitsErrors[scaleIndex] = scaleErrors;
    }
  });

  if (Object.keys(traitsErrors).length > 0) {
    errors.traitsErrors = traitsErrors;
  }

  if (Object.keys(scorePointsErrors).length > 0) {
    errors.scorePointsErrors = scorePointsErrors;
  }

  return errors;
};
