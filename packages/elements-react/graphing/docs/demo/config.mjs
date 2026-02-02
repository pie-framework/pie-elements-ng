export default {
  demos: [
    {
      id: 'linear-function',
      title: 'Linear Function - Slope Intercept',
      description: 'Plot points and draw a line through them to represent y = 2x + 1',
      tags: ['algebra', 'linear', 'line', 'point', 'slope'],
      model: {
        id: '1',
        element: 'graphing',
        prompt: '<p>Plot the line for the equation <math><mi>y</mi><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>1</mn></math></p><p>Use points to mark where the line crosses each axis.</p>',
        promptEnabled: true,
        title: 'Graphing Linear Functions',
        titleEnabled: true,
        toolbarTools: ['point', 'line', 'segment'],
        defaultTool: 'point',
        domain: {
          min: -5,
          max: 5,
          step: 1,
          labelStep: 1,
          axisLabel: 'x'
        },
        range: {
          min: -5,
          max: 5,
          step: 1,
          labelStep: 1,
          axisLabel: 'y'
        },
        graph: {
          width: 480,
          height: 480
        },
        arrows: {
          left: true,
          right: true,
          up: true,
          down: true
        },
        coordinatesOnHover: true,
        answers: {
          correctAnswer: {
            name: 'Correct Answer',
            marks: [
              {
                type: 'point',
                x: 0,
                y: 1,
                label: 'y-intercept',
                showLabel: true
              },
              {
                type: 'point',
                x: 2,
                y: 5
              },
              {
                type: 'line',
                from: { x: -2, y: -3 },
                to: { x: 2, y: 5 }
              }
            ]
          }
        },
        backgroundMarks: [],
        rationale: '<p>The line y = 2x + 1 has a slope of 2 and y-intercept of 1. It crosses the y-axis at (0, 1) and passes through points like (2, 5).</p>',
        rationaleEnabled: true,
        scoringType: 'partial scoring'
      },
      session: { answer: [] }
    },
    {
      id: 'parabola-vertex',
      title: 'Quadratic Function - Parabola',
      description: 'Graph a parabola by defining its vertex and a point on the curve',
      tags: ['algebra', 'quadratic', 'parabola', 'vertex'],
      model: {
        id: '2',
        element: 'graphing',
        prompt: '<p>Graph the parabola with vertex at (1, -4) that passes through the point (3, 0).</p><p><strong>Hint:</strong> Click the vertex first (root), then click a point on the parabola (edge).</p>',
        promptEnabled: true,
        title: 'Parabola Graphing',
        titleEnabled: true,
        toolbarTools: ['parabola', 'point', 'label'],
        defaultTool: 'parabola',
        domain: {
          min: -5,
          max: 7,
          step: 1,
          labelStep: 1,
          axisLabel: 'x'
        },
        range: {
          min: -5,
          max: 5,
          step: 1,
          labelStep: 1,
          axisLabel: 'y'
        },
        graph: {
          width: 500,
          height: 500
        },
        arrows: {
          left: true,
          right: true,
          up: true,
          down: false
        },
        coordinatesOnHover: true,
        answers: {
          correctAnswer: {
            name: 'Correct Answer',
            marks: [
              {
                type: 'parabola',
                root: { x: 1, y: -4 },
                edge: { x: 3, y: 0 }
              },
              {
                type: 'point',
                x: 1,
                y: -4,
                label: 'Vertex',
                showLabel: true
              }
            ]
          }
        },
        backgroundMarks: [
          {
            type: 'point',
            x: 3,
            y: 0,
            label: 'Point on curve',
            showLabel: false
          }
        ],
        rationale: '<p>The parabola has its vertex (minimum point) at (1, -4) and opens upward. Using the given point (3, 0), we can determine the exact shape of the parabola.</p>',
        rationaleEnabled: true,
        scoringType: 'partial scoring'
      },
      session: { answer: [] }
    },
    {
      id: 'sine-wave-trigonometry',
      title: 'Sine Wave - Trigonometric Function',
      description: 'Create a sine wave with specific amplitude and frequency',
      tags: ['trigonometry', 'sine', 'wave', 'periodic'],
      model: {
        id: '3',
        element: 'graphing',
        prompt: '<p>Graph a sine wave with amplitude 2 and period <math><mn>2</mn><mi>π</mi></math>.</p><p>The function is <math><mi>f</mi><mo>(</mo><mi>x</mi><mo>)</mo><mo>=</mo><mn>2</mn><mo>sin</mo><mo>(</mo><mi>x</mi><mo>)</mo></math></p>',
        promptEnabled: true,
        title: 'Sine Wave Graphing',
        titleEnabled: true,
        toolbarTools: ['sine', 'point', 'label'],
        defaultTool: 'sine',
        domain: {
          min: -8,
          max: 8,
          step: 1,
          labelStep: 2,
          axisLabel: 'x'
        },
        range: {
          min: -3,
          max: 3,
          step: 1,
          labelStep: 1,
          axisLabel: 'y'
        },
        graph: {
          width: 600,
          height: 400
        },
        arrows: {
          left: true,
          right: true,
          up: true,
          down: true
        },
        coordinatesOnHover: true,
        labels: {
          bottom: 'Angle (radians)',
          left: 'Amplitude',
          top: '',
          right: ''
        },
        labelsEnabled: true,
        answers: {
          correctAnswer: {
            name: 'Correct Answer',
            marks: [
              {
                type: 'sine',
                root: { x: 0, y: 0 },
                edge: { x: 1.57, y: 2 }
              }
            ]
          },
          alternate1: {
            name: 'Alternate (phase shifted)',
            marks: [
              {
                type: 'sine',
                root: { x: 3.14, y: 0 },
                edge: { x: 4.71, y: 2 }
              }
            ]
          }
        },
        backgroundMarks: [],
        rationale: '<p>A sine wave with amplitude 2 oscillates between -2 and 2. The period of 2π means one complete cycle occurs every 2π units along the x-axis. The root is at the origin (0,0) and the edge defines the amplitude at π/2 (approximately 1.57).</p>',
        rationaleEnabled: true,
        teacherInstructions: '<p>Students should understand that the root point marks where the sine wave crosses the x-axis, and the edge point defines both the amplitude and frequency of the wave.</p>',
        teacherInstructionsEnabled: true,
        scoringType: 'partial scoring'
      },
      session: { answer: [] }
    }
  ]
};