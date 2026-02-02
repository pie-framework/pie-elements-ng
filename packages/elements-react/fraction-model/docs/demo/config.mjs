export default {
  demos: [
  {
    id: 'simple-bar-halves',
    title: 'Simple Bar Model - Halves',
    description: 'Basic bar model showing 1/2 using a single bar divided into 2 parts',
    tags: ['bar', 'halves', 'basic', 'simple-fraction'],
    model: {
      id: '1',
      element: 'fraction-model',
      title: 'Understanding Halves',
      prompt: '<p>Shade the model to show <strong>1/2</strong> (one half).</p>',
      modelTypeSelected: 'bar',
      maxModelSelected: 1,
      partsPerModel: 2,
      allowedStudentConfig: false,
      showGraphLabels: false,
      correctResponse: [
        { id: 1, value: 1 }
      ]
    },
    session: {
      id: '1',
      element: 'fraction-model',
      answers: {
        response: []
      }
    }
  },
  {
    id: 'pie-improper-fraction',
    title: 'Pie Model - Improper Fraction',
    description: 'Multiple pie charts showing 7/4 (one and three-quarters)',
    tags: ['pie', 'improper-fraction', 'multiple-models', 'advanced'],
    model: {
      id: '2',
      element: 'fraction-model',
      title: 'Representing Improper Fractions',
      prompt: '<p>Shade the pie models to represent <strong>7/4</strong> (seven fourths).</p><p><em>Hint: This is more than one whole!</em></p>',
      modelTypeSelected: 'pie',
      maxModelSelected: 2,
      partsPerModel: 4,
      allowedStudentConfig: false,
      showGraphLabels: true,
      correctResponse: [
        { id: 1, value: 4 },
        { id: 2, value: 3 }
      ]
    },
    session: {
      id: '2',
      element: 'fraction-model',
      answers: {
        response: []
      }
    }
  },
  {
    id: 'student-config-thirds',
    title: 'Student Configuration - Thirds',
    description: 'Student can choose number of models and parts to represent 2/3',
    tags: ['bar', 'thirds', 'student-config', 'flexible'],
    model: {
      id: '3',
      element: 'fraction-model',
      title: 'Flexible Fraction Modeling',
      prompt: '<p>Choose your own number of models and parts per model, then shade to show <strong>2/3</strong> (two thirds).</p>',
      modelTypeSelected: 'bar',
      maxModelSelected: 3,
      partsPerModel: 3,
      allowedStudentConfig: true,
      showGraphLabels: false,
      correctResponse: [
        { id: 1, value: 2 }
      ]
    },
    session: {
      id: '3',
      element: 'fraction-model',
      answers: {
        response: [],
        noOfModel: '',
        partsPerModel: ''
      }
    }
  }
]
};