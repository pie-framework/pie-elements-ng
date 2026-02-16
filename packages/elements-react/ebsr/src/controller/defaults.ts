// @ts-nocheck
/**
 * @synced-from pie-elements/packages/ebsr/controller/src/defaults.js
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
