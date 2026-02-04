export default {
  demos: [
    {
      id: 'default',
      title: 'Default Demo',
      description: 'Basic matrix configuration',
      tags: ['matrix', 'default'],
      model: {
        id: '1',
        element: 'matrix',
        labelType: 'agreement',
        rowLabels: ['I\'m interested in politics.', 'I\'m interested in economics.'],
        columnLabels: ['Disagree', 'Unsure', 'Agree'],
        matrixValues: {},
        prompt: 'How interested are you in the following domains?',
      },
      session: {
        id: '1',
        element: 'matrix',
      }
    }
  ]
};
