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
  ],
};
