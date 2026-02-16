export default {
  demos: [
    {
      id: 'basic-checkbox',
      title: 'Basic Multi-Select',
      description: 'Standard checkbox mode with multiple correct answers',
      tags: ['checkbox', 'multi-select', 'basic', 'feedback'],
      model: {
        id: '1',
        element: 'multiple-choice',
        choiceMode: 'checkbox',
        choicePrefix: 'letters',
        choices: [
          {
            correct: true,
            value: 'photosynthesis',
            label: 'Photosynthesis converts light energy into chemical energy',
            feedback: {
              type: 'default',
              value:
                'Correct! Photosynthesis is the process by which plants convert sunlight into glucose.',
            },
            rationale:
              'Photosynthesis is performed by plants, algae, and some bacteria. It uses light energy to convert carbon dioxide and water into glucose and oxygen.',
          },
          {
            correct: false,
            value: 'mitochondria',
            label: 'Mitochondria are found only in plant cells',
            feedback: {
              type: 'default',
              value: 'Incorrect. Mitochondria are found in both plant and animal cells.',
            },
            rationale:
              'Mitochondria are the "powerhouses" of the cell and are present in nearly all eukaryotic cells, including both plants and animals.',
          },
          {
            correct: true,
            value: 'cellular-respiration',
            label: 'Cellular respiration breaks down glucose to produce ATP',
            feedback: {
              type: 'default',
              value: 'Correct! Cellular respiration is how cells extract energy from glucose.',
            },
            rationale:
              'Cellular respiration occurs in the mitochondria and converts glucose and oxygen into ATP (energy), carbon dioxide, and water. This is essentially the reverse of photosynthesis.',
          },
          {
            correct: false,
            value: 'chloroplasts',
            label: 'Chloroplasts are the site of cellular respiration',
            feedback: {
              type: 'default',
              value:
                'Incorrect. Chloroplasts are where photosynthesis occurs, not cellular respiration.',
            },
            rationale:
              'Chloroplasts contain chlorophyll and are responsible for photosynthesis in plant cells. Cellular respiration takes place in the mitochondria.',
          },
        ],
        extraCSSRules: {
          names: ['red', 'blue'],
          rules:
            '\n      .red {\n        color: red !important;\n      }\n\n      .blue {\n        color: blue !important;\n      }\n    ',
        },
        prompt:
          '<p><strong>Biology Question:</strong> Select all true statements about cellular processes.</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
        rubricEnabled: false,
      },
      session: { value: [] },
    },
    {
      id: 'radio-simple',
      title: 'Single Select (Radio)',
      description: 'Radio button mode with single correct answer',
      tags: ['radio', 'single-select', 'basic'],
      model: {
        id: '2',
        element: 'multiple-choice',
        choiceMode: 'radio',
        choicePrefix: 'letters',
        choices: [
          {
            correct: false,
            value: 'mercury',
            label: 'Mercury',
            feedback: { type: 'default', value: 'Incorrect. Mercury is the smallest planet.' },
          },
          {
            correct: true,
            value: 'jupiter',
            label: 'Jupiter',
            feedback: { type: 'default', value: 'Correct! Jupiter is the largest planet.' },
          },
          {
            correct: false,
            value: 'earth',
            label: 'Earth',
            feedback: { type: 'default', value: 'Incorrect. Earth is the third planet.' },
          },
          {
            correct: false,
            value: 'mars',
            label: 'Mars',
            feedback: { type: 'default', value: 'Incorrect. Mars is smaller than Earth.' },
          },
        ],
        prompt: '<p>Which is the largest planet in our solar system?</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
      },
      session: { value: [] },
    },
    {
      id: 'no-prefix',
      title: 'No Choice Prefix',
      description: 'Choices without letter/number prefixes',
      tags: ['checkbox', 'no-prefix'],
      model: {
        id: '3',
        element: 'multiple-choice',
        choiceMode: 'checkbox',
        choicePrefix: 'none',
        choices: [
          { correct: true, value: '1', label: 'Apple' },
          { correct: false, value: '2', label: 'Carrot' },
          { correct: true, value: '3', label: 'Banana' },
          { correct: false, value: '4', label: 'Broccoli' },
          { correct: true, value: '5', label: 'Orange' },
        ],
        prompt: '<p>Select all fruits from the list below:</p>',
        promptEnabled: true,
      },
      session: { value: [] },
    },
    {
      id: 'numbers-prefix',
      title: 'Number Prefix',
      description: 'Choices with number prefixes instead of letters',
      tags: ['radio', 'numbers', 'prefix'],
      model: {
        id: '4',
        element: 'multiple-choice',
        choiceMode: 'radio',
        choicePrefix: 'numbers',
        choices: [
          { correct: false, value: '1', label: 'France' },
          { correct: true, value: '2', label: 'Canada' },
          { correct: false, value: '3', label: 'Germany' },
          { correct: false, value: '4', label: 'Italy' },
        ],
        prompt: '<p>Which country has the longest coastline in the world?</p>',
        promptEnabled: true,
      },
      session: { value: [] },
    },
    {
      id: 'math-algebra-quadratic',
      title: 'Math: Quadratic Equation',
      description: 'Algebra question with LaTeX notation testing quadratic formula knowledge',
      tags: ['math', 'algebra', 'latex', 'radio'],
      model: {
        id: '5',
        element: 'multiple-choice',
        choiceMode: 'radio',
        choicePrefix: 'letters',
        choices: [
          {
            correct: false,
            value: 'opt1',
            label: '\\(x = \\frac{-b \\pm \\sqrt{b^2+4ac}}{2a}\\)',
            feedback: {
              type: 'default',
              value: 'Incorrect. The discriminant should be \\(b^2 - 4ac\\), not \\(b^2 + 4ac\\).',
            },
            rationale:
              'The quadratic formula uses subtraction in the discriminant. The sign error would give incorrect solutions.',
          },
          {
            correct: true,
            value: 'opt2',
            label: '\\(x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\)',
            feedback: {
              type: 'default',
              value:
                'Correct! This is the quadratic formula for solving equations of the form \\(ax^2 + bx + c = 0\\).',
            },
            rationale:
              'The quadratic formula \\(x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}\\) is derived by completing the square on the general quadratic equation. The discriminant \\(b^2-4ac\\) determines the nature and number of solutions.',
          },
          {
            correct: false,
            value: 'opt3',
            label: '\\(x = \\frac{b \\pm \\sqrt{b^2-4ac}}{2a}\\)',
            feedback: {
              type: 'default',
              value: 'Incorrect. The numerator should start with \\(-b\\), not \\(b\\).',
            },
            rationale:
              'The sign of \\(b\\) is crucial. The formula must have \\(-b\\) in the numerator to correctly solve the equation.',
          },
          {
            correct: false,
            value: 'opt4',
            label: '\\(x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{a}\\)',
            feedback: {
              type: 'default',
              value: 'Incorrect. The denominator should be \\(2a\\), not just \\(a\\).',
            },
            rationale:
              'The factor of 2 in the denominator comes from the process of completing the square. Without it, solutions would be doubled.',
          },
        ],
        prompt:
          '<p><strong>Algebra Question:</strong> Which of the following is the correct quadratic formula for solving \\(ax^2 + bx + c = 0\\)?</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
        rubricEnabled: false,
      },
      session: { value: [] },
    },
    {
      id: 'math-geometry-triangles',
      title: 'Math: Triangle Properties',
      description: 'Geometry question with LaTeX testing understanding of triangle theorems',
      tags: ['math', 'geometry', 'latex', 'checkbox'],
      model: {
        id: '6',
        element: 'multiple-choice',
        choiceMode: 'checkbox',
        choicePrefix: 'letters',
        choices: [
          {
            correct: true,
            value: 'stmt1',
            label: 'For a right triangle with legs \\(a\\) and \\(b\\) and hypotenuse \\(c\\): \\(a^2 + b^2 = c^2\\)',
            feedback: {
              type: 'default',
              value: 'Correct! This is the Pythagorean theorem.',
            },
            rationale:
              'The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of the squares of the other two sides. This is one of the most fundamental theorems in geometry.',
          },
          {
            correct: false,
            value: 'stmt2',
            label: 'The sum of angles in any triangle is \\(360^\\circ\\)',
            feedback: {
              type: 'default',
              value: 'Incorrect. The sum of angles in a triangle is \\(180^\\circ\\), not \\(360^\\circ\\).',
            },
            rationale:
              'The sum of interior angles in any triangle is always \\(180^\\circ\\). The value \\(360^\\circ\\) applies to quadrilaterals, not triangles.',
          },
          {
            correct: true,
            value: 'stmt3',
            label: 'The area of a triangle is \\(A = \\frac{1}{2}bh\\) where \\(b\\) is the base and \\(h\\) is the height',
            feedback: {
              type: 'default',
              value: 'Correct! This is the standard formula for triangle area.',
            },
            rationale:
              'The area of any triangle can be calculated using \\(A = \\frac{1}{2}bh\\). This formula works because a triangle is half of a parallelogram with the same base and height.',
          },
          {
            correct: false,
            value: 'stmt4',
            label: 'In an equilateral triangle with side length \\(s\\), the area is \\(A = s^2\\)',
            feedback: {
              type: 'default',
              value: 'Incorrect. The area formula for an equilateral triangle is \\(A = \\frac{\\sqrt{3}}{4}s^2\\).',
            },
            rationale:
              'The correct formula for an equilateral triangle is \\(A = \\frac{\\sqrt{3}}{4}s^2\\). The formula \\(A = s^2\\) would give the area of a square, not a triangle.',
          },
          {
            correct: true,
            value: 'stmt5',
            label:
              'For any triangle with sides \\(a\\), \\(b\\), and \\(c\\): the triangle inequality theorem states \\(a + b > c\\)',
            feedback: {
              type: 'default',
              value: 'Correct! This is the triangle inequality theorem.',
            },
            rationale:
              'The triangle inequality theorem states that the sum of any two sides of a triangle must be greater than the third side. This must be true for all three combinations of sides: \\(a+b>c\\), \\(b+c>a\\), and \\(a+c>b\\).',
          },
        ],
        prompt:
          '<p><strong>Geometry Question:</strong> Select all true statements about triangles and their properties.</p>',
        promptEnabled: true,
        toolbarEditorPosition: 'bottom',
        rubricEnabled: false,
      },
      session: { value: [] },
    },
  ],
};
