// The latexEqual fixtures, read the same way by latex-equal.test.ts (the assertions) and
// latex-equal-verdicts.test.ts (the verdict snapshot), so both make the same calls.
import { globSync } from 'node:fs';
import { join } from 'node:path';
import type { Opts } from '../options.js';

export type FixtureData = {
  target: string;
  mode?: 'symbolic' | 'literal';
  skip?: boolean;
  only?: boolean;
  label?: string;
  opts?: Omit<Opts, 'mode'>;
  eq?: string | string[];
  ne?: string | string[];
  // A ticket key, such as 'PIE-1465'. `eq` and `ne` state the correct verdict, which the library
  // doesn't give yet. The fix that makes the pairs pass removes the key.
  knownIssue?: string;
};

export type FixtureModule = {
  mode?: 'symbolic' | 'literal';
  only?: boolean;
  skip?: boolean;
  tests: FixtureData[];
};

// A latexEqual call that takes this long fails. The slowest fixture call takes under 100 ms today.
// This catches slowdowns, not hangs: a call that never returns blocks the worker.
export const LIMIT_MS = 1000;

// Listed at run time: an `import.meta.glob` list is fixed when the file is transformed, and
// vitest's transform cache then keeps serving it after a fixture file is added.
const fixturesDir = join(import.meta.dirname, '../fixtures/latex-equal');
export const fixtureFiles = globSync('**/*.ts', { cwd: fixturesDir }).sort();

export const loadFixture = async (file: string) =>
  ((await import(join(fixturesDir, file))) as { default: FixtureModule }).default;

export const toList = (v?: string | string[]) => (v ? (Array.isArray(v) ? v : [v]) : []);
