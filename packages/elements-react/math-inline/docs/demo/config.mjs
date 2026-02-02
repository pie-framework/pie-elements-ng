export default {
  demos: [
    {
      id: 'simple-arithmetic',
      title: 'Simple Arithmetic',
      description: 'Basic arithmetic with numeric keyboard and literal validation',
      tags: ['simple', 'arithmetic', 'basic', 'integers'],
      model: {
        id: '1',
        element: 'math-inline',
        responseType: 'Simple',
        equationEditor: 'integers',
        toolbarEditorPosition: 'bottom',
        promptEnabled: true,
        prompt: '<p><strong>Calculate the following:</strong> What is 15 × 8?</p><p>Enter your answer below.</p>',
        expression: '',
        responses: [
          {
            id: '1',
            answer: '120',
            validation: 'literal',
            allowTrailingZeros: false,
            ignoreOrder: false,
            alternates: {}
          }
        ],
        feedbackEnabled: true,
        feedback: {
          correct: { 
            type: 'default',
            default: 'Excellent! You calculated correctly.'
          },
          incorrect: { 
            type: 'default',
            default: 'Not quite. Try multiplying 15 by 8 again.'
          },
          partial: { 
            type: 'none',
            default: ''
          }
        },
        rationaleEnabled: true,
        rationale: '<p>To multiply 15 × 8, you can break it down: (10 × 8) + (5 × 8) = 80 + 40 = 120</p>',
        teacherInstructionsEnabled: true,
        teacherInstructions: '<p>This tests basic multiplication skills. Students should be able to compute this mentally or using the standard algorithm.</p>',
        rubricEnabled: false
      },
      session: { id: '1', response: '' }
    },
    {
      id: 'advanced-algebraic-equation',
      title: 'Multi-Part Algebraic Equation',
      description: 'Advanced multi-field input for completing an algebraic equation with multiple response areas',
      tags: ['advanced', 'algebra', 'multi-part', 'equation'],
      model: {
        id: '2',
        element: 'math-inline',
        responseType: 'Advanced Multi',
        equationEditor: 8,
        toolbarEditorPosition: 'bottom',
        promptEnabled: true,
        prompt: '<p><strong>Complete the quadratic equation:</strong></p><p>Fill in the blanks to express the quadratic formula for solving ax² + bx + c = 0</p>',
        expression: 'x=\\frac{{{response}}\\pm\\sqrt{{{response}}}}{{{response}}}',
        responses: [
          {
            id: '1',
            answer: 'x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}',
            validation: 'symbolic',
            allowTrailingZeros: false,
            ignoreOrder: false,
            alternates: {}
          }
        ],
        feedbackEnabled: true,
        feedback: {
          correct: { 
            type: 'default',
            default: 'Perfect! You correctly completed the quadratic formula.'
          },
          incorrect: { 
            type: 'default',
            default: 'Incorrect. Review the quadratic formula structure.'
          },
          partial: { 
            type: 'none',
            default: ''
          }
        },
        rationaleEnabled: true,
        rationale: '<p>The quadratic formula is: x = (-b ± √(b² - 4ac)) / (2a)</p><p>This formula gives the solutions for any quadratic equation ax² + bx + c = 0.</p>',
        teacherInstructionsEnabled: true,
        teacherInstructions: '<p>Students should know the quadratic formula from memory. This tests their ability to correctly input mathematical expressions with multiple parts.</p>',
        rubricEnabled: false
      },
      session: { 
        id: '2',
        answers: {},
        completeAnswer: ''
      }
    },
    {
      id: 'fractions-with-alternates',
      title: 'Fractions with Multiple Valid Answers',
      description: 'Fraction input with symbolic validation accepting equivalent forms',
      tags: ['fractions', 'symbolic', 'alternates', 'equivalence'],
      model: {
        id: '3',
        element: 'math-inline',
        responseType: 'Simple',
        equationEditor: 'fractions',
        toolbarEditorPosition: 'bottom',
        promptEnabled: true,
        prompt: '<p><strong>Simplify the expression:</strong> What is 3/4 + 1/4?</p><p>Enter your answer as a fraction or whole number.</p>',
        expression: '',
        responses: [
          {
            id: '1',
            answer: '1',
            validation: 'symbolic',
            allowTrailingZeros: false,
            ignoreOrder: false,
            alternates: {
              'alt1': '\\frac{4}{4}',
              'alt2': '\\frac{8}{8}',
              'alt3': '\\frac{2}{2}'
            }
          }
        ],
        feedbackEnabled: true,
        feedback: {
          correct: { 
            type: 'default',
            default: 'Correct! 3/4 + 1/4 = 1 (or 4/4, which simplifies to 1).'
          },
          incorrect: { 
            type: 'default',
            default: 'Not quite. Remember to add the numerators when denominators are the same.'
          },
          partial: { 
            type: 'none',
            default: ''
          }
        },
        rationaleEnabled: true,
        rationale: '<p>When adding fractions with the same denominator, add the numerators: 3/4 + 1/4 = (3+1)/4 = 4/4 = 1</p><p>Symbolic validation accepts any equivalent form like 1, 4/4, 8/8, etc.</p>',
        teacherInstructionsEnabled: true,
        teacherInstructions: '<p>This tests fraction addition with like denominators. Symbolic validation accepts equivalent forms, so students can enter 1, 4/4, or other equivalent fractions.</p>',
        rubricEnabled: false
      },
      session: { id: '3', response: '' }
    },
    {
      id: 'geometry-custom-keys',
      title: 'Geometry with Custom Symbols',
      description: 'Geometric calculation with custom keyboard keys for special notation',
      tags: ['geometry', 'custom-keys', 'decimals', 'pi'],
      model: {
        id: '4',
        element: 'math-inline',
        responseType: 'Simple',
        equationEditor: 'geometry',
        customKeys: ['\\pi', '\\theta', '\\angle'],
        toolbarEditorPosition: 'bottom',
        promptEnabled: true,
        prompt: '<p><strong>Circle Area:</strong> A circle has a radius of 5 cm.</p><p>Write the formula for its area using π (you can type "pi" or use the π button).</p>',
        expression: '',
        responses: [
          {
            id: '1',
            answer: '25\\pi',
            validation: 'symbolic',
            allowTrailingZeros: false,
            ignoreOrder: false,
            alternates: {
              'alt1': '\\pi\\cdot25',
              'alt2': '\\pi\\times25',
              'alt3': '5^2\\pi',
              'alt4': '\\pi r^2'
            }
          }
        ],
        feedbackEnabled: true,
        feedback: {
          correct: { 
            type: 'default',
            default: 'Excellent! The area is 25π cm² (or approximately 78.54 cm²).'
          },
          incorrect: { 
            type: 'default',
            default: 'Not quite. Remember the formula A = πr². With r = 5, what do you get?'
          },
          partial: { 
            type: 'none',
            default: ''
          }
        },
        rationaleEnabled: true,
        rationale: '<p>The area of a circle is A = πr²</p><p>With radius r = 5 cm: A = π(5)² = π(25) = 25π cm²</p><p>This is approximately 78.54 cm² when using π ≈ 3.14159.</p>',
        teacherInstructionsEnabled: true,
        teacherInstructions: '<p>Students should apply the circle area formula. The custom keyboard includes π, θ, and angle symbols. Accept symbolic expressions with π or numerical approximations.</p>',
        rubricEnabled: false
      },
      session: { id: '4', response: '' }
    }
  ]
};