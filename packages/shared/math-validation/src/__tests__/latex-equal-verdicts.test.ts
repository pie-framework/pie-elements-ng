import { globSync } from 'node:fs';
import { join } from 'node:path';
import { latexEqual } from '../index.js';
import {
  type FixtureData,
  type FixtureModule,
  fixtureFiles,
  LIMIT_MS,
  loadFixture,
  toList,
} from './latex-equal-fixtures.js';

// The verdict snapshot: one text file per fixture file, under src/fixtures/__verdicts__, with the
// verdict of each latexEqual call the fixtures make. That is every pair in both orders, known
// issues included, and each ordered pair of two different `eq` answers of one entry (`cross`).
// No assertion checks the cross pairs, since they rely on transitivity, which the library doesn't
// guarantee yet. Any changed verdict fails the test and shows in the diff, so a fix PR's diff is
// its list of score changes. Refresh the files with `vitest -u`.
//
// Each file is built here from its fixture, not collected from latex-equal.test.ts, so that a `-t`
// filter under `-u` can't write a partial file. The time limit is checked on every call here
// because, unlike in latex-equal.test.ts, nothing inverts it for the known issues.

const verdictsDir = join(import.meta.dirname, '../fixtures/__verdicts__');

// For one fixture file; the slowest, symbolic/fractions-symbolic.ts, takes about 11 s.
const FILE_TIMEOUT_MS = 120_000;

const HEADER =
  '# verdict\tkind\tmode [opts]\ta\tb, for latexEqual(a, b); written by latex-equal-verdicts.test.ts';

const verdicts = (fixture: FixtureModule) => {
  const lines = [HEADER];
  const slow: string[] = [];
  const record = (
    kind: string,
    a: string,
    b: string,
    mode: FixtureData['mode'],
    opts: FixtureData['opts']
  ) => {
    const call = [
      `${mode}${opts ? ` ${JSON.stringify(opts)}` : ''}`,
      JSON.stringify(a),
      JSON.stringify(b),
    ];
    const started = performance.now();
    let verdict: string;
    try {
      verdict = String(latexEqual(a, b, { mode, ...opts }));
    } catch {
      verdict = 'throw';
    }
    const ms = performance.now() - started;
    if (ms >= LIMIT_MS) {
      slow.push(`${kind} ${call.join(' ')}: ${ms.toFixed(0)} ms`);
    }
    lines.push([verdict, kind, ...call].join('\t'));
  };

  for (const t of fixture.tests) {
    // `skip` keeps an entry out of the snapshot too; `only` and NO_SKIP don't change it.
    if (fixture.skip ?? t.skip) {
      continue;
    }
    const mode = t.mode || fixture.mode;
    const eq = toList(t.eq);
    const ne = toList(t.ne);
    for (const y of eq) {
      record('eq', t.target, y, mode, t.opts);
      record('eq/rev', y, t.target, mode, t.opts);
    }
    for (const y of ne) {
      record('ne', t.target, y, mode, t.opts);
      record('ne/rev', y, t.target, mode, t.opts);
    }
    for (const a of eq) {
      for (const b of eq) {
        if (a !== b) {
          record('cross', a, b, mode, t.opts);
        }
      }
    }
  }
  return { text: `${lines.join('\n')}\n`, slow };
};

describe('latexEqual verdict snapshot', () => {
  for (const file of fixtureFiles) {
    it(
      file,
      async () => {
        const { text, slow } = verdicts(await loadFixture(file));
        expect(slow, `latexEqual calls that took ${LIMIT_MS} ms or more`).toEqual([]);
        await expect(text).toMatchFileSnapshot(
          `../fixtures/__verdicts__/${file.replace(/\.ts$/, '.txt')}`
        );
      },
      FILE_TIMEOUT_MS
    );
  }

  // `vitest -u` doesn't delete the file of a fixture file that was renamed or removed.
  it('has a fixture file for every verdict file', () => {
    const orphans = globSync('**/*.txt', { cwd: verdictsDir })
      .sort()
      .filter((f) => !fixtureFiles.includes(f.replace(/\.txt$/, '.ts')));
    expect(orphans).toEqual([]);
  });
});
