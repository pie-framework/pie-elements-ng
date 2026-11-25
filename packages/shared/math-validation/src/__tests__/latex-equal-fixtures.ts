// The latexEqual fixtures, read and timed the same way by latex-equal.test.ts (the assertions) and
// latex-equal-verdicts.test.ts (the verdict snapshot), so both make the same calls.
import { globSync } from 'node:fs';
import { join } from 'node:path';
import { latexEqual } from '../index.js';
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

// A latexEqual call that takes this much CPU time fails. The slowest fixture call takes under
// 100 ms today. This catches slowdowns, not hangs: a call that never returns blocks the worker.
export const LIMIT_MS = 1000;

export type TimedCall = { cpuMs: number; wallMs: number } & (
  | { verdict: boolean }
  | { error: unknown }
);

// Calls latexEqual and measures it. The limit is on CPU time (user + system), because wall time
// grows on a busy machine, such as a loaded CI runner or the pre-push gate next to other work.
// process.cpuUsage() counts the whole process, and here that is this test file alone: the root
// vitest.config.ts sets no `pool`, and vitest's default `forks` pool runs each test file in its
// own child process, so other processes' load isn't counted. Under the `threads` pool, files
// running at the same time would share the process and all be counted; calls would then look
// slow and fail loudly, never pass unnoticed.
export const timedLatexEqual = (a: string, b: string, opts: Opts): TimedCall => {
  const cpu = process.cpuUsage();
  const started = performance.now();
  let outcome: { verdict: boolean } | { error: unknown };
  try {
    outcome = { verdict: latexEqual(a, b, opts) };
  } catch (error) {
    outcome = { error };
  }
  const wallMs = performance.now() - started;
  const { user, system } = process.cpuUsage(cpu);
  return { ...outcome, cpuMs: (user + system) / 1000, wallMs };
};

export const timeText = (call: TimedCall) =>
  `${call.cpuMs.toFixed(0)} ms CPU, ${call.wallMs.toFixed(0)} ms wall`;

// Listed at run time: an `import.meta.glob` list is fixed when the file is transformed, and
// vitest's transform cache then keeps serving it after a fixture file is added.
const fixturesDir = join(import.meta.dirname, '../fixtures/latex-equal');
export const fixtureFiles = globSync('**/*.ts', { cwd: fixturesDir }).sort();

export const loadFixture = async (file: string) =>
  ((await import(join(fixturesDir, file))) as { default: FixtureModule }).default;

export const toList = (v?: string | string[]) => (v ? (Array.isArray(v) ? v : [v]) : []);
