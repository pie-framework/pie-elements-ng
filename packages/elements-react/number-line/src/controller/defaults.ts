// @ts-nocheck
/**
 * @synced-from pie-elements/packages/number-line/controller/src/defaults.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export default {
  correctResponse: [],
  feedback: {
    correct: { default: 'Correct', type: 'none' },
    incorrect: { default: 'Incorrect', type: 'none' },
    partial: { default: 'Nearly', type: 'none' },
  },
  graph: {
    arrows: { left: true, right: true },
    availableTypes: {
      PF: true,
    },
    domain: { min: -1, max: 1 },
    exhibitOnly: false,
    initialElements: [],
    initialType: 'PF',
    maxNumberOfPoints: 1,
    ticks: { minor: 0.125, major: 0.5, tickIntervalType: 'Decimal' },
    title: '',
    width: 500,
  },
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
  widthEnabled: true,
};
