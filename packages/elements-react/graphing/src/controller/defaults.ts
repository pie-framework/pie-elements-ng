// @ts-nocheck
/**
 * @synced-from pie-elements/packages/graphing/controller/src/defaults.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

// TODO: This is lifted from @pie-lib/graphing, however importing this will break a controller build because it has jsx source in that package.
const allTools = [
  'circle',
  'line',
  'label',
  'parabola',
  'point',
  'polygon',
  'ray',
  'segment',
  'sine',
  'vector',
  // 'absolute', // - not available as default
  // 'exponential', // - not available as default
];

/* model defaults */
export default {
  answers: {
    correctAnswer: {
      name: 'Correct Answer',
      marks: [],
    },
  },
  arrows: {
    left: true,
    right: true,
    up: true,
    down: true,
  },
  backgroundMarks: [],
  coordinatesOnHover: false,
  defaultGridConfiguration: 0,
  domain: {
    min: -5,
    max: 5,
    step: 1,
    labelStep: 1,
    axisLabel: 'x',
  },
  graph: { width: 500, height: 500 },
  includeAxes: true,
  labels: {},
  labelsEnabled: true,
  padding: true,
  prompt: '',
  promptEnabled: true,
  range: {
    min: -5,
    max: 5,
    step: 1,
    labelStep: 1,
    axisLabel: 'y',
  },
  rationale: '',
  rationaleEnabled: true,
  standardGrid: false,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  title: '',
  titleEnabled: true,
  toolbarTools: allTools,
};
