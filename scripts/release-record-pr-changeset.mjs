#!/usr/bin/env node

// Writes `.changeset/pr-<number>.md` for a pull request just merged into develop, so the next
// stable release's changelog gets one entry per PR without anyone writing a changeset by hand.
//
// It names the publishable packages whose shipping files the merge changed, at `patch`, with the
// PR title as the summary. The `pr:` line is read by @changesets/changelog-github, which turns it
// into the PR link and author on the changelog entry and drops it from the text.
//
// A changeset the PR added itself wins: the packages it names are left out, so its bump type and
// wording reach the changelog unchanged. Nothing is written when every changed package is covered
// that way, when no publishable package changed, or when this PR's file already exists (a re-run).
//
// Usage:
//   node scripts/release-record-pr-changeset.mjs --base <sha> --head <sha> \
//     --number <n> --title "<pr title>" [--dry-run]

import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  collectPublishablePackages,
  parseChangesetReleases,
  planSynthesizedChangeset,
  renderChangeset,
} from './release-synthesize-changesets.mjs';

const CHANGESET_DIR = '.changeset';

function git(rootDir, args) {
  const result = spawnSync('git', args, { cwd: rootDir, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

const toLines = (stdout) =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const isAuthoredChangeset = (path) =>
  /^\.changeset\/[^/]+\.md$/.test(path) && path !== `${CHANGESET_DIR}/README.md`;

export const prChangesetFileName = (number) => `pr-${number}.md`;

export function renderPrSummary(title, number) {
  return `${title.trim()}\n\npr: ${number}`;
}

// Pure core: what the PR's changeset should name, given what the merge changed.
export function planPrChangeset({ rootDir, changedFiles, authoredChangesets, packages }) {
  const covered = new Set(
    authoredChangesets.flatMap((content) => parseChangesetReleases(content)).map((r) => r.name)
  );
  return planSynthesizedChangeset({ rootDir, changedFiles, packages }).filter(
    (name) => !covered.has(name)
  );
}

function parseArgs(argv) {
  const args = { dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--base') args.base = argv[++i];
    else if (arg === '--head') args.head = argv[++i];
    else if (arg === '--number') args.number = argv[++i];
    else if (arg === '--title') args.title = argv[++i];
    else if (arg === '--dry-run') args.dryRun = true;
  }
  for (const required of ['base', 'head', 'number', 'title']) {
    if (!args[required]) throw new Error(`--${required} is required`);
  }
  if (!/^\d+$/.test(args.number))
    throw new Error(`--number must be a PR number, got ${args.number}`);
  return args;
}

function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const fileName = prChangesetFileName(args.number);
  const target = join(rootDir, CHANGESET_DIR, fileName);

  if (existsSync(target)) {
    console.log('recorded=false');
    console.error(`[release] ${CHANGESET_DIR}/${fileName} already exists; nothing to record.`);
    return;
  }

  const changedFiles = toLines(git(rootDir, ['diff', '--name-only', args.base, args.head]));
  const authoredChangesets = toLines(
    git(rootDir, [
      'diff',
      '--name-only',
      '--diff-filter=AM',
      args.base,
      args.head,
      '--',
      CHANGESET_DIR,
    ])
  )
    .filter(isAuthoredChangeset)
    .map((path) => git(rootDir, ['show', `${args.head}:${path}`]));

  const selected = planPrChangeset({
    rootDir,
    changedFiles,
    authoredChangesets,
    packages: collectPublishablePackages(rootDir),
  });

  if (selected.length === 0) {
    console.log('recorded=false');
    console.error(
      authoredChangesets.length > 0
        ? `[release] PR #${args.number}'s own changeset covers every package it changed.`
        : `[release] PR #${args.number} changed no publishable package's shipping files.`
    );
    return;
  }

  console.error(`[release] Recording ${CHANGESET_DIR}/${fileName}:`);
  for (const name of selected) console.error(`  - ${name}`);

  if (!args.dryRun) {
    writeFileSync(
      target,
      renderChangeset(selected, renderPrSummary(args.title, args.number)),
      'utf8'
    );
  }

  console.log('recorded=true');
  console.log(`changeset_file=${CHANGESET_DIR}/${fileName}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
