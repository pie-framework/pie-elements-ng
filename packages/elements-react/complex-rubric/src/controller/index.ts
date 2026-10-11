import type { TraitErrors, MultiTraitRubricValidationErrors } from '@pie-element/multi-trait-rubric/controller';
import type { RubricValidationErrors } from '@pie-element/rubric/controller';
import type { PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import { markupToText } from './utils.js';
import type {
  ComplexRubricConfiguration,
  ComplexRubricModel,
  ComplexRubricSession,
  EmbeddedMultiTraitRubricModel,
  EmbeddedRubricModel,
} from '../types.js';

/** Errors `validate()` reports: the simple rubric's or the multi trait rubric's, per `rubricType`. */
export type ComplexRubricValidationErrors = RubricValidationErrors & MultiTraitRubricValidationErrors;

/** A rubric model as `model()` hands it to delivery, which shows it when `visible`. */
type ViewRubric<T> = Partial<T> & { visible?: boolean };

type MultiTraitView = ViewRubric<EmbeddedMultiTraitRubricModel>;

type NormalizedQuestion = Omit<ReturnType<typeof normalize>, 'rubrics'> & {
  rubrics: {
    simpleRubric?: ViewRubric<EmbeddedRubricModel>;
    multiTraitRubric?: ViewRubric<EmbeddedMultiTraitRubricModel>;
    rubricless?: ViewRubric<EmbeddedRubricModel>;
  };
};


// todo the import from pie-lib/rubric WILL break pslb
//  so don't use it unless you also test "yarn build"
const RUBRIC_TYPES = {
  SIMPLE_RUBRIC: 'simpleRubric',
  MULTI_TRAIT_RUBRIC: 'multiTraitRubric',
  'rubricless': 'rubricless',
} as const;

export function createDefaultModel(model: Partial<ComplexRubricModel> = {}) {
  return new Promise<ReturnType<typeof normalize>>((resolve) => resolve({ ...defaults, ...model }));
}

export const normalize = (question: Partial<ComplexRubricModel>) => ({ ...defaults, ...question });

/**
 * @param {*} question
 * @param {*} session
 * @param {*} env
 */
export async function model(
  question: ComplexRubricModel,
  _session: ComplexRubricSession | undefined,
  env: PieEnvironment,
) {
  const normalizedQuestion: NormalizedQuestion = normalize(question);

  if (
    normalizedQuestion.rubricType === RUBRIC_TYPES.SIMPLE_RUBRIC ||
    // @ts-expect-error RUBRIC_TYPES has no RUBRICLESS key, so a rubricless model takes the multi trait branch (as in legacy).
    normalizedQuestion.rubricType === RUBRIC_TYPES.RUBRICLESS
  ) {
    return new Promise<Partial<NormalizedQuestion>>((resolve) => {
      resolve(
        env && env.role && env.role === 'instructor'
          ? {
              ...normalizedQuestion,
              rubrics: {
                ...normalizedQuestion.rubrics,
                multiTraitRubric: {
                  ...normalizedQuestion.rubrics.multiTraitRubric,
                  visible: false,
                },
              },
            }
          : {},
      );
    });
  } else {
    if (
      !env.role ||
      (env.role === 'student' && normalizedQuestion.rubrics && normalizedQuestion.rubrics.multiTraitRubric)
    ) {
      (normalizedQuestion.rubrics.multiTraitRubric as MultiTraitView).visible = normalizedQuestion.visibleToStudent;
    } else {
      (normalizedQuestion.rubrics.multiTraitRubric as MultiTraitView).visible = true;
    }

    // todo update pie-ui instead of parsing this here:
    const { scales, excludeZero } = (normalizedQuestion.rubrics.multiTraitRubric as MultiTraitView) || {};
    const parsedScales = (scales || []).map((scale) => ({ ...scale, excludeZero }));

    return {
      ...normalizedQuestion,
      rubrics: {
        ...normalizedQuestion.rubrics,
        simpleRubric: {
          ...normalizedQuestion.rubrics.simpleRubric,
          visible: false,
        },
        rubricless: {
          ...normalizedQuestion.rubrics.rubricless,
          visible: false,
        },
        multiTraitRubric: {
          ...normalizedQuestion.rubrics.multiTraitRubric,
          scales: parsedScales,
        },
      },
    };
  }
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

export const createCorrectResponseSession = (_question: ComplexRubricModel, env: PieEnvironment) => {
  return new Promise<ComplexRubricSession | null>((resolve) => {
    if (env.mode !== 'evaluate' && env.role === 'instructor') {
      resolve({ id: '1' });
    } else {
      resolve(null);
    }
  });
};

// IMPORTANT! This function is a duplicate of rubric/controller/validate function!
// If you make any changes to this function, please make sure you also update rubric/controller/validate function!“.
const validateSimpleRubric = (model: EmbeddedRubricModel): RubricValidationErrors => {
  const { points } = model;
  const errors: RubricValidationErrors = {};
  const pointsDescriptorsErrors: Record<number, string> = {};

  (points || []).forEach((point, index) => {

    if (!point || point === '<div></div>') {
      pointsDescriptorsErrors[index] = 'Points descriptors cannot be empty.';
    } else {
      const identicalPointDescr = (points as string[]).slice(index + 1).some((p) => markupToText(p) === markupToText(point));

      if (identicalPointDescr) {
        pointsDescriptorsErrors[index] = 'Points descriptors should be unique.';
      }
    }
  });

  if (Object.keys(pointsDescriptorsErrors).length > 0) {
    errors.pointsDescriptorsErrors = pointsDescriptorsErrors;
  }

  return errors;
};

// IMPORTANT! This function is a duplicate of multi-trait-rubric/controller/validate function!
// If you make any changes to this function, please make sure you also update multi-trait-rubric/controller/validate function!“.
const validateMultiTraitRubric = (model: Partial<EmbeddedMultiTraitRubricModel>): MultiTraitRubricValidationErrors => {
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

export const validate = (
  model: Partial<ComplexRubricModel> = {},
  _config: ComplexRubricConfiguration = {},
): ComplexRubricValidationErrors => {
  const { rubrics = {}, rubricType } = model;
  const { multiTraitRubric = {}, simpleRubric = {} } = rubrics;
  let errors: ComplexRubricValidationErrors = {};

  switch (rubricType) {
    case RUBRIC_TYPES.SIMPLE_RUBRIC:
    default:
      errors = validateSimpleRubric(simpleRubric);
      break;
    case RUBRIC_TYPES.MULTI_TRAIT_RUBRIC:
      errors = validateMultiTraitRubric(multiTraitRubric);
      break;
  }

  return errors;
};
