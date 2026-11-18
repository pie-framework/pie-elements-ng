// Powers and products of sums that rationalize took seconds to multiply out (PIE-1532). Past a size
// limit they are compared at sample points instead; large-expansions.test.ts checks that they stay fast.
export default {
  mode: 'symbolic',
  tests: [
    {
      target: '(x+1)^{7}',
      // ast-to-mathjs writes 7.0 as a trailing-zeros node, which the size estimate reads as 7
      eq: [
        '(1+x)^{7}',
        '(x+1)^{3+4}',
        '(x+1)^{\\frac{14}{2}}',
        '(x+1)^{7.0}',
        '(x+1)^{3}(1+x)^{4}',
      ],
      ne: ['(x+1)^{7}+1', '(x-1)^{7}', '(x+1)^{6}'],
    },
    {
      target: '(x+1)^{3}(x+2)^{4}',
      eq: ['(x+2)^{4}(x+1)^{3}'],
      ne: ['(x+2)^{3}(x+1)^{4}'],
    },
    {
      target: '\\frac{1}{(x+1)^{7}}',
      eq: ['\\frac{1}{(1+x)^{7}}'],
    },
    {
      target: '\\sin(x)+(x+1)^{7}',
      eq: ['(1+x)^{7}+\\sin(x)'],
      ne: ['\\cos(x)+(x+1)^{7}'],
    },
    {
      target: '(x+y)^{5}',
      eq: ['(y+x)^{5}', '(x+y)^{2}(x+y)^{3}'],
      ne: ['(x-y)^{5}'],
    },
    {
      target: '(a+b+c+d)^{3}',
      eq: ['(d+c+b+a)^{3}'],
      ne: ['(a+b+c-d)^{3}'],
    },
    {
      // exponents that only simplify to a constant inside normalize
      target: '2x+3',
      ne: ['(x+1)^{7+0x}', '(x+1)^{\\frac{7x}{x}}'],
    },
    {
      // rationalize gets the arguments next to a function one at a time
      target: '\\log_{\\sqrt{2}}\\left((x+1)^{7}\\right)',
      eq: ['\\log_{\\sqrt{2}}\\left((1+x)^{7}\\right)'],
      ne: ['3\\log_{2}(x)'],
    },
    {
      // sums of parts that are each small, which rationalize collects slowly
      target: '(x+1)^{4}+(x+2)^{4}+(x+3)^{4}+(x+4)^{4}',
      eq: ['(x+4)^{4}+(x+3)^{4}+(x+2)^{4}+(x+1)^{4}'],
      ne: ['(x+4)^{4}+(x+3)^{4}+(x+2)^{4}+(x+1)^{3}'],
    },
    {
      target: '(x+1)(x+2)(x+3)(x+4)+(x+5)(x+6)(x+7)(x+8)',
      eq: ['(x+5)(x+6)(x+7)(x+8)+(x+1)(x+2)(x+3)(x+4)'],
    },
    {
      // a sum under a variable exponent isn't multiplied out, but it isn't sampled either: where the
      // base is negative the power isn't real, so sample points can't tell these apart
      target: '(x+1)^{y}',
      eq: ['(1+x)^{y}'],
      ne: ['\\left|x+1\\right|^{y}', '\\sqrt{(x+1)^{2y}}', '(x+1)^{y}+10^{-12}'],
    },
    {
      target: '(x+1)^{-y}',
      ne: ['\\left|x+1\\right|^{-y}'],
    },
    {
      // a lone term next to a small expansion is only collected, so these stay exact comparisons
      target: '(x+1000)^{4}',
      ne: ['(x+1000)^{4}+1'],
    },
    {
      target: '(x+1)^{4}+\\sqrt{x}',
      ne: ['(x+1)^{4}+\\sqrt{\\left|x\\right|}'],
    },
    {
      // a removable hole: below the limit rationalize keeps (x-1)/(x-1) apart and these don't match,
      // which is an open decision (PIE-1465); past it simplify must not cancel the factor instead
      target: '(x+1)^{8}',
      eq: ['(1+x)^{8}'],
      ne: ['\\frac{(x-1)(x+1)^{8}}{x-1}', '\\frac{x(x+1)^{8}}{x}'],
    },
    {
      target: '\\frac{1}{x-1}+(x+1)^{8}',
      eq: ['(1+x)^{8}+\\frac{1}{x-1}'],
    },
    {
      // past the limit with a variable denominator, the same function written another way still
      // matches, as in 1.4.3 (PIE-1540): its denominators are zero at the same places
      target: '\\frac{(x+1)^{5}}{x}',
      eq: [
        '(x+1)^{5}x^{-1}',
        '\\frac{1}{x}(x+1)^{5}',
        'x^{4}+5x^{3}+10x^{2}+10x+5+\\frac{1}{x}',
        '\\frac{(x+1)^{4}}{x}+(x+1)^{4}',
        '\\frac{(x+1)^{2}(x+1)^{3}}{x}',
        '-\\frac{(x+1)^{5}}{-x}',
      ],
      ne: [
        '\\frac{(x+1)^{5}}{x+1}',
        '\\frac{(x+1)^{5}}{x^{2}}',
        '(x+1)^{5}',
        '-\\frac{(x+1)^{5}}{x}',
        '\\frac{(x+1)^{5}}{\\left|x\\right|}',
      ],
    },
    {
      target: '\\frac{(x+1)^{5}}{x(x+2)}',
      eq: ['\\frac{(x+1)^{5}}{x^{2}+2x}', '(x+1)^{5}x^{-1}(x+2)^{-1}'],
      ne: ['\\frac{(x+1)^{5}}{x(x-2)}'],
    },
    {
      target: '\\frac{5x(x+1)^{4}-(x+1)^{5}}{x^{2}}',
      eq: ['\\frac{(x+1)^{4}(4x-1)}{x^{2}}'],
    },
    {
      target: '\\frac{3}{(x+1)^{5}}',
      eq: ['3(x+1)^{-5}', '\\frac{6}{2(1+x)^{5}}'],
    },
    {
      target: '\\frac{(x-2)^{6}}{x^{3}}',
      eq: ['\\frac{(2-x)^{6}}{x^{3}}'],
    },
    {
      target: '\\frac{(x+y)^{5}}{y}',
      eq: ['(x+y)^{5}y^{-1}'],
    },
    {
      // a removable hole past the limit still keeps two forms apart
      target: '\\frac{x^{6}-1}{x-1}(x+1)^{4}',
      ne: ['(x^5+x^4+x^3+x^2+x+1)(x+1)^{4}'],
    },
    {
      // sampled, but a point where only one side is defined counts as a difference
      target: '(x+1)^{5}+\\sqrt{x}',
      eq: ['\\sqrt{x}+(1+x)^{5}'],
      ne: ['(x+1)^{5}+\\sqrt{\\left|x\\right|}'],
    },
  ],
};
