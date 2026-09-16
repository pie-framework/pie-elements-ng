// Derives changesets from the packages a push actually touched, so a merge into develop
// publishes `-next.N` without an author having written a changeset by hand.
//
// Only the packages whose own shipping files changed are named. Dependents are left to
// changesets itself, which propagates through `updateInternalDependencies: "patch"`.
//
// Packages already covered by a pending (unconsumed) changeset in the same push are skipped,
// so a hand-written changeset keeps its bump type and its summary.

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

// Pure core: given the push's changed files, decide which packages need a changeset.
export function planSynthesizedChangeset({ rootDir, changedFiles, pendingChangesets = [] }) {
  const packages = collectPublishablePackages(rootDir);
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

function gitChangedFiles(rootDir, base, head) {
  const objectExists = (ref) =>
    ref &&
    !/^0+$/.test(ref) &&
    spawnSync('git', ['cat-file', '-e', `${ref}^{commit}`], { cwd: rootDir }).status === 0;

  // `github.event.before` is all-zeros for a new branch and stale after a force push.
  const from = objectExists(base) ? base : `${head}^`;
  const result = spawnSync('git', ['diff', '--name-only', from, head], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`git diff ${from}..${head} failed: ${result.stderr || result.stdout}`);
  }
  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
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
    else if (arg === '--base') args.base = argv[++i];
    else if (arg === '--head') args.head = argv[++i];
    else if (arg === '--summary') args.summary = argv[++i];
    else if (arg === '--bump') args.bump = argv[++i];
  }
  return args;
}

async function main() {
  const rootDir = process.cwd();
  const args = parseArgs(process.argv.slice(2));
  const head = args.head || process.env.GITHUB_SHA || 'HEAD';
  const base = args.base || process.env.GITHUB_EVENT_BEFORE || '';

  const changedFiles = gitChangedFiles(rootDir, base, head);
  const { pendingChangesets } = await detectPendingChangesets(rootDir);
  const selected = planSynthesizedChangeset({ rootDir, changedFiles, pendingChangesets });

  if (selected.length === 0) {
    console.log('synthesized=false');
    console.log('synthesized_packages=');
    console.error(
      pendingChangesets.length > 0
        ? '[release] No changeset synthesized; pending changesets already cover every changed package.'
        : '[release] No changeset synthesized; no publishable package had shipping files change.'
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
