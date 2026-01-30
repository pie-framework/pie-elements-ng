// @ts-nocheck
/**
 * @synced-from pie-elements/packages/inline-dropdown/configure/src/defaults.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export default {
  model: {
    alternateResponse: {},
    choiceRationaleEnabled: true,
    choices: {},
    disabled: false,
    displayType: 'block',
    markup: '',
    mode: 'gather',
    prompt: '',
    promptEnabled: true,
    rationale: '',
    rationaleEnabled: true,
    shuffle: true,
    studentInstructionsEnabled: true,
    teacherInstructions: '',
    teacherInstructionsEnabled: true,
    toolbarEditorPosition: 'bottom',
  },
  configuration: {
    baseInputConfiguration: {
      audio: { disabled: false },
      video: { disabled: false },
      image: { disabled: false },
      h3: { disabled: true },
      blockquote: { disabled: true },
      textAlign: { disabled: true },
      showParagraphs: { disabled: false },
      separateParagraphs: { disabled: true },
    },
    prompt: {
      settings: true,
      label: 'Prompt',
      required: false,
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
    responseAreaInputConfiguration: {
      inputConfiguration: {
        audio: { disabled: true },
        video: { disabled: true },
        image: { disabled: true },
        table: { disabled: true },
        ul_list: { disabled: true },
        ol_list: { disabled: true },
      },
    },
    settingsPanelDisabled: false,
    spellCheck: {
      label: 'Spellcheck',
      settings: false,
      enabled: true,
    },
    lockChoiceOrder: {
      settings: true,
      label: 'Lock Choice Order',
    },
    partialScoring: {
      settings: false,
      label: 'Allow Partial Scoring',
    },
    rationale: {
      settings: true,
      label: 'Rationale',
      required: false,
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
    teacherInstructions: {
      settings: true,
      label: 'Teacher Instructions',
      required: false,
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
    template: {
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
    choiceRationale: {
      settings: true,
      label: 'Choice Rationale',
    },
    toolbarEditorPosition: {
      settings: false,
      label: 'Toolbar Editor Position',
    },
    maxResponseAreas: 10,
    maxResponseAreaChoices: 10,
    maxImageWidth: {
      teacherInstructions: 300,
      prompt: 300,
      rationale: 300,
    },
    maxImageHeight: {
      teacherInstructions: 300,
      prompt: 300,
      rationale: 300,
    },
    withRubric: {
      settings: false,
      label: 'Add Rubric',
    },
    mathMlOptions: {
      mmlOutput: false,
      mmlEditing: false,
    },
    language: {
      settings: false,
      label: 'Specify Language',
      enabled: false,
    },
    languageChoices: {
      label: 'Language Choices',
      options: [],
    },
  },
};
