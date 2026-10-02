// The package selection and changeset helpers shared by the release scripts: which publishable
// packages hold unreleased shipping code, and the changeset that names them. It has no CLI of
// its own. release-version-snapshot.mjs uses it for develop's `next` snapshots (preview with
// `--dry-run`), release-record-pr-changeset.mjs for each merged PR's changeset.
//
// Only the packages whose own shipping files changed are named. Dependents are left to
// changesets itself, which propagates through `updateInternalDependencies: "patch"`.
//
// "Unreleased" is per package, and is measured from that package's own release point rather than
// from the range of one push (PIE-1073). A push range scopes the release intent to a single
// workflow run: when that run is cancelled or fails, nothing later reconsiders the range, so the
// packages are never released and nothing records that they should have been. Asking "did this
// package's shipping files change after it was last released?" makes every run consider
// everything outstanding, which is what lets a lost run heal on the next merge. The release point
// is the commit the package's published snapshot was built from, or its last version bump in git
// (see `resolveReleaseBase`).

import { readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { globSync } from 'glob';

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

// The `"package": bump` entries of one changeset's frontmatter.
export function parseChangesetReleases(content) {
  const releases = [];
  const frontmatter = content.split('---')[1] ?? '';
  for (const line of frontmatter.split('\n')) {
    const match = line.match(/^\s*['"]?(@[^'"\s:]+\/[^'"\s:]+|[^'"\s:]+)['"]?\s*:\s*(\w+)?/);
    if (match) releases.push({ name: match[1], bump: match[2] });
  }
  return releases;
}

function readPendingReleases(rootDir, pendingChangesets) {
  return pendingChangesets.flatMap((name) => {
    const content = safeRead(join(rootDir, CHANGESET_DIR, `${name}.md`));
    return content ? parseChangesetReleases(content) : [];
  });
}

function packagesCoveredByPendingChangesets(rootDir, pendingChangesets) {
  return new Set(readPendingReleases(rootDir, pendingChangesets).map((release) => release.name));
}

const BUMP_RANK = { patch: 1, minor: 2, major: 3 };

// A snapshot previews the stable release the pending changesets will cut, so each selected
// package takes the largest bump any pending changeset gives it. A pending `major` is what makes
// `next` read `14.0.0-next.<datetime>` ahead of a 14.0.0 release, rather than a patch on 13.x.
export function resolveSnapshotBumps({ rootDir, pendingChangesets, selected }) {
  const pending = readPendingBumps(rootDir, pendingChangesets);
  return new Map(
    selected.map((name) => [name, maxBump(DEFAULT_BUMP, pending.get(name) ?? DEFAULT_BUMP)])
  );
}

const maxBump = (a, b) => ((BUMP_RANK[b] ?? 0) > (BUMP_RANK[a] ?? 0) ? b : a);

// The largest bump the pending changesets give each package they name.
export function readPendingBumps(rootDir, pendingChangesets) {
  const bumps = new Map();
  for (const { name, bump } of readPendingReleases(rootDir, pendingChangesets)) {
    if (!BUMP_RANK[bump]) continue;
    bumps.set(name, maxBump(bumps.get(name) ?? bump, bump));
  }
  return bumps;
}

// Changesets releases a selected package's dependents too, at the bump its dependency rules give
// them (`patch` here), not at their pending bump: multiple-choice would snapshot as 13.4.0-next.*
// beside a pending major that makes its stable release 14.0.0. Given changesets' release plan
// (`changeset status --output`), this returns `bumps` with every planned package raised to its
// pending bump where that is larger, so the dependents preview their stable version too. Null when
// nothing needs raising, which is when the plan already matches.
export function raiseToPendingBumps({ releases, pendingBumps, bumps }) {
  const raised = new Map(bumps);
  let changed = false;
  for (const { name, type } of releases) {
    if (!BUMP_RANK[type]) continue;
    const wanted = maxBump(type, pendingBumps.get(name) ?? type);
    if (wanted !== type && wanted !== raised.get(name)) {
      raised.set(name, maxBump(raised.get(name) ?? wanted, wanted));
      changed = true;
    }
  }
  return changed ? raised : null;
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

// `bump` is one bump for every package, or a Map from package name to its own bump.
export function renderChangeset(packageNames, summary, bump = DEFAULT_BUMP) {
  const bumpOf = (name) => (bump instanceof Map ? (bump.get(name) ?? DEFAULT_BUMP) : bump);
  const entries = packageNames.map((name) => `  "${name}": ${bumpOf(name)}`).join('\n');
  return `---\n${entries}\n---\n\n${summary}\n`;
}

export function git(rootDir, args) {
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

export const toLines = (stdout) =>
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

export const isAncestor = (rootDir, ancestor, descendant) =>
  spawnSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: rootDir })
    .status === 0;

// Where this package was last released from. Without `publishedGitHead` that is its last
// version bump in git.
//
// Snapshot prereleases commit no version, so on develop the last bump stays at the last stable
// release and every package touched since would read as unreleased on every merge. The commit a
// published snapshot was built from — npm records it as `gitHead` — is the release point instead,
// whenever it is on `head`'s history. Otherwise (no snapshot published, or a commit this clone
// does not have) the bump is used, which can only select more, never drop work.
//
// A bump newer than the snapshot does not override it. A version edited by hand on develop, such
// as a base raised past a version another lineage holds, is a bump too, and reading it as a
// release would skip the package and any unreleased code beneath it. After a stable release the
// snapshot does predate the back-merged bump, so the released packages are selected once more and
// `next` moves above `latest` again (`14.0.1-next.*` beside 14.0.0), which is where it belongs.
export function resolveReleaseBase({ rootDir, head, manifestPath, publishedGitHead }) {
  if (publishedGitHead && isAncestor(rootDir, publishedGitHead, head)) return publishedGitHead;
  return lastVersionBumpCommit(rootDir, head, manifestPath);
}

// The union of every package's own unreleased paths. Safe to flatten: `planSynthesizedChangeset`
// attributes a path to the deepest package that owns it, which is the package whose range
// produced it, so one package's range can never select another.
//
// `publishedGitHeads` maps a package name to the `gitHead` of its published snapshot; see
// `resolveReleaseBase`.
export function collectUnreleasedFiles({ rootDir, head, packages, publishedGitHeads }) {
  const files = [];
  for (const pkg of packages) {
    const base = resolveReleaseBase({
      rootDir,
      head,
      manifestPath: `${pkg.dir}/package.json`,
      publishedGitHead: publishedGitHeads?.get(pkg.name),
    });
    files.push(...changedFilesSince(rootDir, base, head, pkg.dir));
  }
  return files;
}

const REGISTRY = 'https://registry.npmjs.org';

const registryUrl = (name, ...rest) =>
  [`${REGISTRY}/${name.replace('/', '%2F')}`, ...rest.map(encodeURIComponent)].join('/');

// A snapshot this repo published: `changeset version --snapshot` with the `{tag}.{datetime}`
// template in .changeset/config.json, so a 14-digit UTC datetime closes the version. Neither the
// old `-next.N` prereleases nor lerna canaries end that way.
export const isOwnSnapshotVersion = (version, distTag) =>
  new RegExp(`-${distTag}\\.\\d{14}$`).test(version);

async function fetchJson(fetchImpl, url, init) {
  const response = await fetchImpl(url, init);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// The newest snapshot this repo published for `name`, read from the abbreviated packument (no
// gitHead there, hence the second request). The datetime suffix orders snapshots on any base.
async function newestOwnSnapshot(fetchImpl, name, distTag) {
  const packument = await fetchJson(fetchImpl, registryUrl(name), {
    headers: { accept: 'application/vnd.npm.install-v1+json' },
  });
  const snapshots = Object.keys(packument?.versions ?? {})
    .filter((version) => isOwnSnapshotVersion(version, distTag))
    .sort((a, b) => a.slice(-14).localeCompare(b.slice(-14)));
  const newest = snapshots.at(-1);
  return newest ? fetchJson(fetchImpl, registryUrl(name, newest)) : null;
}

// The `gitHead` of the latest snapshot this repo published for each package, or null when there
// is none to read. A registry error is a null too, not a failure: null falls back to the last
// version bump, which republishes a package rather than skipping it.
//
// The `distTag` pointer is read first because it is one small request, and it is the answer
// whenever it points at one of this repo's snapshots. It is not trusted beyond that: the legacy
// pie-elements and pie-lib pipelines publish the same names and can move the same `next` tag, and
// a legacy `gitHead` is a commit this repo does not have, which would republish the package on
// every merge until this repo published it again. So when the tag points elsewhere, the packument
// is searched for this repo's newest snapshot. Once the legacy repos no longer publish to `next`,
// the tag alone is enough and the search can go.
//
// `isKnownCommit` skips the search for a tag whose `gitHead` this repo has: that is this repo's
// own old `-next.N` line, before a package's first snapshot, and the packument (megabytes for the
// long-lived elements) would only confirm it. Without it, the tag's `gitHead` is still returned
// when no snapshot exists, and `resolveReleaseBase` uses it only if it is on the measured history.
export async function fetchPublishedGitHeads(
  packages,
  distTag,
  { fetchImpl = fetch, isKnownCommit = () => false } = {}
) {
  const gitHeads = new Map();
  const queue = [...packages];
  const gitHeadOf = (manifest) => (typeof manifest?.gitHead === 'string' ? manifest.gitHead : null);
  const worker = async () => {
    for (let pkg = queue.shift(); pkg; pkg = queue.shift()) {
      try {
        const tagged = await fetchJson(fetchImpl, registryUrl(pkg.name, distTag));
        const taggedHead = gitHeadOf(tagged);
        if (
          !tagged ||
          isOwnSnapshotVersion(tagged.version ?? '', distTag) ||
          (taggedHead && isKnownCommit(taggedHead))
        ) {
          gitHeads.set(pkg.name, taggedHead);
          continue;
        }
        const own = await newestOwnSnapshot(fetchImpl, pkg.name, distTag);
        gitHeads.set(pkg.name, gitHeadOf(own ?? tagged));
      } catch (error) {
        console.error(
          `[release] Could not read ${pkg.name}@${distTag} from npm (${error.message}); measuring it from its last version bump.`
        );
        gitHeads.set(pkg.name, null);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, worker));
  return gitHeads;
}

export function gitSubject(rootDir, ref) {
  const result = spawnSync('git', ['log', '-1', '--format=%s', ref], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  return result.status === 0 ? result.stdout.trim() : '';
}
