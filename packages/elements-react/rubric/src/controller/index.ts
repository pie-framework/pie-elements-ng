// @ts-nocheck
/**
 * @synced-from pie-elements/packages/rubric/controller/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import defaults from './defaults';

const normalize = (model) => ({ ...defaults, ...model });

export function model(model, session, env) {
  return new Promise((resolve) => {
    const modelResult = normalize(model || {});

    resolve(env && env.role && env.role === 'instructor' ? modelResult : {});
  });
}

function markupToText(s) {
  return (s || '').replace(/(<([^>]+)>)/gi, '');
}

// IMPORTANT! If you make any changes to this function, please make sure you also update complex-rubric/controller/validateSimpleRubric function!“.
export function validate(model) {
  const { points } = model;
  const errors = {};
  const pointsDescriptorsErrors = {};

  (points || []).forEach((point, index) => {

    if (!point || point === '<div></div>') {
      pointsDescriptorsErrors[index] = 'Points descriptors cannot be empty.';
    } else {
      const identicalPointDescr = points.slice(index + 1).some((p) => markupToText(p) === markupToText(point));

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
