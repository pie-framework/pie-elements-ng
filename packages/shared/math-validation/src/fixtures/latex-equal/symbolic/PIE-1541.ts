// Sorting both sides before comparing changed some expressions, so a different answer could match
// (PIE-1541). A product with a fraction or a negative power among its factors became one fraction that
// kept only the single symbols and numbers beside it, and a nested negation, quotient or power was merged
// into its parent as if it were a sum or a product.
export default {
  mode: 'symbolic',
  tests: [
    {
      target: '(x+1)x^{-1}',
      eq: ['\\frac{x+1}{x}', '1+\\frac{1}{x}'],
      ne: ['(x+2)x^{-1}'],
    },
    {
      target: '(x+1)^{2}x^{-1}',
      eq: ['\\frac{(x+1)^{2}}{x}', 'x+2+\\frac{1}{x}'],
      ne: ['(x+2)^{2}x^{-1}', '7x^{-1}'],
    },
    {
      target: '(x+1)^{2}\\cdot\\frac{1}{x}',
      eq: ['\\frac{1}{x}\\cdot(x+1)^{2}'],
      ne: ['(x+2)^{2}\\cdot\\frac{1}{x}'],
    },
    {
      // past the size limit, where nothing is multiplied out
      target: '(x+1)^{8}\\cdot\\frac{1}{x}',
      eq: ['\\frac{(1+x)^{8}}{x}'],
      ne: ['(x+2)^{8}\\cdot\\frac{1}{x}', '\\frac{1}{x}'],
    },
    {
      // with two fractions, both are kept
      target: '\\frac{1}{x}\\cdot\\frac{(x+1)^{8}}{y}',
      eq: ['\\frac{(x+1)^{8}}{xy}'],
      ne: ['\\frac{(x+1)^{8}}{y}'],
    },
    {
      target: '-x',
      eq: ['-(x)'],
      ne: ['-(-x)'],
    },
    {
      target: 'x',
      eq: ['-(-x)'],
    },
    {
      target: '-(x+1)',
      ne: ['-(-(x+1))'],
    },
    {
      target: '\\frac{a}{\\frac{b}{c}}',
      eq: ['\\frac{ac}{b}'],
      ne: ['\\frac{\\frac{b}{c}}{a}'],
    },
    {
      target: '(3^{x})^{2}',
      eq: ['3^{2x}'],
      ne: ['2^{3^{x}}'],
    },
    {
      target: '(x^{2})^{3}',
      eq: ['x^{6}'],
    },
    {
      // equal values, so symbolic mode matches the fractions that literal mode with ignoreOrder keeps
      // apart
      target: '\\frac{2}{3}\\cdot\\frac{4}{5}',
      eq: [
        '\\frac{4}{3}\\cdot\\frac{2}{5}',
        '\\frac{2\\cdot4}{3\\cdot5}',
        '\\frac{4}{5}\\cdot\\frac{2}{3}',
        '\\frac{8}{15}',
      ],
      ne: ['\\frac{2}{3}\\cdot\\frac{5}{4}'],
    },
    {
      target: '\\frac{x}{y}\\cdot\\frac{1}{z}',
      eq: ['\\frac{x}{z}\\cdot\\frac{1}{y}', '\\frac{x}{yz}', '\\frac{1}{z}\\cdot\\frac{x}{y}'],
      ne: ['\\frac{x}{z}\\cdot\\frac{1}{z}'],
    },
    {
      target: '\\frac{a}{b}\\cdot\\frac{c}{d}',
      eq: ['\\frac{c}{d}\\cdot\\frac{a}{b}', '\\frac{a}{d}\\cdot\\frac{c}{b}', '\\frac{ac}{bd}'],
      ne: ['\\frac{a}{c}\\cdot\\frac{b}{d}'],
    },
    {
      target: '2\\cdot\\frac{4}{5}',
      eq: ['\\frac{2\\cdot4}{5}', '\\frac{8}{5}'],
    },
  ],
};
