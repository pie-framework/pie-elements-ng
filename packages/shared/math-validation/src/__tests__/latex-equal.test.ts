import { globSync } from 'node:fs';
import { join } from 'node:path';
import { latexEqual } from '../index.js';
import type { Opts } from '../options.js';

type FixtureData = {
  target: string;
  mode?: 'symbolic' | 'literal';
  skip?: boolean;
  only?: boolean;
  label?: string;
  opts?: Omit<Opts, 'mode'>;
  eq: string | string[];
  ne: string | string[];
};

type FixtureModule = {
  mode?: 'symbolic' | 'literal';
  only?: boolean;
  skip?: boolean;
  tests: FixtureData[];
};

// Listed at run time: an `import.meta.glob` list is fixed when the file is transformed, and
// vitest's transform cache then keeps serving it after a fixture file is added.
// Narrow the run with vitest's own filters, for example `vitest -t PD-303`.
const fixturesDir = join(import.meta.dirname, '../fixtures/latex-equal');
const fixtureFiles = globSync('**/*.ts', { cwd: fixturesDir }).sort();

const testData = await Promise.all(
  fixtureFiles.map(async (f) => ({
    data: ((await import(join(fixturesDir, f))) as { default: FixtureModule }).default,
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
  if (t.label) {
    return t.label.replace(/\$target/, t.target);
  }
  return t.target;
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

testData.forEach((d) => {
  describe(d.filename, () => {
    d.data.tests.forEach((t) => {
      const eq = t.eq ? (Array.isArray(t.eq) ? t.eq : [t.eq]) : [];
      const ne = t.ne ? (Array.isArray(t.ne) ? t.ne : [t.ne]) : [];
      // An entry without pairs is a placeholder; vitest rejects the empty suite it would make.
      if (eq.length + ne.length === 0) {
        return;
      }
      const skip = skipTest(d.data, t);
      const only = onlyTest(d.data, t);
      const dfn = skip ? describe.skip : only ? describe.only : describe;

      const label = getLabel(t);
      const mode = t.mode || d.data.mode;

      dfn(`[${mode}] ${label}`, () => {
        const l = optsLabel(mode, t.opts);
        eq.forEach((y) => {
          it(`== ${y} ${l}`, () => {
            const l = latexEqual(t.target, y, {
              mode,
              ...t.opts,
            });
            expect(l).toEqual(true);
          });
        });

        ne.forEach((y) => {
          it(`!= ${y} ${l}`, () => {
            const l = latexEqual(t.target, y, {
              mode,
              ...t.opts,
            });
            expect(l).toEqual(false);
          });
        });
      });
    });
  });
});
