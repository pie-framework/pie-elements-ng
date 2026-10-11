import type { PieEnvironment } from '@pie-element/shared-types';
import defaults from './defaults.js';
import type { RubricModel, RubricSession } from '../types.js';

/** Errors `validate()` reports: `pointsDescriptorsErrors` is keyed by point index. */
export type RubricValidationErrors = {
  pointsDescriptorsErrors?: Record<number, string>;
};

const normalize = (model: Partial<RubricModel>) => ({ ...defaults, ...model });

export function model(model: RubricModel, _session: RubricSession | undefined, env: PieEnvironment) {
  return new Promise<Partial<RubricModel>>((resolve) => {
    const modelResult = normalize(model || {});

    resolve(env && env.role && env.role === 'instructor' ? modelResult : {});
  });
}

function markupToText(s: string | undefined) {
  return (s || '').replace(/(<([^>]+)>)/gi, '');
}

// IMPORTANT! If you make any changes to this function, please make sure you also update complex-rubric/controller/validateSimpleRubric function!“.
export function validate(model: Partial<RubricModel>): RubricValidationErrors {
  const { points } = model;
  const errors: RubricValidationErrors = {};
  const pointsDescriptorsErrors: Record<number, string> = {};

  (points || []).forEach((point, index, allPoints) => {

    if (!point || point === '<div></div>') {
      pointsDescriptorsErrors[index] = 'Points descriptors cannot be empty.';
    } else {
      const identicalPointDescr = allPoints.slice(index + 1).some((p) => markupToText(p) === markupToText(point));

      if (identicalPointDescr) {
        pointsDescriptorsErrors[index] = 'Points descriptors should be unique.';
      }
    }
  });

  if (Object.keys(pointsDescriptorsErrors).length > 0) {
    errors.pointsDescriptorsErrors = pointsDescriptorsErrors;
  }

  return errors;
}
