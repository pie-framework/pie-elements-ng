// @ts-nocheck
/**
 * @synced-from pie-elements/packages/select-text/configure/src/defaultConfiguration.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export default {
  model: {
    feedbackEnabled: false,
    highlightChoices: false,
    maxSelections: 0,
    mode: 'sentence',
    partialScoring: false,
    prompt: '',
    promptEnabled: true,
    rationale: '',
    rationaleEnabled: true,
    scoringType: 'auto',
    studentInstructionsEnabled: true,
    teacherInstructions: '',
    teacherInstructionsEnabled: true,
    text: '',
    tokens: [],
    toolbarEditorPosition: 'bottom',
  },
  configuration: {
    baseInputConfiguration: {
      audio: { disabled: false },
      video: { disabled: false },
      image: { disabled: false },
      textAlign: { disabled: true },
      showParagraphs: { disabled: false },
      separateParagraphs: { disabled: true },
    },
    selectionCount: {
      settings: true,
      label: 'Selection count',
    },
    correctAnswer: {
      settings: true,
      label: 'Correct Answers',
    },
    selections: {
      settings: true,
      label: 'Selections Available',
    },
    highlightChoices: {
      settings: true,
      label: 'Highlight choices',
    },
    rationale: {
      settings: true,
      label: 'Rationale',
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
      required: false,
    },
    scoringType: {
      settings: false,
      label: 'Scoring Type',
    },
    studentInstructions: {
      settings: false,
      label: 'Student Instructions',
    },
    teacherInstructions: {
      settings: true,
      label: 'Teacher Instructions',
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
      required: false,
    },
    prompt: {
      label: 'Prompt',
      settings: true,
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
      required: false,
    },
    text: {
      settings: true,
      label: 'Content',
    },
    tokens: {
      settings: true,
      label: 'Tokens',
    },
    feedback: {
      settings: true,
      label: 'Feedback',
    },
    spellCheck: {
      label: 'Spellcheck',
      settings: false,
      enabled: true,
    },
    partialScoring: {
      settings: false,
      label: 'Allow Partial Scoring',
    },
    mode: {
      settings: true,
      label: 'Mode',
    },
    minTokens: 2,
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
