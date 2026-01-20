type DemoOverride = {
  model?: unknown;
  session?: unknown;
};

export const demoOverrides: Record<string, DemoOverride> = {
  'multiple-choice': {
    model: {
      id: 'Q124',
      element: 'multiple-choice-element',
      prompt: 'What is the capital of France?',
      choicePrefix: 'letters',
      scoringType: 'auto',
      lockChoiceOrder: false,
      partialScoring: false,
      choices: [
        {
          value: 'A',
          label: 'London',
          correct: false,
        },
        {
          value: 'B',
          label: 'Paris',
          correct: true,
        },
        {
          value: 'C',
          label: 'Berlin',
          correct: false,
        },
        {
          value: 'D',
          label: 'Rome',
          correct: false,
        },
      ],
      choiceMode: 'radio',
      promptEnabled: true,
      rationaleEnabled: true,
      teacherInstructionsEnabled: true,
      studentInstructionsEnabled: true,
    },
  },
};
