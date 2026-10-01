#!/usr/bin/env node

// Versions the packages develop has changed since their last `next` publish as snapshot
// prereleases (`<version>-next.<datetime>`), for the release workflow to publish under `next`.
//
// Nothing this writes is committed. The version bumps, the synthesized changeset and the
// stashed pending changesets all live in the runner's working tree only, so develop never
// carries prerelease versions and a develop -> master merge brings only code and changesets.
//
// Selection is per package, against the commit its current `next` version was built from (see
// `resolveReleaseBase` in release-synthesize-changesets.mjs). A failed or cancelled run leaves
// that commit where it was, so the next run selects the same packages again.
//
// The pending changesets belong to the next stable release, not to this snapshot: they are moved
// out of `.changeset/` before `changeset version --snapshot`, which would otherwise version every
// package they name. They still decide each selected package's bump, so `next` previews the
// version master will release.
//
// Usage:
//   node scripts/release-version-snapshot.mjs --stash-dir <dir> [--tag next] [--selection-out <file>]
//   node scripts/release-version-snapshot.mjs --dry-run      # print the selection, change nothing

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectPendingChangesets } from './release-detect-intent.mjs';
import {
  changesetFileName,
  collectPublishablePackages,
  collectUnreleasedFiles,
  fetchPublishedGitHeads,
  planSynthesizedChangeset,
  renderChangeset,
  resolveSnapshotBumps,
} from './release-synthesize-changesets.mjs';
import { syncEditorRuntimeVersion } from './sync-editor-runtime-version.mjs';

const CHANGESET_DIR = '.changeset';

function parseArgs(argv) {
  const args = { tag: 'next', dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--tag') args.tag = argv[++i];
    else if (arg === '--stash-dir') args.stashDir = argv[++i];
    else if (arg === '--selection-out') args.selectionOut = argv[++i];
    else if (arg === '--summary') args.summary = argv[++i];
    else if (arg === '--dry-run') args.dryRun = true;
  }
  return args;
}

function stashPendingChangesets(rootDir, pendingChangesets, stashDir) {
  for (const name of pendingChangesets) {
    const target = join(stashDir, `${name}.md`);
    mkdirSync(dirname(target), { recursive: true });
    renameSync(join(rootDir, CHANGESET_DIR, `${name}.md`), target);
  }
}

// The snapshot's changelog entries are discarded with the rest of the tree, and the configured
// changelog generator may need network access and a token to write them. Skip it.
function disableChangelog(rootDir) {
  const configPath = join(rootDir, CHANGESET_DIR, 'config.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  writeFileSync(configPath, `${JSON.stringify({ ...config, changelog: false }, null, 2)}\n`);
}

function headSubject(rootDir) {
  const result = spawnSync('git', ['log', '-1', '--format=%s', 'HEAD'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun && !args.stashDir) {
    throw new Error('--stash-dir is required unless --dry-run is given');
  }

  const packages = collectPublishablePackages(rootDir);
  const publishedGitHeads = await fetchPublishedGitHeads(packages, args.tag);
  // `HEAD`, not `GITHUB_SHA`: the release workflow fast-forwards the checkout to the branch tip
  // before this runs, and the tree is the thing being released.
  const changedFiles = collectUnreleasedFiles({
    rootDir,
    head: 'HEAD',
    packages,
    publishedGitHeads,
  });
  // No pending-changeset exclusion: a pending changeset is release intent for master, and says
  // nothing about whether `next` already carries the package.
  const selected = planSynthesizedChangeset({ rootDir, changedFiles, packages });

  // Written whether or not anything was selected: the workflow's end-of-run check compares it
  // with what was published, and an empty selection is a meaningful answer there.
  if (args.selectionOut) {
    writeFileSync(args.selectionOut, `${JSON.stringify(selected, null, 2)}\n`, 'utf8');
  }

  if (selected.length === 0) {
    console.log('snapshot=false');
    console.error(
      `[release] Nothing to snapshot: no publishable package changed since its ${args.tag} publish.`
    );
    return;
  }

  const { pendingChangesets } = await detectPendingChangesets(rootDir);
  const bumps = resolveSnapshotBumps({ rootDir, pendingChangesets, selected });

  console.error(`[release] Snapshot selection (${selected.length}):`);
  for (const name of selected) console.error(`  - ${name} (${bumps.get(name)})`);

  if (args.dryRun) {
    console.log('snapshot=true');
    return;
  }

  stashPendingChangesets(rootDir, pendingChangesets, args.stashDir);
  const summary = args.summary?.trim() || headSubject(rootDir) || `Snapshot release (${args.tag})`;
  writeFileSync(
    join(rootDir, CHANGESET_DIR, changesetFileName(selected)),
    renderChangeset(selected, summary, bumps),
    'utf8'
  );
  disableChangelog(rootDir);

  const version = spawnSync('bunx', ['changeset', 'version', '--snapshot', args.tag], {
    cwd: rootDir,
    stdio: 'inherit',
  });
  if (version.status !== 0) {
    throw new Error(`changeset version --snapshot ${args.tag} exited with ${version.status}`);
  }

  const { runtime, updated } = syncEditorRuntimeVersion({ root: rootDir });
  if (updated.length > 0) {
    console.error(`[release] ${updated.length} package(s) now declare ${runtime}.`);
  }

  console.log('snapshot=true');
  console.log(`snapshot_packages=${selected.join(',')}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
