// @ts-nocheck
/**
 * @synced-from pie-elements/packages/ebsr/controller/src/defaults.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

const partModel = (base) => ({
  choiceMode: 'radio',
  choicePrefix: 'letters',
  choices: [],
  choicesLayout: 'vertical',
  feedbackEnabled: false,
  gridColumns: 2,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  spellCheckEnabled: true,
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
  ...base,
});

export default {
  partLabels: true,
  partLabelType: 'Letters',
  partA: partModel(),
  partB: partModel(),
};
