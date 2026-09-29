// Derives changesets from the packages that have unreleased code, so a merge into develop
// publishes `-next.N` without an author having written a changeset by hand.
//
// Only the packages whose own shipping files changed are named. Dependents are left to
// changesets itself, which propagates through `updateInternalDependencies: "patch"`.
//
// Packages already covered by a pending (unconsumed) changeset are skipped, so a hand-written
// changeset keeps its bump type and its summary.
//
// "Unreleased" is per package, and is measured against that package's own last version bump
// rather than against the range of one push (PIE-1073). A push range scopes the release intent
// to a single workflow run: when that run is cancelled or fails, the synthesized changeset dies
// with the runner and no later run reconsiders the range, so the packages are never released and
// nothing records that they should have been. Asking "did this package's shipping files change
// after its version last moved?" instead makes every run consider everything outstanding, which
// is what lets a lost run heal on the next merge.
//
// Per package rather than repo-wide because the auto-release push rebases onto the branch tip
// when a merge lands mid-run, which leaves the version-bump commit sitting on top of code it did
// not release. A single repo-wide "last release commit" baseline would read that commit as
// covering the work beneath it and drop it silently — the exact failure this replaces.

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { globSync } from 'glob';
import { detectPendingChangesets } from './release-detect-intent.mjs';

const CHANGESET_DIR = '.changeset';
const DEFAULT_BUMP = 'patch';

// Paths inside a package that never reach the published tarball. A change confined to these
// is not a reason to cut a release.
const NON_SHIPPING_PATTERNS = [
  /(^|\/)(?:test|tests|__tests__|__mocks__|__snapshots__|snapshots|e2e)(?:\/|$)/,
  /(^|\/)[^/]+\.(?:test|spec)\.[cm]?[jt]sx?$/,
  /(^|\/)(?:vitest|playwright)\.[^/]*\.[cm]?[jt]s$/,
  /(^|\/)vitest\.setup\.[cm]?[jt]s$/,
];

const isShippingPath = (packageRelativePath) =>
  !NON_SHIPPING_PATTERNS.some((pattern) => pattern.test(packageRelativePath));

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

// Package directories, deepest first, so a nested workspace (e.g. a package's own `demo`)
// claims its files ahead of the parent.
export function collectPublishablePackages(rootDir) {
  const rootPackage = readJson(join(rootDir, 'package.json'));
  const patterns = Array.isArray(rootPackage?.workspaces) ? rootPackage.workspaces : [];
  const ignored = new Set(readJson(join(rootDir, CHANGESET_DIR, 'config.json'))?.ignore ?? []);

  const packages = [];
  for (const pattern of patterns) {
    for (const manifestPath of globSync(join(pattern, 'package.json'), {
      cwd: rootDir,
      absolute: true,
      ignore: ['**/node_modules/**'],
    })) {
      const pkg = readJson(manifestPath);
      if (!pkg?.name || !pkg?.version) continue;
      if (pkg.private === true || ignored.has(pkg.name)) continue;
      const dir = relative(rootDir, manifestPath.slice(0, -'/package.json'.length));
      packages.push({ name: pkg.name, dir: dir.split(sep).join('/') });
    }
  }

  return packages.sort((a, b) => b.dir.length - a.dir.length);
}

