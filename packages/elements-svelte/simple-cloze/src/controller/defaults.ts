import type { SimpleClozeConfiguration, SimpleClozeModel } from '../types.js';

export default {
  model: {
    prompt: '<p>Enter your answer:</p>',
    promptEnabled: true,
    correctAnswer: '',
    teacherInstructionsEnabled: true,
  },
  configuration: {
    prompt: {
      label: 'Prompt',
      settings: true,
    },
    teacherInstructions: {
      label: 'Teacher Instructions',
      settings: true,
    },
    settingsPanelDisabled: false,
  },
} satisfies {
  model: Omit<SimpleClozeModel, 'id' | 'element'>;
  configuration: SimpleClozeConfiguration;
};
