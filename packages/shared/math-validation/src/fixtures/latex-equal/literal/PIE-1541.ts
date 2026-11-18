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
    {
      // ignoreOrder only reorders, so a product of several fractions keeps its numerators and
      // denominators where they are
      opts: ignoreOrder,
      target: '\\frac{2}{3}\\cdot\\frac{4}{5}',
      eq: ['\\frac{4}{5}\\cdot\\frac{2}{3}'],
      ne: ['\\frac{4}{3}\\cdot\\frac{2}{5}', '\\frac{2\\cdot4}{3\\cdot5}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{4}{3}\\cdot\\frac{2}{5}',
      ne: ['\\frac{2}{3}\\cdot\\frac{4}{5}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{2\\cdot4}{3\\cdot5}',
      eq: ['\\frac{4\\cdot2}{5\\cdot3}'],
      ne: ['\\frac{2}{3}\\cdot\\frac{4}{5}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{x}{y}\\cdot\\frac{1}{z}',
      eq: ['\\frac{1}{z}\\cdot\\frac{x}{y}'],
      ne: ['\\frac{x}{z}\\cdot\\frac{1}{y}', '\\frac{x}{yz}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{x}{z}\\cdot\\frac{1}{y}',
      ne: ['\\frac{x}{y}\\cdot\\frac{1}{z}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{a}{b}\\cdot\\frac{c}{d}',
      eq: ['\\frac{c}{d}\\cdot\\frac{a}{b}'],
      ne: ['\\frac{a}{d}\\cdot\\frac{c}{b}', '\\frac{ac}{bd}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{1}{2}x\\cdot\\frac{3}{4}',
      eq: ['\\frac{3}{4}\\cdot\\frac{1}{2}x'],
    },
    {
      // with several fractions, a factor beside them stays where it is
      opts: ignoreOrder,
      target: '\\frac{1}{x}\\cdot\\frac{1}{y}\\cdot(x+1)',
      eq: ['(x+1)\\cdot\\frac{1}{y}\\cdot\\frac{1}{x}'],
      ne: ['\\frac{1}{x}\\cdot\\frac{1}{y}\\cdot(x+2)', '\\frac{x+1}{x}\\cdot\\frac{1}{y}'],
    },
    {
      // a single fraction still takes the factors beside it into its numerator, as in 1.4.3
      opts: ignoreOrder,
      target: '2\\cdot\\frac{4}{5}',
      eq: ['\\frac{2\\cdot4}{5}', '\\frac{4}{5}\\cdot2'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{2\\cdot4}{5}',
      eq: ['2\\cdot\\frac{4}{5}'],
    },
  ],
};
