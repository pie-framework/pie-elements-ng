#!/usr/bin/env node
/**
 * Assert every publishable manifest declares the canonical `repository` block.
 *
 * npm compares repository.url against the repository it is publishing from when it generates
 * a provenance attestation, and rewrites anything else to the git+https form with a warning.
 * Trusted publishers are registered against that same repository, so a manifest that drifts
 * to a bare `https://` URL — or omits `repository` altogether, as 55 of these did before
 * PIE-834 — is a package whose provenance can quietly stop matching.
 *
 * `repository.directory` is required too: without it, npm and the registry cannot point at
 * the right subdirectory of a monorepo, and provenance links back to the repo root.
 *
 * Usage:
 *   node scripts/check-repository-metadata.mjs
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const EXPECTED_URL = 'git+https://github.com/pie-framework/pie-elements-ng.git';

const rootManifestPath = path.join(ROOT, 'package.json');
if (!existsSync(rootManifestPath)) {
  console.error(
    '[check-repository-metadata] run from the repository root (package.json not found).'
  );
  process.exit(1);
}
const rootManifest = JSON.parse(readFileSync(rootManifestPath, 'utf8'));

/**
 * Expand one workspace glob to directories. `*` is expanded at any position because this
 * repo's `workspaces` mixes plain globs, literal paths and a nested `*​/demo` glob.
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

const dirs = new Set();
for (const entry of rootManifest.workspaces ?? []) {
  for (const dir of expandWorkspaceGlob(entry)) dirs.add(dir);
}

const failures = [];
let checked = 0;

for (const dir of [...dirs].sort()) {
  const manifestPath = path.join(dir, 'package.json');
  if (!existsSync(manifestPath)) continue;
  const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (pkg.private || !pkg.name) continue;
  checked += 1;

  const relDir = path.relative(ROOT, dir).replaceAll('\\', '/');
  const problems = [];
  const repo = pkg.repository;

  if (!repo || typeof repo !== 'object') {
    problems.push('missing a `repository` object');
  } else {
    if (repo.type !== 'git') problems.push('repository.type must be "git"');
    if (repo.url !== EXPECTED_URL) {
      problems.push(`repository.url must be "${EXPECTED_URL}" (got ${JSON.stringify(repo.url)})`);
    }
    if (repo.directory !== relDir) {
      problems.push(
        `repository.directory must be "${relDir}" (got ${JSON.stringify(repo.directory)})`
      );
    }
  }

  if (problems.length > 0) failures.push([pkg.name, relDir, problems]);
}

// Fail closed: a discovery bug that finds nothing must not read as a pass.
if (checked === 0) {
  console.error(
    '[check-repository-metadata] no publishable packages discovered; refusing to report success.'
  );
  process.exit(1);
}

if (failures.length > 0) {
  console.error(
    `[check-repository-metadata] ${failures.length} of ${checked} publishable package(s) have repository problems:\n`
  );
  for (const [name, relDir, problems] of failures) {
    console.error(`  ${name}  (${relDir})`);
    for (const problem of problems) console.error(`    - ${problem}`);
  }
  console.error(
    '\nnpm needs repository.url to match the repository it publishes from for provenance.'
  );
  process.exit(1);
}

console.log(`[check-repository-metadata] OK: validated ${checked} publishable package(s)`);
