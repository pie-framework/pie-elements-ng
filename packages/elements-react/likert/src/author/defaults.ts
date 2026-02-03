// @ts-nocheck
/**
 * @synced-from pie-elements/packages/likert/configure/src/defaults.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

/** NOTE: teacherInstructions, studentInstructions, rationale & scoringType
 * functionalities are not defined yet - the value for those can belong to
 * model or to configure
 */
export default {
  model: {
    choices: [],
    likertOrientation: 'horizontal',
    likertScale: 'likert3',
    likertType: 'agreement',
    prompt: '',
    promptEnabled: true,
    teacherInstructions: '',
    teacherInstructionsEnabled: true,
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
    prompt: {
      settings: true,
      label: 'Prompt',
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
      required: false,
    },
    settingsPanelDisabled: false,
    spellCheck: {
      label: 'Spellcheck',
      settings: false,
      enabled: true,
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
    likertChoice: {
      label: 'Choice',
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
  },
};
