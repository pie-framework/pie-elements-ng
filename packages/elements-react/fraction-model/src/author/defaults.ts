// @ts-nocheck
/**
 * @synced-from pie-elements/packages/fraction-model/configure/src/defaults.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export default {
  model: {
    correctResponse: [],
    title: '',
    prompt: '',
    modelTypeSelected: 'bar',
    maxModelSelected: 1,
    partsPerModel: 5,
    allowedStudentConfig: false,
    showGraphLabels: false,
  },
  configuration: {
    baseInputConfiguration: {
      h3: { disabled: true },
      audio: { disabled: false },
      video: { disabled: false },
      image: { disabled: false },
      textAlign: { disabled: true },
      showParagraphs: { disabled: false },
      separateParagraphs: { disabled: true },
    },
    title: {
      label: 'Title',
      settings: true,
      enabled: true,
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
    prompt: {
      label: 'Question',
      settings: true,
      enabled: true,
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
    modelOptions: {
      maxOfModel: {
        min: 1,
        max: 9,
        default: 1,
      },
      partsPerModel: {
        min: 1,
        max: 9,
        default: 5,
      },
      modelTypeChoices: [
        { value: 'bar', label: 'Bar' },
        { value: 'pie', label: 'Pie' },
      ],
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
    spellCheck: {
      label: 'Spellcheck',
      settings: false,
      enabled: true,
    },
    settingsPanelDisabled: true,
  },
};
