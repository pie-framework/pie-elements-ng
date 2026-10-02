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
// package they name. They still decide the bump of every package the snapshot versions, selected
// or pulled in as a dependent, so `next` previews the version master will release.
//
// Usage:
//   node scripts/release-version-snapshot.mjs --dry-run --selection-out <file>   # select only
//   node scripts/release-version-snapshot.mjs --selection-in <file> --stash-dir <dir>
//   node scripts/release-version-snapshot.mjs --stash-dir <dir> [--tag next]     # both at once
//   node scripts/release-version-snapshot.mjs --all ...   # every publishable package, once

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
  gitSubject,
  isAncestor,
  planSynthesizedChangeset,
  raiseToPendingBumps,
  readPendingBumps,
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
    else if (arg === '--selection-in') args.selectionIn = argv[++i];
    else if (arg === '--summary') args.summary = argv[++i];
    else if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--all') args.all = true;
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

// The releases changesets would make from the changesets now in `.changeset/`, dependents
// included. Its stdout is changesets' banner, which must stay off this script's stdout.
function releasePlan(rootDir, scratchDir) {
  mkdirSync(scratchDir, { recursive: true });
  const output = join(scratchDir, 'release-plan.json');
  const status = spawnSync('bunx', ['changeset', 'status', `--output=${output}`], {
    cwd: rootDir,
    stdio: ['ignore', process.stderr, process.stderr],
  });
  if (status.status !== 0) {
    throw new Error(`changeset status exited with ${status.status}`);
  }
  return JSON.parse(readFileSync(output, 'utf8')).releases ?? [];
}

async function selectPackages(rootDir, tag, all) {
  const packages = collectPublishablePackages(rootDir);
  // A one-off full snapshot, for testing the complete set the next stable release would put on
  // `latest` before it does.
  if (all) return packages.map((pkg) => pkg.name).sort();
  const publishedGitHeads = await fetchPublishedGitHeads(packages, tag, {
    isKnownCommit: (sha) => isAncestor(rootDir, sha, 'HEAD'),
  });
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
  return planSynthesizedChangeset({ rootDir, changedFiles, packages });
}

// The selection an earlier `--dry-run --selection-out` wrote. The release workflow selects once and
// versions from that file, so a registry error in one of two lookups cannot make the version step
// disagree with the intent the dropped-release report checks.
function readSelection(path) {
  const selection = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(selection) || selection.some((name) => typeof name !== 'string')) {
    throw new Error(`${path} is not a JSON array of package names`);
  }
  return selection;
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  if (!args.dryRun && !args.stashDir) {
    throw new Error('--stash-dir is required unless --dry-run is given');
  }

  const selected = args.selectionIn
    ? readSelection(args.selectionIn)
    : await selectPackages(rootDir, args.tag, args.all);

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

  // Read before the stash moves the files away.
  const pendingBumps = readPendingBumps(rootDir, pendingChangesets);
  stashPendingChangesets(rootDir, pendingChangesets, args.stashDir);
  const summary =
    args.summary?.trim() || gitSubject(rootDir, 'HEAD') || `Snapshot release (${args.tag})`;
  const changesetPath = join(rootDir, CHANGESET_DIR, changesetFileName(selected));
  const writeSnapshotChangeset = (packageBumps) =>
    writeFileSync(
      changesetPath,
      renderChangeset([...packageBumps.keys()].sort(), summary, packageBumps),
      'utf8'
    );

  // Dependents changesets adds to the release take its own bump for them, not their pending one.
  // Name each such dependent at its pending bump, and repeat while that changes the plan: a raised
  // package can pull in dependents of its own. Bumps only grow, so this settles quickly.
  let packageBumps = bumps;
  writeSnapshotChangeset(packageBumps);
  for (let round = 0; round < 10; round += 1) {
    const raised = raiseToPendingBumps({
      releases: releasePlan(rootDir, args.stashDir),
      pendingBumps,
      bumps: packageBumps,
    });
    if (!raised) break;
    const added = [...raised].filter(([name, bump]) => packageBumps.get(name) !== bump);
    console.error(
      `[release] Previewing pending bumps for ${added.length} dependent(s): ${added
        .map(([name, bump]) => `${name} (${bump})`)
        .join(', ')}`
    );
    packageBumps = raised;
    writeSnapshotChangeset(packageBumps);
  }
  disableChangelog(rootDir);

  // Stdout carries only this script's `key=value` lines, which the release workflow appends to
  // $GITHUB_OUTPUT. Changesets' own output goes to stderr, so it still reaches the log; on stdout
  // its banner (`🦋 changeset v3.0.3`) is an invalid output line and fails the step.
  const version = spawnSync('bunx', ['changeset', 'version', '--snapshot', args.tag], {
    cwd: rootDir,
    stdio: ['ignore', process.stderr, process.stderr],
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
