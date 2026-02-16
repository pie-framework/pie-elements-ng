export default {
  demos: [
    {
      id: 'math-equations',
      title: 'Math Equations Classification',
      description: 'Categorize equations as true or false with LaTeX math rendering',
      tags: ['math', 'equations', 'true-false', 'latex'],
      model: {
        id: '1',
        element: 'categorize',
        prompt: '<p>Drag each equation to the correct category: True or False.</p>',
        promptEnabled: true,
        categories: [
          {
            id: '0',
            label: '<strong>True</strong>'
          },
          {
            id: '1',
            label: '<strong>False</strong>'
          }
        ],
        categoriesPerRow: 2,
        choicesPosition: 'above',
        choicesLabel: 'Equations',
        choices: [
          {
            id: '0',
            content: '\\(6+3=9-2\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '1',
            content: '\\(10-4=9-5\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '2',
            content: '\\(17-9=9+17\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '3',
            content: '\\(11+9=10+10\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '4',
            content: '\\(14-4=5+5\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '5',
            content: '\\(7+8=3\\times 5\\)',
            categoryCount: 1,
            correctResponseCount: 1
          }
        ],
        correctResponse: [
          {
            category: '0',
            choices: ['3', '4', '5']
          },
          {
            category: '1',
            choices: ['0', '1', '2']
          }
        ],
        lockChoiceOrder: true,
        allowMultiplePlacementsEnabled: 'No',
        maxChoicesPerCategory: 0,
        allowAlternateEnabled: false,
        partialScoring: true,
        minRowHeight: '120px',
        fontSizeFactor: 1.2
      },
      session: {
        id: '1',
        element: 'categorize',
        answers: []
      }
    },
    {
      id: 'geometry-shapes',
      title: 'Geometric Shapes by Dimensions',
      description: 'Sort shapes with math formulas into 2D and 3D categories',
      tags: ['math', 'geometry', 'shapes', '2d', '3d'],
      model: {
        id: '2',
        element: 'categorize',
        prompt: '<p>Classify each shape as 2D (two-dimensional) or 3D (three-dimensional) based on their formulas.</p>',
        promptEnabled: true,
        categories: [
          {
            id: '0',
            label: '<div style="text-align:center;"><strong>2D Shapes</strong><br/><small>Area formulas</small></div>'
          },
          {
            id: '1',
            label: '<div style="text-align:center;"><strong>3D Shapes</strong><br/><small>Volume formulas</small></div>'
          }
        ],
        categoriesPerRow: 2,
        choicesPosition: 'below',
        choicesLabel: 'Shape Formulas',
        choices: [
          {
            id: '0',
            content: 'Circle: \\(A = \\pi r^2\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '1',
            content: 'Sphere: \\(V = \\frac{4}{3}\\pi r^3\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '2',
            content: 'Rectangle: \\(A = l \\times w\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '3',
            content: 'Cylinder: \\(V = \\pi r^2 h\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '4',
            content: 'Triangle: \\(A = \\frac{1}{2}bh\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '5',
            content: 'Cube: \\(V = s^3\\)',
            categoryCount: 1,
            correctResponseCount: 1
          }
        ],
        correctResponse: [
          {
            category: '0',
            choices: ['0', '2', '4']
          },
          {
            category: '1',
            choices: ['1', '3', '5']
          }
        ],
        lockChoiceOrder: false,
        allowMultiplePlacementsEnabled: 'No',
        maxChoicesPerCategory: 0,
        allowAlternateEnabled: false,
        partialScoring: true,
        minRowHeight: '140px',
        fontSizeFactor: 1.1
      },
      session: {
        id: '2',
        element: 'categorize',
        answers: []
      }
    },
    {
      id: 'algebra-operations',
      title: 'Algebraic Operations with Alternates',
      description: 'Categorize expressions by operation type with multiple correct arrangements',
      tags: ['math', 'algebra', 'operations', 'alternates', 'advanced'],
      model: {
        id: '3',
        element: 'categorize',
        prompt: '<p>Sort these algebraic expressions by their primary operation. Note: Some expressions may fit multiple categories.</p>',
        promptEnabled: true,
        categories: [
          {
            id: '0',
            label: '<strong>Addition/Subtraction</strong>'
          },
          {
            id: '1',
            label: '<strong>Multiplication/Division</strong>'
          },
          {
            id: '2',
            label: '<strong>Exponents</strong>'
          }
        ],
        categoriesPerRow: 3,
        choicesPosition: 'above',
        choicesLabel: '',
        choices: [
          {
            id: '0',
            content: '\\(2x + 5\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '1',
            content: '\\(3x^2\\)',
            categoryCount: 1,
            correctResponseCount: 2
          },
          {
            id: '2',
            content: '\\(\\frac{x}{4}\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '3',
            content: '\\(x^3 + 1\\)',
            categoryCount: 1,
            correctResponseCount: 1
          },
          {
            id: '4',
            content: '\\((x+2)(x-1)\\)',
            categoryCount: 1,
            correctResponseCount: 1
          }
        ],
        correctResponse: [
          {
            category: '0',
            choices: ['0'],
            alternateResponses: [
              ['0', '3']
            ]
          },
          {
            category: '1',
            choices: ['2', '4'],
            alternateResponses: [
              ['1', '2', '4']
            ]
          },
          {
            category: '2',
            choices: ['1', '3'],
            alternateResponses: [
              ['3']
            ]
          }
        ],
        lockChoiceOrder: true,
        allowMultiplePlacementsEnabled: 'No',
        maxChoicesPerCategory: 0,
        allowAlternateEnabled: true,
        partialScoring: false,
        minRowHeight: '100px',
        fontSizeFactor: 1.15
      },
      session: {
        id: '3',
        element: 'categorize',
        answers: []
      }
    },
    {
      id: 'calculus-concepts',
      title: 'Calculus: Derivatives vs Integrals',
      description: 'Four-category grid with calculus formulas and multiple placements',
      tags: ['math', 'calculus', 'derivatives', 'integrals', 'grid'],
      model: {
        id: '4',
        element: 'categorize',
        prompt: '<p>Categorize these calculus formulas by type. Some formulas can be used multiple times.</p>',
        promptEnabled: true,
        categories: [
          {
            id: '0',
            label: '<strong>Power Rule<br/>(Derivatives)</strong>'
          },
          {
            id: '1',
            label: '<strong>Power Rule<br/>(Integrals)</strong>'
          },
          {
            id: '2',
            label: '<strong>Trigonometric<br/>(Derivatives)</strong>'
          },
          {
            id: '3',
            label: '<strong>Trigonometric<br/>(Integrals)</strong>'
          }
        ],
        categoriesPerRow: 2,
        choicesPosition: 'below',
        choicesLabel: 'Calculus Formulas',
        choices: [
          {
            id: '0',
            content: '\\(\\frac{d}{dx}[x^n] = nx^{n-1}\\)',
            categoryCount: 0,
            correctResponseCount: 1
          },
          {
            id: '1',
            content: '\\(\\int x^n dx = \\frac{x^{n+1}}{n+1} + C\\)',
            categoryCount: 0,
            correctResponseCount: 1
          },
          {
            id: '2',
            content: '\\(\\frac{d}{dx}[\\sin x] = \\cos x\\)',
            categoryCount: 0,
            correctResponseCount: 1
          },
          {
            id: '3',
            content: '\\(\\int \\cos x dx = \\sin x + C\\)',
            categoryCount: 0,
            correctResponseCount: 1
          },
          {
            id: '4',
            content: '\\(\\frac{d}{dx}[\\cos x] = -\\sin x\\)',
            categoryCount: 0,
            correctResponseCount: 1
          },
          {
            id: '5',
            content: '\\(\\int \\sin x dx = -\\cos x + C\\)',
            categoryCount: 0,
            correctResponseCount: 1
          }
        ],
        correctResponse: [
          {
            category: '0',
            choices: ['0']
          },
          {
            category: '1',
            choices: ['1']
          },
          {
            category: '2',
            choices: ['2', '4']
          },
          {
            category: '3',
            choices: ['3', '5']
          }
        ],
        lockChoiceOrder: true,
        allowMultiplePlacementsEnabled: 'Yes',
        maxChoicesPerCategory: 0,
        allowAlternateEnabled: false,
        partialScoring: true,
        minRowHeight: '110px',
        fontSizeFactor: 1.1
      },
      session: {
        id: '4',
        element: 'categorize',
        answers: []
      }
    }
  ]
};