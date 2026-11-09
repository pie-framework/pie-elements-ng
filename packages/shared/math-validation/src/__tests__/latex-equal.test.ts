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

// Narrow the run with vitest's own filters, for example `vitest -t PD-303`.
const modules = import.meta.glob<FixtureModule>('../fixtures/latex-equal/**/*.ts', {
  eager: true,
  import: 'default',
});

const testData = Object.keys(modules)
  .sort()
  .map((f) => ({ data: modules[f], filename: f.replace(/^\.\.\//, 'src/') }));

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
  // console.log("d.data", d.data);
  describe(d.filename, () => {
    d.data.tests.forEach((t) => {
      const eq = t.eq ? (Array.isArray(t.eq) ? t.eq : [t.eq]) : [];
      const ne = t.ne ? (Array.isArray(t.ne) ? t.ne : [t.ne]) : [];
      // An entry without pairs is a placeholder; vitest rejects the empty suite it would make.
      if (eq.length + ne.length === 0) {
        return;
      }
      const skip = skipTest(d.data, t);
      const only = onlyTest(d.data, t); //.only !== undefined ? d.data.only : t.only;
      // console.log("skip?", skip, "only?", only);
      const dfn = skip ? describe.skip : only ? describe.only : describe;

      const label = getLabel(t);
      const mode = t.mode || d.data.mode;

      dfn(`[${mode}] ${label}`, () => {
        // console.log(t.label || t.target, "eq.length", eq.length);
        // console.log("mode!!", mode);
        const l = optsLabel(mode, t.opts);
        eq.forEach((y) => {
          it(`== ${y} ${l}`, () => {
            const l = latexEqual(t.target, y, {
              mode,
              ...t.opts,
            });
            // console.log(l);
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
