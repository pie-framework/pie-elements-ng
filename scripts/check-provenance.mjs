#!/usr/bin/env node
/**
 * Verify that publishable packages carry npm provenance attestations.
 *
 * Trusted publishing (OIDC) generates provenance automatically, so attestations are the
 * observable proof that a release actually went out via the trusted publisher rather than
 * falling back to a token. Their absence on a published version means either the package
 * has no trusted publisher configured or something published it another way.
 *
 * This is a post-release check, and it is the only external one available: the npm registry
 * does not expose trusted-publisher configuration at all, so there is nothing to inspect
 * beforehand. Use `npm trust list <pkg>` (see configure-trusted-publishers.mjs) to confirm
 * configuration ahead of a release.
 *
 * Versioning here is independent (`"fixed": []` in .changeset/config.json), so there is no
 * single release version to check: each package is checked at its own manifest version.
 * That also makes "not published at this version" unremarkable — a package whose current
 * version was never released simply has not been published yet — so it is reported
 * separately and does not fail the run unless --strict is passed. Provenance missing from a
 * version that IS on the registry is the real signal.
 *
 * Usage:
 *   node scripts/check-provenance.mjs                        # every publishable package
 *   node scripts/check-provenance.mjs @pie-element/shared-types ...  # only these
 *   node scripts/check-provenance.mjs --strict               # also fail on not-published
 *   node scripts/check-provenance.mjs --published-json <f>   # check exactly what CI published
 *
 * --published-json takes the `publishedPackages` output of changesets/action, a JSON array
 * of { name, version }. That is the precise set a release just published, so in CI it beats
 * inferring the set from the workspace.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REGISTRY = 'https://registry.npmjs.org';

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');

const publishedJsonIndex = argv.indexOf('--published-json');
const publishedJsonPath = publishedJsonIndex !== -1 ? argv[publishedJsonIndex + 1] : null;
if (publishedJsonIndex !== -1 && !publishedJsonPath) {
  console.error('[check-provenance] --published-json requires a file path.');
  process.exit(1);
}

const explicitNames = argv.filter((a) => !a.startsWith('--') && a !== publishedJsonPath);

const rootManifestPath = path.join(ROOT, 'package.json');
if (!existsSync(rootManifestPath)) {
  console.error('[check-provenance] run from the repository root (package.json not found).');
  process.exit(1);
}
const rootManifest = JSON.parse(readFileSync(rootManifestPath, 'utf8'));

/**
 * Expand one workspace glob to directories.
 *
 * This repo's `workspaces` mixes plain globs, literal paths and a nested `*​/demo` glob, so
 * `*` is expanded at any position rather than only as a trailing segment. Handling only the
 * trailing shape would silently drop most of the repo from the check.
 */
function expandWorkspaceGlob(glob) {
  let current = [ROOT];
  for (const segment of glob.split('/')) {
    const next = [];
    for (const dir of current) {
      if (segment === '*') {
        if (!existsSync(dir)) continue;
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory()) next.push(path.join(dir, entry.name));
        }
      } else {
        next.push(path.join(dir, segment));
      }
    }
    current = next;
  }
  return current;
}

/** Publishable workspace packages, derived rather than hardcoded so it cannot go stale. */
function publishablePackages() {
  const dirs = new Set();
  for (const entry of rootManifest.workspaces ?? []) {
    for (const dir of expandWorkspaceGlob(entry)) dirs.add(dir);
  }

  const out = [];
  for (const dir of dirs) {
    const manifestPath = path.join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (pkg.private || !pkg.name) continue;
    out.push({ name: pkg.name, version: pkg.version });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

let targets;
if (publishedJsonPath) {
  const parsed = JSON.parse(readFileSync(publishedJsonPath, 'utf8'));
  if (!Array.isArray(parsed)) {
    console.error('[check-provenance] --published-json must contain a JSON array.');
    process.exit(1);
  }
  targets = parsed
    .map((p) => ({ name: p.name, version: p.version }))
    .sort((a, b) => a.name.localeCompare(b.name));
  if (targets.length === 0) {
    console.log('[check-provenance] published set is empty; nothing to verify.');
    process.exit(0);
  }
} else {
  const all = publishablePackages();
  if (all.length === 0) {
    console.error('[check-provenance] no publishable packages found.');
    process.exit(1);
  }
  if (explicitNames.length > 0) {
    const known = new Map(all.map((p) => [p.name, p]));
    const unknown = explicitNames.filter((n) => !known.has(n));
    if (unknown.length > 0) {
      console.error(
        `[check-provenance] not publishable packages in this workspace: ${unknown.join(', ')}`
      );
      process.exit(1);
    }
    targets = explicitNames.map((n) => known.get(n));
  } else {
    targets = all;
  }
}

console.log(`[check-provenance] checking ${targets.length} package(s)\n`);

let withProvenance = 0;
const noProvenance = [];
const notPublished = [];
const width = Math.max(...targets.map((t) => `${t.name}@${t.version}`.length)) + 2;

for (const { name, version } of targets) {
  const label = `${name}@${version}`.padEnd(width);
  let doc;
  try {
    const res = await fetch(`${REGISTRY}/${name.replace('/', '%2F')}`);
    doc = await res.json();
  } catch (error) {
    notPublished.push([`${name}@${version}`, `registry fetch failed: ${error.message}`]);
    console.log(`  ${label} FETCH FAILED`);
    continue;
  }

  const entry = doc?.versions?.[version];
  if (!entry) {
    notPublished.push([`${name}@${version}`, 'not on the registry at this version']);
    console.log(`  ${label} not published`);
    continue;
  }

  if (entry.dist?.attestations) {
    console.log(`  ${label} provenance ok`);
    withProvenance++;
  } else {
    noProvenance.push([`${name}@${version}`, 'published without attestations']);
    console.log(`  ${label} NO PROVENANCE`);
  }
}

const published = withProvenance + noProvenance.length;
console.log(
  `\n  with provenance: ${withProvenance}/${published} published   (${notPublished.length} not published)`
);

if (noProvenance.length > 0) {
  console.log(`\n  ${noProvenance.length} published WITHOUT provenance:`);
  for (const [label] of noProvenance) console.log(`    ${label}`);
  console.log('  -> likely no trusted publisher configured, or published via a token.');
  console.log('     Check with: bun run trusted-publishers -- --verify --only <pkg>');
}

if (notPublished.length > 0) {
  console.log(`\n  ${notPublished.length} not published at the workspace version:`);
  for (const [label, why] of notPublished) console.log(`    ${label}: ${why}`);
  console.log(
    strict
      ? '  -> failing because --strict was passed.'
      : '  -> expected when a version has not been released yet; pass --strict to fail on these.'
  );
}

const failed = noProvenance.length > 0 || (strict && notPublished.length > 0);
process.exit(failed ? 1 : 0);
