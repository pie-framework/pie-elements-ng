#!/usr/bin/env node

/**
 * pre-push hook entry point: runs the gate below unless the push adds no commits or its new
 * commits change documentation only. lefthook.yml runs this as a script job with `use_stdin`, so
 * git's ref lines reach it; scripts/lib/change-scope.mjs makes the decision.
 */

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { classifyPush } from './lib/change-scope.mjs';

const LABEL = '[pre-push-gate]';

/** Build first: the tests resolve workspace packages through their built `dist/`. */
const GATE = [
  ['run', 'build'],
  ['run', 'verify:dependency-integrity', '--check-peer-gaps', '--fail-on-hoist', '--fail-on-peer'],
  ['run', 'test'],
];

/**
 * A brand-new remote ref has no "before", so its new commits are those no remote-tracking ref
 * reaches. Stale remote-tracking refs make pushed commits look new, which errs toward running.
 */
const newCommitRange = ({ localSha, remoteSha }) =>
  /^0+$/.test(remoteSha) ? [localSha, '--not', '--remotes'] : [`${remoteSha}..${localSha}`];

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });

/**
 * `-m` lists a merge commit's paths against each parent, so a merge brings in the merged branch's
 * paths; `--no-renames` lists both sides of a rename.
 */
function listNewCommits(refUpdate) {
  const range = newCommitRange(refUpdate);
  const count = git('rev-list', '--count', ...range);
  const log = git('log', '-m', '--name-only', '--no-renames', '--format=', ...range);
  if (count.status !== 0 || log.status !== 0) return null;
  return {
    commits: Number.parseInt(count.stdout.trim(), 10),
    paths: log.stdout.split('\n').filter(Boolean),
  };
}

function readHookStdin() {
  // A TTY means there is no hook payload, and reading fd 0 would block.
  if (process.stdin.isTTY) return null;
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return null;
  }
}

const { verdict, reason } = classifyPush({ stdin: readHookStdin(), listNewCommits });
if (verdict === 'skip') {
  console.log(`${LABEL} Skipping the gate: ${reason}.`);
  process.exit(0);
}

console.log(`${LABEL} Running the gate: ${reason}.`);
for (const args of GATE) {
  const step = spawnSync('bun', args, { stdio: 'inherit' });
  if (step.error) {
    console.error(`${LABEL} Could not start bun ${args.join(' ')}: ${step.error.message}`);
    process.exit(1);
  }
  if (step.status !== 0) process.exit(step.status ?? 1);
}
