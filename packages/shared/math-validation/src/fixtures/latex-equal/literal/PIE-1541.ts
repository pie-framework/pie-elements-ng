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
    {
      // the factors inside the fractions may be reordered too, also together with the fractions
      opts: ignoreOrder,
      target: '\\frac{zb}{2}\\cdot\\frac{c}{d}',
      eq: [
        '\\frac{bz}{2}\\cdot\\frac{c}{d}',
        '\\frac{c}{d}\\cdot\\frac{bz}{2}',
        '\\frac{c}{d}\\cdot\\frac{zb}{2}',
      ],
      ne: ['\\frac{zc}{2}\\cdot\\frac{b}{d}', '\\frac{zb}{d}\\cdot\\frac{c}{2}', '\\frac{bzc}{2d}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{bz}{2}\\cdot\\frac{c}{d}',
      eq: ['\\frac{zb}{2}\\cdot\\frac{c}{d}', '\\frac{c}{d}\\cdot\\frac{zb}{2}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{c}{d}\\cdot\\frac{bz}{2}',
      eq: ['\\frac{zb}{2}\\cdot\\frac{c}{d}'],
      ne: ['\\frac{zc}{2}\\cdot\\frac{b}{d}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{2x}{3}\\cdot\\frac{4}{5}',
      eq: ['\\frac{x\\cdot2}{3}\\cdot\\frac{4}{5}', '\\frac{4}{5}\\cdot\\frac{x\\cdot2}{3}'],
      ne: ['\\frac{4x}{3}\\cdot\\frac{2}{5}', '\\frac{2x}{5}\\cdot\\frac{4}{3}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{x\\cdot2}{3}\\cdot\\frac{4}{5}',
      eq: ['\\frac{2x}{3}\\cdot\\frac{4}{5}'],
    },
    {
      // reordered denominators (dy would read as a derivative, so ey)
      opts: ignoreOrder,
      target: '\\frac{a}{b}\\cdot\\frac{c}{ey}',
      eq: ['\\frac{a}{b}\\cdot\\frac{c}{ye}', '\\frac{c}{ye}\\cdot\\frac{a}{b}'],
      ne: ['\\frac{a}{e}\\cdot\\frac{c}{by}', '\\frac{a}{by}\\cdot\\frac{c}{e}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{c}{ye}\\cdot\\frac{a}{b}',
      eq: ['\\frac{a}{b}\\cdot\\frac{c}{ey}'],
    },
    {
      // three fractions
      opts: ignoreOrder,
      target: '\\frac{zb}{2}\\cdot\\frac{c}{w}\\cdot\\frac{xy}{3}',
      eq: [
        '\\frac{yx}{3}\\cdot\\frac{bz}{2}\\cdot\\frac{c}{w}',
        '\\frac{c}{w}\\cdot\\frac{yx}{3}\\cdot\\frac{zb}{2}',
      ],
      ne: [
        '\\frac{zb}{3}\\cdot\\frac{c}{w}\\cdot\\frac{xy}{2}',
        '\\frac{zc}{2}\\cdot\\frac{b}{w}\\cdot\\frac{xy}{3}',
      ],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{c}{w}\\cdot\\frac{yx}{3}\\cdot\\frac{zb}{2}',
      eq: ['\\frac{zb}{2}\\cdot\\frac{c}{w}\\cdot\\frac{xy}{3}'],
    },
    {
      // a negated product of fractions
      opts: ignoreOrder,
      target: '-\\frac{zb}{2}\\cdot\\frac{c}{w}',
      eq: ['-\\frac{bz}{2}\\cdot\\frac{c}{w}', '-\\frac{c}{w}\\cdot\\frac{bz}{2}'],
      ne: ['\\frac{zb}{2}\\cdot\\frac{c}{w}', '-\\frac{zc}{2}\\cdot\\frac{b}{w}'],
    },
    {
      opts: ignoreOrder,
      target: '-\\frac{c}{w}\\cdot\\frac{bz}{2}',
      eq: ['-\\frac{zb}{2}\\cdot\\frac{c}{w}'],
    },
    {
      // plain factors and sums beside the fractions
      opts: ignoreOrder,
      target: '3a\\cdot\\frac{zb}{2}\\cdot\\frac{c}{w}',
      eq: ['\\frac{c}{w}\\cdot a\\cdot3\\cdot\\frac{bz}{2}'],
      ne: ['3\\cdot\\frac{zb}{2}\\cdot\\frac{ac}{w}'],
    },
    {
      opts: ignoreOrder,
      target: '\\frac{c}{w}\\cdot a\\cdot3\\cdot\\frac{bz}{2}',
      eq: ['3a\\cdot\\frac{zb}{2}\\cdot\\frac{c}{w}'],
    },
    {
      opts: ignoreOrder,
      target: '(z+b)\\cdot\\frac{c}{w}\\cdot\\frac{e}{f}',
      eq: ['(b+z)\\cdot\\frac{e}{f}\\cdot\\frac{c}{w}'],
      ne: ['(z+c)\\cdot\\frac{b}{w}\\cdot\\frac{e}{f}'],
    },
    {
      opts: ignoreOrder,
      target: '(b+z)\\cdot\\frac{e}{f}\\cdot\\frac{c}{w}',
      eq: ['(z+b)\\cdot\\frac{c}{w}\\cdot\\frac{e}{f}'],
    },
    {
      // a single fraction, with sums beside it
      opts: ignoreOrder,
      target: '(z+b)(w+c)\\cdot\\frac{1}{x}',
      eq: ['(b+z)(c+w)\\cdot\\frac{1}{x}', '\\frac{1}{x}\\cdot(c+w)(b+z)'],
      ne: ['(z+c)(w+b)\\cdot\\frac{1}{x}'],
    },
    {
      opts: ignoreOrder,
      target: '(b+z)(c+w)\\cdot\\frac{1}{x}',
      eq: ['(z+b)(w+c)\\cdot\\frac{1}{x}'],
    },
    {
      // sorted inside out, so the order of the sums doesn't depend on how their terms are written
      opts: ignoreOrder,
      target: '(z+b)(w+c)',
      eq: ['(b+z)(c+w)', '(c+w)(b+z)'],
      ne: ['(z+c)(w+b)'],
    },
  ],
};
