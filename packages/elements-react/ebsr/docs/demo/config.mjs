export default {
  demos: [
    {
      id: 'default',
      title: 'Default Demo',
      description: 'Basic EBSR configuration',
      tags: ['ebsr', 'default'],
      model: {
        id: '1',
        element: 'ebsr',
        partA: {
          choiceMode: 'checkbox',
          choices: [
            {
              value: 'yellow',
              label: 'Yellow',
            },
            {
              value: 'green',
              label: 'Green',
            },
            {
              correct: true,
              value: 'blue',
              label: 'Blue',
            },
          ],
          choicePrefix: 'numbers',
          partialScoring: false,
          prompt: 'What color is the sky?',
          promptEnabled: true,
        },
        partB: {
          choiceMode: 'checkbox',
          choices: [
            {
              value: 'orange',
              label: 'Orange',
            },
            {
              correct: true,
              value: 'purple',
              label: 'Purple',
            },
            {
              value: 'pink',
              label: 'Pink',
            },
            {
              value: 'green',
              label: 'Green',
            },
          ],
          choicePrefix: 'numbers',
          partialScoring: false,
          prompt: 'What color do you get when you mix Red with your answer in Part 1?',
          promptEnabled: true,
        },
      },
      session: {
        id: '1',
        element: 'ebsr',
      }
    }
  ]
};