function packagesCoveredByPendingChangesets(rootDir, pendingChangesets) {
  const covered = new Set();
  for (const name of pendingChangesets) {
    const content = safeRead(join(rootDir, CHANGESET_DIR, `${name}.md`));
    if (!content) continue;
    const frontmatter = content.split('---')[1] ?? '';
    for (const line of frontmatter.split('\n')) {
      const match = line.match(/^\s*['"]?(@[^'"\s:]+\/[^'"\s:]+|[^'"\s:]+)['"]?\s*:/);
      if (match) covered.add(match[1]);
    }
  }
  return covered;
}

function safeRead(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

const slugify = (value) =>
  value
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

export function changesetFileName(packageNames, now = new Date()) {
  const stamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    String(now.getUTCHours()).padStart(2, '0'),
    String(now.getUTCMinutes()).padStart(2, '0'),
    String(now.getUTCSeconds()).padStart(2, '0'),
  ].join('');
  const slug = slugify(packageNames.join('-')).slice(0, 40);
  return `${stamp}-${slug}.md`;
}

// Pure core: given the unreleased changed files, decide which packages need a changeset.
export function planSynthesizedChangeset({
  rootDir,
  changedFiles,
  pendingChangesets = [],
  packages = collectPublishablePackages(rootDir),
}) {
  const covered = packagesCoveredByPendingChangesets(rootDir, pendingChangesets);
  const selected = new Set();

  for (const file of changedFiles) {
    const normalized = file.split(sep).join('/');
    const owner = packages.find(
      (pkg) => normalized === pkg.dir || normalized.startsWith(`${pkg.dir}/`)
    );
    if (!owner) continue;
    if (covered.has(owner.name)) continue;
    if (!isShippingPath(normalized.slice(owner.dir.length + 1))) continue;
    selected.add(owner.name);
  }

  return [...selected].sort();
}

export function renderChangeset(packageNames, summary, bump = DEFAULT_BUMP) {
  const entries = packageNames.map((name) => `  "${name}": ${bump}`).join('\n');
  return `---\n${entries}\n---\n\n${summary}\n`;
}

function git(rootDir, args) {
  const result = spawnSync('git', args, { cwd: rootDir, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

// Absent revisions are ordinary here: the parent of a root commit, or a manifest that did not
// exist yet.
function gitOrNull(rootDir, args) {
  const result = spawnSync('git', args, { cwd: rootDir, encoding: 'utf8' });
  return result.status === 0 ? result.stdout : null;
}

const toLines = (stdout) =>
  stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

function versionAt(rootDir, rev, manifestPath) {
  const content = gitOrNull(rootDir, ['show', `${rev}:${manifestPath}`]);
  if (content === null) return undefined;
  try {
    return JSON.parse(content).version;
  } catch {
    return undefined;
  }
}

// The newest commit reachable from `head` where this package's `version` actually changed. That
// is where the package was last released from, whoever released it: an auto-release bump commit,
// a merged version PR, or a hand-edited version.
//
// `-G` narrows the walk to commits whose manifest diff touched a `version` line, which is always
// a superset of the real bumps — a version change cannot avoid that line. It is only a filter,
// though: a manifest written on one line makes every dependency edit match it. So each candidate
// is confirmed by reading the parsed `version` on both sides, which no formatting can fool.
//
// Returns '' only when the manifest has no reachable history, which the caller reads as "never
// released from here".
function lastVersionBumpCommit(rootDir, head, manifestPath) {
  const candidates = toLines(
    git(rootDir, ['log', '--format=%H', '-G"version":', head, '--', manifestPath])
  );

  for (const candidate of candidates) {
    const after = versionAt(rootDir, candidate, manifestPath);
    // A root commit has no parent, so `undefined` there reads as "the manifest arrived here",
    // which is the release point for a package this repo has never bumped.
    if (after !== versionAt(rootDir, `${candidate}^`, manifestPath)) return candidate;
  }

  return '';
}

// Repo-relative paths under `dir` that changed after `base`, or every tracked path under it
// when the package has no release point to measure against.
function changedFilesSince(rootDir, base, head, dir) {
  if (!base) {
    return toLines(git(rootDir, ['ls-tree', '-r', '--name-only', head, '--', dir]));
  }
  return toLines(git(rootDir, ['diff', '--name-only', base, head, '--', dir]));
}

// The union of every package's own unreleased paths. Safe to flatten: `planSynthesizedChangeset`
// attributes a path to the deepest package that owns it, which is the package whose range
// produced it, so one package's range can never select another.
export function collectUnreleasedFiles({ rootDir, head, packages }) {
  const files = [];
  for (const pkg of packages) {
    const base = lastVersionBumpCommit(rootDir, head, `${pkg.dir}/package.json`);
    files.push(...changedFilesSince(rootDir, base, head, pkg.dir));
  }
  return files;
}

function gitSubject(rootDir, ref) {
  const result = spawnSync('git', ['log', '-1', '--format=%s', ref], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

function parseArgs(argv) {
  const args = { dryRun: false, bump: DEFAULT_BUMP };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg === '--head') args.head = argv[++i];
    else if (arg === '--summary') args.summary = argv[++i];
    else if (arg === '--bump') args.bump = argv[++i];
    else if (arg === '--selection-out') args.selectionOut = argv[++i];
    else if (arg === '--ignore-pending') args.ignorePending = true;
  }
  return args;
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  // `HEAD`, not `GITHUB_SHA`: the release workflow fast-forwards the checkout to the branch tip
  // when a merge landed before the run started, which leaves `GITHUB_SHA` behind the tree being
  // released. The tree is the thing to measure.
  const head = args.head || 'HEAD';

  const packages = collectPublishablePackages(rootDir);
  const changedFiles = collectUnreleasedFiles({ rootDir, head, packages });

  // `--ignore-pending` answers "which packages hold unreleased code", with no regard for who
  // would release them. The workflow's end-of-run check needs that question, because the
  // changeset directory it would otherwise read belongs to the runner's tree, not to `head`: a
  // run that died before `changeset version` leaves its own synthesized changeset sitting there
  // as pending, which would then mask the packages it dropped as somebody else's problem.
  const { pendingChangesets } = args.ignorePending
    ? { pendingChangesets: [] }
    : await detectPendingChangesets(rootDir);

  const selected = planSynthesizedChangeset({
    rootDir,
    changedFiles,
    pendingChangesets,
    packages,
  });

  // Written whether or not anything was selected: the release workflow compares this run's
  // selection against the one still outstanding when the run ends, and an empty selection is a
  // meaningful answer there.
  if (args.selectionOut) {
    writeFileSync(args.selectionOut, `${JSON.stringify(selected, null, 2)}\n`, 'utf8');
  }

  if (selected.length === 0) {
    console.log('synthesized=false');
    console.log('synthesized_packages=');
    console.error(
      pendingChangesets.length > 0
        ? '[release] No changeset synthesized; pending changesets already cover every package with unreleased code.'
        : '[release] No changeset synthesized; no publishable package has unreleased shipping files.'
    );
    return;
  }

  const summary =
    args.summary?.trim() || gitSubject(rootDir, head) || 'Automated prerelease from develop';
  const fileName = changesetFileName(selected);
  const body = renderChangeset(selected, summary, args.bump);

  console.error(`[release] Synthesizing ${CHANGESET_DIR}/${fileName} (${args.bump}):`);
  for (const name of selected) console.error(`  - ${name}`);

  if (!args.dryRun) {
    if (!existsSync(join(rootDir, CHANGESET_DIR))) {
      throw new Error(`${CHANGESET_DIR} does not exist in ${rootDir}`);
    }
    writeFileSync(join(rootDir, CHANGESET_DIR, fileName), body, 'utf8');
  }

  console.log('synthesized=true');
  console.log(`synthesized_packages=${selected.join(',')}`);
  console.log(`changeset_file=${CHANGESET_DIR}/${fileName}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
