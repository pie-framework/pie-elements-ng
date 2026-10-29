/**
 * Shared vocabulary for npm trusted publishers: which packages a release publishes, which
 * workflow owns each one, and the committed ledger of claims npm has confirmed.
 *
 * This exists so that configure-trusted-publishers.mjs (the interactive operator tool that
 * claims records) and check-trusted-publishers.mjs (the CI guard that refuses to release
 * with an unclaimed package) cannot disagree. They are only useful as a pair: the guard's
 * entire job is to assert that every package the configure tool would claim has in fact
 * been claimed. If each derived the package list separately, a workspace glob one of them
 * failed to expand would drift them apart, and the guard would pass while the release still
 * failed.
 *
 * Ported from pie-players (PIE-833), with this repo's workspace glob expansion.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The workflow that publishes every package in this repo. npm permits exactly ONE trusted
 * publisher per package, and release.yml is the only publish path here, so all packages
 * are registered against it.
 */
export const RELEASE_WORKFLOW = 'release.yml';

/** Committed ledger of claims npm has confirmed, relative to the repository root. */
export const LEDGER_RELATIVE_PATH = 'scripts/trusted-publishers.json';

export function ledgerPath(root) {
  return path.join(root, LEDGER_RELATIVE_PATH);
}

/**
 * owner/repo, taken from repository.url so it cannot drift from what npm validates.
 *
 * Returns null rather than throwing so callers can report it in their own idiom.
 */
export function repositorySlug(rootManifest) {
  const url = rootManifest.repository?.url ?? '';
  const m = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/**
 * Expand one workspace glob to directories.
 *
 * This repo's `workspaces` mixes three shapes — plain globs (`packages/lib-react/*`),
 * literal paths (`packages/element-player`, `tools/cli`) and a nested glob (`packages/elements-react/
 * *​/demo`) — so a `endsWith("/*")` shortcut would silently skip most of the repo, including
 * every package under packages/shared, packages/element-* and tools/cli. A
 * missed package is a package that publishes without a trusted publisher, which is exactly
 * the failure this tooling exists to prevent, so `*` is expanded at any position.
 */
function expandWorkspaceGlob(root, glob) {
  let current = [root];
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

/**
 * Every package a release publishes, as sorted { name, workflow } pairs. Derived from the
 * workspace globs rather than hardcoded so it cannot go stale.
 */
export function publishablePackages(root, rootManifest) {
  const dirs = new Set();
  for (const entry of rootManifest.workspaces ?? []) {
    for (const dir of expandWorkspaceGlob(root, entry)) dirs.add(dir);
  }

  const found = [];
  for (const dir of dirs) {
    const manifestPath = path.join(dir, 'package.json');
    if (!existsSync(manifestPath)) continue;
    const pkg = JSON.parse(readFileSync(manifestPath, 'utf8'));
    if (pkg.private || !pkg.name) continue;
    found.push({ name: pkg.name, workflow: RELEASE_WORKFLOW });
  }
  return found.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Read the ledger, or an empty one if it does not exist yet.
 *
 * The ledger records what npm confirmed, not what someone intended: entries are written
 * only after `npm trust github` exits 0 or `npm trust list` reads the record back. It is
 * deliberately not a live view of npm's state — reading that costs a 2FA round trip per
 * package, which is why the guard cannot simply ask npm and has to trust a committed file.
 * A hand-edited entry will therefore pass the guard and still fail the release; the ledger
 * is a tripwire for the package nobody remembered to claim, not an authorization record.
 */
export function readLedger(root) {
  const file = ledgerPath(root);
  if (!existsSync(file)) return { packages: {} };
  const doc = JSON.parse(readFileSync(file, 'utf8'));
  return { ...doc, packages: doc.packages ?? {} };
}

/**
 * Merge `entries` into the ledger and write it back, preserving unrelated packages.
 *
 * Merging rather than replacing is required because both callers support `--only`: a run
 * that claims three packages must not erase the other sixty-eight. `null` as a value
 * removes that package, which is how a verify that finds no record retracts a stale claim.
 */
export function updateLedger(root, entries) {
  const doc = readLedger(root);
  const packages = { ...doc.packages };
  for (const [name, entry] of Object.entries(entries)) {
    if (entry === null) delete packages[name];
    else packages[name] = entry;
  }
  const sorted = {};
  for (const name of Object.keys(packages).sort()) sorted[name] = packages[name];
  const next = { ...doc, packages: sorted };
  writeFileSync(ledgerPath(root), `${JSON.stringify(next, null, 2)}\n`);
  return next;
}
