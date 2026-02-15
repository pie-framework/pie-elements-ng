export default {
  demos: [
    {
      id: 'basic',
      title: 'Basic',
      description: 'Simple cloze (text entry) demo/template - Svelte 5 proof of concept',
      tags: ['simple-cloze', 'basic', 'svelte', 'demo', 'template'],
      model: {
        id: '1',
        element: 'simple-cloze',
        prompt: '<p><strong>Enter your answer:</strong></p><p>What is 2 + 2?</p>',
        correctAnswer: '4',
      },
      session: {
        id: '1',
        element: 'simple-cloze',
        response: '',
      },
    },
  ],
};
