#!/usr/bin/env node

/**
 * CI's `change-scope` job: decides which jobs this run skips and writes the decision to
 * $GITHUB_OUTPUT. The decision lives in scripts/lib/change-scope.mjs; this file reads the event
 * and the diff.
 *
 * A pull request checks out its merge commit, whose first parent is the base branch tip, so
 * `HEAD^1..HEAD` is its change. A push diffs against the commit the branch pointed at before it,
 * fetched when the shallow checkout lacks it. `--no-renames` lists both sides of a rename, so code
 * moved under `docs/` still counts as a code change. Any other event, or a diff git cannot
 * produce, runs everything.
 */

import { spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { ciScope } from './lib/change-scope.mjs';

const LABEL = '[ci-change-scope]';

const git = (...args) => spawnSync('git', args, { encoding: 'utf8' });

function diffPaths(from) {
  const result = git('diff', '--name-only', '--no-renames', from, 'HEAD');
  if (result.status !== 0) {
    console.log(`${LABEL} Could not list the changed paths: ${result.stderr.trim()}`);
    return null;
  }
  return result.stdout.split('\n').filter(Boolean);
}

function listChangedPaths(eventName, before) {
  if (eventName === 'pull_request') return diffPaths('HEAD^1');
  if (eventName !== 'push' || !before || /^0+$/.test(before)) return null;
  if (git('cat-file', '-e', `${before}^{commit}`).status !== 0) {
    git('fetch', '--no-tags', '--depth=1', 'origin', before);
  }
  return diffPaths(before);
}

const changedPaths = listChangedPaths(process.env.GITHUB_EVENT_NAME, process.env.BEFORE_SHA);
const scope = ciScope({ skipHeavy: process.env.SKIP_HEAVY === 'true', changedPaths });

if (changedPaths !== null) {
  console.log(`${LABEL} ${changedPaths.length} changed path(s):`);
  for (const path of changedPaths) console.log(`  ${path}`);
}

const lines = [`skip_code=${scope.skipCode}`, `skip_lint=${scope.skipLint}`];
for (const line of lines) console.log(`${LABEL} ${line}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}
