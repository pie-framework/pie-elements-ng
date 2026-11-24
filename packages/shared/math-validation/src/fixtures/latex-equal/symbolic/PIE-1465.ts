// Known issues from the PIE-1465 plan. Each entry states the correct verdict, in strict maths over
// the real numbers, and runs as `it.fails` in the order written only (target, then answer); the
// verdict snapshot records both orders. A fix that makes an entry pass turns it red: remove
// `knownIssue`, and the pair joins the both-order checks. No input here may be slow; the time
// limit applies to these too.
export default {
  mode: 'symbolic',
  tests: [
    // inequality direction: both orders are accepted today
    { target: 'x<-1', ne: ['x>-1'], knownIssue: 'PIE-1465' },
    { target: '-2x<4', ne: ['x<-2'], knownIssue: 'PIE-1465' },
    { target: '2<x<5', ne: ['-2<-x<-5'], knownIssue: 'PIE-1465' },
    // ordered pairs: literal mode already rejects this (literal/PIE-1367.ts)
    { target: '(1,2)', ne: ['(2,1)'], knownIssue: 'PIE-1465' },
    // argument order: latexEqual('y=(\sqrt{x})^2', 'y=x') is true, the reverse is false.
    // Not equal: \sqrt{x} needs x ≥ 0, as (\sqrt{x})^2 against x already shows.
    { target: 'y=(\\sqrt{x})^2', ne: ['y=x'], knownIssue: 'PIE-1465' },
    // never throw: each throws in both orders today
    { target: 'P=2L+2W', eq: ['P=2W+2L', 'P=2(L+W)'], knownIssue: 'PIE-1465' },
    { target: '(\\sin x)^2', eq: ['\\sin^2x', '\\sin^2(x)'], knownIssue: 'PIE-1465' },
    { target: 'x+1', ne: ['x+'], knownIssue: 'PIE-1465' },
    { target: '\\{1,2\\}', eq: ['\\{1, 2\\}', '\\{2,1\\}'], knownIssue: 'PIE-1465' },
    { target: '\\frac{1}{2}', eq: ['\\frac12'], knownIssue: 'PIE-1465' },
    // degrees: ° and \degree are read as degrees, ^{\circ} is not (false, no throw)
    {
      target: '\\frac{1}{2}',
      eq: ['\\sin(30^{\\circ})', '\\cos(60^\\circ)'],
      knownIssue: 'PIE-1465',
    },
    { target: '90°', eq: ['90^{\\circ}'], knownIssue: 'PIE-1465' },
    // each answer matches the fixture target but not the other answer
    // (3-way-inequalities-with-variables.ts and PIE-1419.ts)
    {
      target: '57.06 - 24.74 ≤ 24.74 - 24.74 + 1.54b ≤ 171.02- 24.74',
      eq: ['32.32 ≤1.54b ≤146.28'],
      knownIssue: 'PIE-1465',
    },
    // both leave out x = 0, so they describe the same region
    { target: '\\frac{y}{x^2}>1', eq: ['x^2y>x^4'], knownIssue: 'PIE-1465' },
  ],
};
