#!/usr/bin/env node
/**
 * Refuse to publish while any publishable package has no recorded trusted-publisher claim.
 *
 * Under OIDC, npm authenticates each package against its own trusted-publisher record. A
 * package with no record fails with ENEEDAUTH while the rest of the run publishes, which
 * leaves a partial release. pie-players shipped exactly that: its 0.3.61 release published
 * @pie-players/pie-theme and failed the other 35 packages, because only pie-theme had been
 * configured.
 *
 * Nothing else in CI catches it. The credential preflight (check-npm-auth.mjs) is gated to
 * token mode by design — OIDC has no credential to check — and asking npm whether a record
 * exists costs a 2FA round trip per package, so it cannot run on a runner at all. The gap
 * this closes is therefore specifically the *newly added* package: claiming a record is a
 * manual step that is easy to forget, and the next release is where you find out.
 *
 * So the claim is recorded in a committed ledger (scripts/trusted-publishers.json), written
 * by configure-trusted-publishers.mjs when npm confirms a record, and this check asserts the
 * ledger covers every publishable package.
 *
 * Every package, not just the ones this run publishes. Versioning here is independent, so a
 * run publishes only what changed, and an unclaimed package would otherwise pass every
 * release until the one that happens to include it.
 *
 * What this does and does not prove:
 *
 * - It proves nobody added a publishable package without going through the claim step.
 * - It does not prove npm's current state. The ledger is a record of what npm confirmed at
 *   claim time, not a live read; a revoked record, or an entry someone hand-wrote, passes
 *   here and still fails the release. `--verify` on the configure script is the live check,
 *   and check-provenance.mjs is the after-the-fact one.
 *
 * Ported from pie-players (PIE-833).
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  LEDGER_RELATIVE_PATH,
  publishablePackages,
  readLedger,
  repositorySlug,
} from './lib/trusted-publishers.mjs';

const ROOT = process.cwd();

/**
 * Compare the packages a release publishes against the recorded claims.
 *
 * Pure, so the failure vocabulary can be tested without a workspace on disk.
 */
export function collectTrustedPublisherFailures({ packages, ledger, slug }) {
  const failures = [];
  const unclaimed = [];
  for (const { name, workflow } of packages) {
    const entry = ledger.packages?.[name];
    if (!entry) {
      unclaimed.push(name);
      failures.push(
        `${name}: no trusted publisher claim recorded in ${LEDGER_RELATIVE_PATH} — publishing will fail with ENEEDAUTH`
      );
      continue;
    }
    // npm permits exactly one trusted publisher per package, so naming the wrong workflow
    // does not merely fail, it occupies the slot the right workflow needs.
    if (entry.workflow !== workflow) {
      failures.push(
        `${name}: claim names workflow ${JSON.stringify(entry.workflow)}, but this package is published by ${JSON.stringify(workflow)}`
      );
    }
    if (slug && entry.repository !== slug) {
      failures.push(
        `${name}: claim names repository ${JSON.stringify(entry.repository)}, expected ${JSON.stringify(slug)}`
      );
    }
  }
  return { failures, unclaimed };
}

/**
 * Split unclaimed packages by whether the registry knows their name, because the remedy
 * differs and only one of the two is possible.
 *
 * `npm trust github` attaches a record to an existing package and fails with `E404 Package
 * not found` otherwise, so a package that has never been published cannot be claimed at all
 * — it has to be published once by hand first.
 *
 * `isPublished(name)` is supplied by the caller so the routing can be asserted without a
 * registry.
 */
export function partitionUnclaimedByRegistry({ unclaimed, isPublished }) {
  const needsFirstPublish = [];
  const needsClaim = [];
  for (const name of unclaimed) {
    (isPublished(name) ? needsClaim : needsFirstPublish).push(name);
  }
  return { needsFirstPublish, needsClaim };
}

/**
 * Does the registry know this package name?
 *
 * Only reached on the failure path, for the handful of unclaimed packages. A read that fails
 * for any reason other than a 404 answers "yes", which routes to the claim command: that is
 * the conservative direction, since suggesting a first publish for a package that already
 * exists is the more expensive mistake.
 */
function registryKnows(name) {
  const res = spawnSync('npm', ['view', name, 'version', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (res.status === 0) return true;
  const detail = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  return !/E404|404 Not Found/.test(detail);
}

/** Ledger entries for packages this repo no longer publishes. Reported, never fatal. */
export function collectStaleClaims({ packages, ledger }) {
  const names = new Set(packages.map((p) => p.name));
  return Object.keys(ledger.packages ?? {}).filter((n) => !names.has(n));
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  const rootManifestPath = path.join(ROOT, 'package.json');
  if (!existsSync(rootManifestPath)) {
    console.error(
      '[check-trusted-publishers] run from the repository root (package.json not found).'
    );
    process.exit(1);
  }
  const rootManifest = JSON.parse(readFileSync(rootManifestPath, 'utf8'));
  const slug = repositorySlug(rootManifest);
  const packages = publishablePackages(ROOT, rootManifest);
  const ledger = readLedger(ROOT);

  const { failures, unclaimed } = collectTrustedPublisherFailures({ packages, ledger, slug });

  for (const name of collectStaleClaims({ packages, ledger })) {
    console.log(
      `[check-trusted-publishers] note: ${name} has a recorded claim but is no longer published by this repo`
    );
  }

  if (failures.length > 0) {
    console.error(
      `[check-trusted-publishers] Found ${failures.length} trusted-publisher problem(s) across ${packages.length} package(s)`
    );
    for (const failure of failures) console.error(`  - ${failure}`);
    if (unclaimed.length > 0) {
      const { needsFirstPublish, needsClaim } = partitionUnclaimedByRegistry({
        unclaimed,
        isPublished: registryKnows,
      });

      if (needsClaim.length > 0) {
        console.error(
          `\n  Claim the missing record(s) from a local terminal (one OTP each), which records them in ${LEDGER_RELATIVE_PATH}:\n` +
            '    npm login\n' +
            `    bun run trusted-publishers -- --apply --only ${needsClaim.join(',')}\n` +
            '\n  Then commit the updated ledger.'
        );
      }

      // A name npm has never seen cannot be claimed: `npm trust` has nothing to attach to.
      // One interactive publish creates it, after which the claim is possible and every
      // later version ships through the release workflow.
      for (const name of needsFirstPublish) {
        console.error(
          `\n  ${name} has never been published, so it cannot be claimed yet — a trusted\n` +
            '  publisher attaches to an existing package. Publish it once by hand from a local\n' +
            '  terminal (npm login, then npm publish with your OTP), then claim it:\n' +
            `    bun run trusted-publishers -- --apply --only ${name}\n` +
            '\n  Then commit the updated ledger.'
        );
      }
    }
    process.exit(1);
  }

  console.log(
    `[check-trusted-publishers] OK: ${packages.length} package(s) have a recorded trusted-publisher claim`
  );
}
