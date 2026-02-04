export default {
  demos: [
    {
      id: 'default',
      title: 'Default Demo',
      description: 'Basic rubric configuration',
      tags: ['rubric', 'default'],
      model: {
        id: '1',
        element: 'rubric',
        points: ['nothing right', 'a teeny bit right', 'mostly right', 'bingo'],
        sampleAnswers: [null, 'just right', 'not left', null],
        maxPoints: 3,
        excludeZero: false,
      },
      session: {
        id: '1',
        element: 'rubric',
      }
    }
  ]
};
