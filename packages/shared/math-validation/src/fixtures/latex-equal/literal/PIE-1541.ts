// With ignoreOrder, sorting changed some expressions, so a different answer could match (PIE-1541): a
// product with a fraction among its factors kept only the single symbols and numbers beside it, and a
// nested negation, quotient or power was merged into its parent.
const ignoreOrder = { literal: { ignoreOrder: true } };

export default {
  mode: 'literal',
  tests: [
    {
      opts: ignoreOrder,
      target: '(x+1)\\cdot\\frac{1}{x}',
      eq: ['\\frac{1}{x}\\cdot(x+1)'],
      ne: ['(x+2)\\cdot\\frac{1}{x}'],
    },
    {
      opts: ignoreOrder,
      target: '(x+1)^{2}\\cdot\\frac{1}{x}',
      eq: ['\\frac{1}{x}\\cdot(x+1)^{2}'],
      ne: ['(x+2)^{2}\\cdot\\frac{1}{x}'],
    },
    {
      opts: ignoreOrder,
      target: '-x',
      ne: ['-(-x)'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{a}{\\frac{b}{c}}',
      ne: ['\\frac{\\frac{b}{c}}{a}'],
    },
    {
      opts: ignoreOrder,
      target: '(3^{x})^{2}',
      ne: ['2^{3^{x}}'],
    },
  ],
};
