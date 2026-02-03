// @ts-nocheck
/**
 * @synced-from pie-elements/packages/complex-rubric/controller/src/defaults.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

// todo the import from pie-lib/rubric WILL break pslb
//  so don't use it unless you also test "yarn build"
const RUBRIC_TYPES = {
  SIMPLE_RUBRIC: 'simpleRubric',
  MULTI_TRAIT_RUBRIC: 'multiTraitRubric',
  'rubricless': 'rubricless',
};

const multiTraitDefaultModel = {
  description: false,
  excludeZero: false,
  halfScoring: false,
  pointLabels: true,
  scales: [],
  standards: false,
  visibleToStudent: true,
};

const rubricDefaultModel = {
  points: ['', '', '', ''],
  sampleAnswers: [null, null, null, null],
  maxPoints: 3,
  excludeZero: false,
};

const rubriclessDefaultModel = {
  maxPoints: 100,
  excludeZero: false,
  rubriclessInstructionEnabled: true,
};

export default {
  rubricType: 'simpleRubric',
  rubrics: {
    [RUBRIC_TYPES.SIMPLE_RUBRIC]: rubricDefaultModel,
    [RUBRIC_TYPES.MULTI_TRAIT_RUBRIC]: multiTraitDefaultModel,
    [RUBRIC_TYPES.RUBRICLESS]: rubriclessDefaultModel,
  },
};
