import { latexEqual } from '../index.js';
import {
  type FixtureData,
  type FixtureModule,
  fixtureFiles,
  LIMIT_MS,
  loadFixture,
  toList,
} from './latex-equal-fixtures.js';

// Narrow the run with vitest's own filters, for example `vitest -t PD-303`, `-t PIE-1465` for the
// known issues, or `-t '(rev)'` for the swapped order.
const testData = await Promise.all(
  fixtureFiles.map(async (f) => ({
    data: await loadFixture(f),
    filename: `src/fixtures/latex-equal/${f}`,
  }))
);

const skipTest = (root: FixtureModule, test: FixtureData) => {
  if (process.env.NO_SKIP) {
    return false;
  }
  return root.skip !== undefined ? root.skip : test.skip;
};
const onlyTest = (root: FixtureModule, test: FixtureData) => {
  if (process.env.NO_ONLY) {
    return false;
  }
  return root.only !== undefined ? root.only : test.only;
};

const getLabel = (t: FixtureData) => {
  const label = t.label ? t.label.replace(/\$target/, t.target) : t.target;
  return t.knownIssue ? `${label} (known issue ${t.knownIssue})` : label;
};

const optsLabel = (mode, o) => {
  if (!o) {
    return '';
  }

  if (mode === 'symbolic') {
    if (o.exception) {
      return `(exception:${o.exception.join(',')})`;
    }
    return '';
  }
  return `(${Object.entries(o)
    .map(([k, v]) => (v ? k : undefined))
    .filter((v) => !!v)
    .join(',')})`;
};

// Every pair runs as latexEqual(target, answer) and, marked (rev), as latexEqual(answer, target),
// the order the elements score in.
//
// A known issue runs as `it.fails` in the written order only, and the verdict snapshot
// (latex-equal-verdicts.test.ts) records both orders. Once a fix makes it pass, `it.fails` turns
// red; the fix removes `knownIssue`, and the pair then runs in both orders like the others.
// `it.fails` can't tell one wrong outcome from another: a fix that turns a throw into the wrong
// verdict stays green. The snapshot is what records that change.
//
// Each call is timed with performance.now() rather than a per-test timeout: `it.fails` would
// invert the timeout too, and a timeout doesn't say which call was slow.
testData.forEach((d) => {
  describe(d.filename, () => {
    d.data.tests.forEach((t) => {
      const eq = toList(t.eq);
      const ne = toList(t.ne);
      // An entry without pairs is a placeholder; vitest rejects the empty suite it would make.
      if (eq.length + ne.length === 0) {
        return;
      }
      const skip = skipTest(d.data, t);
      const only = onlyTest(d.data, t);
      const dfn = skip ? describe.skip : only ? describe.only : describe;

      const mode = t.mode || d.data.mode;
      const opts = { mode, ...t.opts };
      const l = optsLabel(mode, t.opts);
      const test = t.knownIssue ? it.fails : it;

      dfn(`[${mode}] ${getLabel(t)}`, () => {
        for (const [answers, want, sign] of [
          [eq, true, '=='],
          [ne, false, '!='],
        ] as const) {
          for (const y of answers) {
            const orders: [string, string, string][] = [[t.target, y, '']];
            if (!t.knownIssue) {
              orders.push([y, t.target, '(rev)']);
            }
            for (const [a, b, tag] of orders) {
              test([sign, y, l, tag].filter(Boolean).join(' '), () => {
                const started = performance.now();
                const verdict = latexEqual(a, b, opts);
                const ms = performance.now() - started;
                expect(verdict).toBe(want);
                expect(ms, `latexEqual(${a}, ${b}) took ${ms.toFixed(0)} ms`).toBeLessThan(
                  LIMIT_MS
                );
              });
            }
          }
        }
      });
    });
  });
});
