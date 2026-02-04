export default {
  demos: [
    {
      id: 'default',
      title: 'Default Demo',
      description: 'Basic math inline configuration',
      tags: ['math-inline', 'default'],
      model: {
        id: '1',
        element: 'math-inline',
        equationEditor: 3,
        toolbarEditorPosition: 'bottom',
        prompt: '<p><strong>B.</strong> Find the value of the expression that you wrote in part A to find how much money the band members made.</p>\n\n<p>Use the on-screen keyboard to type your answer in the box below.</p>\n',
        expression: '${{response}}',
        responses: [
          {
            allowSpaces: true,
            answer: '$410',
            id: '1',
          },
        ],
        responseType: 'Advanced Multi',
        rubricEnabled: false,
      },
      session: {
        id: '1',
        element: 'math-inline',
      }
    }
  ]
};
