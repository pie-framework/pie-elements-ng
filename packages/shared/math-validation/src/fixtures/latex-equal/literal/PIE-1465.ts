// Known issues from the PIE-1465 plan; see symbolic/PIE-1465.ts for how they run.
export default {
  mode: 'literal',
  tests: [
    // never throw: throws only with 6cm first; latexEqual('6', '6cm') is already false
    { target: '6cm', ne: ['6'], knownIssue: 'PIE-1465' },
  ],
};
