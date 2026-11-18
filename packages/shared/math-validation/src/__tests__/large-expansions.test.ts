import largeExpansions from '../fixtures/latex-equal/symbolic/large-expansions.js';
import { latexEqual } from '../index.js';

const symbolic = { mode: 'symbolic' as const };

// Before PIE-1532 rationalize multiplied out each of these for 1.3 to 10 seconds. The limit catches a
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

  it('keeps a removable hole apart past the size limit, where sample points cannot see it', () => {
    // past the size limit, and equal except at x = 1, where the first is undefined: whether that counts
    // is an open decision (PIE-1465), so the sampled comparison must not decide it. The denominators
    // are not zero at the same values, which keeps the two apart (PIE-1540).
    expect(
      latexEqual('\\frac{x^{6}-1}{x-1}(x+1)^{4}', '(x^5+x^4+x^3+x^2+x+1)(x+1)^{4}', symbolic)
    ).toBe(false);
    expect(
      latexEqual('(x^5+x^4+x^3+x^2+x+1)(x+1)^{4}', '\\frac{x^{6}-1}{x-1}(x+1)^{4}', symbolic)
    ).toBe(false);
  });
});
