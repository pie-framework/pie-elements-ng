// Moves each prerelease that `changeset version` just produced off a number npm already holds.
//
// pie-framework/pie-elements and pie-framework/pie-lib publish the same package names into the
// same `<base>-next.N` series, and npm never overwrites a version (PIE-1041). A bump that lands
// on a taken number moves to the lowest free number above it, on the same base and tag, so the
// gaps below npm's highest number fill first: the legacy pipelines publish above it.
//
// Runs between `changeset version` and `bun install --lockfile-only`, so the lockfile records
// the moved version. It rewrites the version string everywhere changesets wrote it: the package
// manifest, the package's CHANGELOG heading, and dependents' literal ranges and "Updated
// dependencies" lines. `workspace:` ranges resolve from the manifest at publish time.
//
// A stable version npm already holds is left for check-version-availability.mjs, which runs
// after this script and fails the release.
//
// Usage:
//   node scripts/skip-taken-prereleases.mjs              # packages bumped against HEAD
//   node scripts/skip-taken-prereleases.mjs --ref=develop

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PRERELEASE = /^(\d+\.\d+\.\d+)-([0-9A-Za-z-]+)\.(\d+)$/;
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
];
const RANGE = /^(workspace:)?(\^|~|>=|=)?(.+)$/;

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The lowest `<base>-<tag>.N` above `version` that `taken` does not hold. Null when `version` is
 * free, or is not a prerelease.
 */
export function nextFreePrerelease(version, taken) {
  if (!taken.has(version)) return null;
  const match = PRERELEASE.exec(version);
  if (!match) return null;
  const [, base, tag, number] = match;
  for (let n = Number(number) + 1; ; n += 1) {
    const candidate = `${base}-${tag}.${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * Every version npm has held for `name`. An unpublished version stays in `time`, and npm refuses
 * to publish its number again.
 */
export async function fetchTakenVersions(
  name,
  {
    registry = process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org',
    fetchImpl = fetch,
  } = {}
) {
  const response = await fetchImpl(`${registry.replace(/\/$/, '')}/${name.replace('/', '%2F')}`, {
    headers: { accept: 'application/json' },
  });
  if (response.status === 404) return new Set();
  if (!response.ok) throw new Error(`registry lookup for ${name} failed with ${response.status}`);
  const packument = await response.json();
  const taken = new Set(Object.keys(packument.versions ?? {}));
  for (const key of Object.keys(packument.time ?? {})) {
    if (key !== 'created' && key !== 'modified') taken.add(key);
  }
  return taken;
}

function readChangedManifests({ root, ref, git }) {
  return git(['diff', '--name-only', ref, '--', '*/package.json'])
    .split('\n')
    .map((line) => line.trim())
    .filter((path) => path && existsSync(join(root, path)))
    .map((path) => {
      const text = readFileSync(join(root, path), 'utf8');
      let previous = null;
      try {
        previous = JSON.parse(git(['show', `${ref}:${path}`]));
      } catch {
        // The manifest is new at this ref.
      }
      return { path, text, manifest: JSON.parse(text), previousVersion: previous?.version ?? null };
    });
}

const moveRange = (range, { from, to }) => {
  const match = RANGE.exec(range);
  return match && match[3] === from ? `${match[1] ?? ''}${match[2] ?? ''}${to}` : range;
};

function rewriteManifest(root, { path, text, manifest }, movesByName) {
  let changed = false;
  const own = movesByName.get(manifest.name);
  if (own && manifest.version === own.from) {
    manifest.version = own.to;
    changed = true;
  }
  for (const field of DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      const move = movesByName.get(name);
      const moved = move ? moveRange(range, move) : range;
      if (moved !== range) {
        manifest[field][name] = moved;
        changed = true;
      }
    }
  }
  if (!changed) return;
  // changesets writes manifests as JSON.stringify output, so this changes only the moved values.
  const indent = /^[ \t]+(?=")/m.exec(text)?.[0] ?? 2;
  const newline = text.endsWith('\n') ? '\n' : '';
  writeFileSync(join(root, path), `${JSON.stringify(manifest, null, indent)}${newline}`);
}

function rewriteChangelog(file, ownName, moves) {
  if (!existsSync(file)) return;
  const text = readFileSync(file, 'utf8');
  let next = text;
  for (const { name, from, to } of moves) {
    if (name === ownName) {
      next = next.replace(new RegExp(`^## ${escapeRegExp(from)}$`, 'm'), `## ${to}`);
    }
    next = next.replace(
      new RegExp(`(?<![\\w@/.-])${escapeRegExp(`${name}@${from}`)}(?![\\w.+-])`, 'g'),
      `${name}@${to}`
    );
  }
  if (next !== text) writeFileSync(file, next);
}

/**
 * Moves every public package whose version changed against `ref` onto a free prerelease number,
 * and returns the moves it made.
 */
export async function skipTakenPrereleases({ root, ref = 'HEAD', git, takenVersions }) {
  const manifests = readChangedManifests({ root, ref, git });
  const moves = [];
  for (const { path, manifest, previousVersion } of manifests) {
    const { name, version } = manifest;
    if (!name || !version || manifest.private === true) continue;
    if (version === previousVersion || !PRERELEASE.test(version)) continue;
    const to = nextFreePrerelease(version, await takenVersions(name));
    if (to) moves.push({ name, path, from: version, to });
  }
  if (moves.length === 0) return moves;

  const movesByName = new Map(moves.map((move) => [move.name, move]));
  for (const entry of manifests) {
    rewriteManifest(root, entry, movesByName);
    rewriteChangelog(join(root, dirname(entry.path), 'CHANGELOG.md'), entry.manifest.name, moves);
  }
  return moves;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = process.cwd();
  const refArg = process.argv.slice(2).find((arg) => arg.startsWith('--ref='));
  const moves = await skipTakenPrereleases({
    root,
    ref: refArg ? refArg.slice('--ref='.length) : 'HEAD',
    git: (args) =>
      execFileSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }),
    takenVersions: (name) => fetchTakenVersions(name),
  });
  for (const { name, from, to } of moves) {
    console.log(`[skip-taken-prereleases] ${name}@${from} is taken on npm; using ${to}`);
  }
  if (moves.length === 0) {
    console.log('[skip-taken-prereleases] no bumped prerelease is taken on npm');
  }
}
