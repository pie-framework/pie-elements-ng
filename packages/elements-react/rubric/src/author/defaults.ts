// @ts-nocheck
/**
 * @synced-from pie-elements/packages/rubric/configure/src/defaults.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

export default {
  model: {
    points: ['', '', '', ''],
    sampleAnswers: [null, null, null, null],
    maxPoints: 3,
    excludeZero: false,
    excludeZeroEnabled: true,
    maxPointsEnabled: true,
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
    rubriclessInstruction: {
      inputConfiguration: {
        audio: { disabled: false },
        video: { disabled: false },
        image: { disabled: false },
      },
    },
    showExcludeZero: {
      settings: true,
      label: 'Ability to exclude zero',
    },
    showMaxPoint: {
      settings: true,
      label: 'Show max points dropdown',
    },
    settingsPanelDisabled: false,
    // width: '500px'
    mathMlOptions: {
      mmlOutput: false,
      mmlEditing: false,
    },
    maxMaxPoints: 9,
  },
};
