// @ts-nocheck
/**
 * @synced-from pie-elements/packages/math-inline/controller/src/defaults.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { ResponseTypes } from './utils';

export default {
  allowTrailingZerosDefault: false,
  customKeys: [],
  equationEditor: '8',
  expression: '',
  feedback: {
    correct: { default: 'Correct', type: 'none' },
    incorrect: { default: 'Incorrect', type: 'none' },
    partial: { default: 'Nearly', type: 'none' },
  },
  feedbackEnabled: false,
  ignoreOrderDefault: false,
  partialScoring: true,
  prompt: '',
  promptEnabled: true,
  rationale: '',
  rationaleEnabled: true,
  responseType: ResponseTypes.advanced,
  responses: [],
  scoringType: 'auto',
  studentInstructionsEnabled: true,
  teacherInstructions: '',
  teacherInstructionsEnabled: true,
  toolbarEditorPosition: 'bottom',
  validationDefault: 'literal',
};
