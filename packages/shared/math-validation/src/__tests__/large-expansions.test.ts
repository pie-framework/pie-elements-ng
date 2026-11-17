import largeExpansions from '../fixtures/latex-equal/symbolic/large-expansions.js';
import { latexEqual } from '../index.js';

const symbolic = { mode: 'symbolic' as const };

// Before PIE-1532 rationalize multiplied out each of these for 1.4 to 8.5 seconds. The limit catches a
// size estimate that lets one through again, and leaves room for a slow CI machine.
const LIMIT_MS = 1000;

const pairs: [string, string][] = largeExpansions.tests.flatMap((t) =>
  [...(t.eq ?? []), ...(t.ne ?? [])].map((other): [string, string] => [t.target, other])
);

describe('large expansions are compared without multiplying them out', () => {
  it.each(pairs)('%s vs %s', (a, b) => {
    const start = performance.now();
    latexEqual(a, b, symbolic);
    expect(performance.now() - start).toBeLessThan(LIMIT_MS);
  });

  it('leaves an expression with a variable denominator to the structural comparison', () => {
    // equal except at x = 1, where the first is undefined: whether that counts is an open decision
    // (PIE-1465), and sample points can't see the hole, so expression size must not decide it
    expect(latexEqual('\\frac{x^{6}-1}{x-1}', 'x^5+x^4+x^3+x^2+x+1', symbolic)).toBe(false);
  });
});
