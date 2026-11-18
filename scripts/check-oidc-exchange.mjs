#!/usr/bin/env node
/**
 * Fail before anything publishes if npm would refuse the OIDC token exchange for a package.
 *
 * check-trusted-publishers.mjs only reads the committed ledger, so it cannot see a record
 * that was revoked and re-created behind the repo's back. npm sometimes refuses such a
 * record: `npm trust list` shows it bound to this repo and workflow, but the exchange
 * returns 404 "OIDC token exchange error - package not found", and `npm publish` surfaces
 * only ENEEDAUTH. The release then publishes every package that sorts before the broken one
 * and fails on it, leaving a partial release (PIE-883 / PIE-1469).
 *
 * This asks npm the same question `npm publish` asks, for every package the run will
 * publish, using the run's own GitHub id-token, and lists every package that gets refused in
 * one failure. The exchange mints a short-lived publish credential; this script never prints
 * or stores it.
 *
 * Which packages: RELEASE_PACKAGES (comma separated) when set, as the develop snapshot step
 * provides it; otherwise every publishable package, because a changesets run only knows its
 * selection after it has versioned.
 *
 * Needs `id-token: write` on the job and a GitHub-hosted runner.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { publishablePackages } from './lib/trusted-publishers.mjs';

const REGISTRY = 'https://registry.npmjs.org';
const AUDIENCE = 'npm:registry.npmjs.org';

export function exchangeUrl(name, registry = REGISTRY) {
  return `${registry}/-/npm/v1/oidc/token/exchange/package/${encodeURIComponent(name)}`;
}

/** Which packages to check: the explicit selection when given, else every publishable one. */
export function selectPackages({ selection, publishable }) {
  const wanted = String(selection ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (wanted.length === 0) return publishable.map((p) => p.name);
  return [...new Set(wanted)];
}

/**
 * Turn per-package exchange statuses into failures with a remedy per status.
 *
 * Pure, so the vocabulary is testable without a network. `results` is
 * [{ name, status, message? }] where status is the HTTP status, or 0 for a network error.
 */
export function collectExchangeFailures(results) {
  const failures = [];
  const refused = [];
  for (const { name, status, message } of results) {
    if (status === 201 || status === 200) continue;
    if (status === 404) {
      refused.push(name);
      failures.push(
        `${name}: npm refused the token exchange (404 ${message || 'package not found'}). Its trusted-publisher record is missing, bound to another repo or workflow, or one npm will not honour.`
      );
    } else if (status === 0) {
      failures.push(`${name}: could not reach npm (${message || 'network error'})`);
    } else {
      failures.push(
        `${name}: unexpected exchange status ${status}${message ? ` (${message})` : ''}`
      );
    }
  }
  return { failures, refused };
}

export function remedyFor(refused) {
  if (refused.length === 0) return '';
  const lines = refused.map(
    (name) =>
      `    npm trust list ${name} --json\n` +
      `    npm trust revoke ${name} --id <bare-uuid-from-the-list>\n` +
      `    npm trust github ${name} --repository pie-framework/pie-elements-ng --file release.yml --allow-publish --allow-stage-publish`
  );
  return (
    '\n  Revoke and re-create each refused record from a local terminal (Node 24, one command at a time).\n' +
    '  A re-created record can take from a few minutes to about an hour to take effect, so wait, then\n' +
    '  re-run the whole workflow (not only the failed jobs):\n\n' +
    lines.join('\n\n')
  );
}

async function fetchIdToken(env) {
  const base = env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const bearer = env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!base || !bearer) {
    throw new Error(
      'no GitHub id-token available (ACTIONS_ID_TOKEN_REQUEST_URL is unset). The job needs `permissions: id-token: write`.'
    );
  }
  const url = `${base}${base.includes('?') ? '&' : '?'}audience=${encodeURIComponent(AUDIENCE)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${bearer}` } });
  if (!res.ok) throw new Error(`id-token request failed with HTTP ${res.status}`);
  const body = await res.json();
  if (!body.value) throw new Error('id-token response had no value');
  return body.value;
}

async function exchangeOnce(name, idToken, fetchImpl = fetch) {
  try {
    const res = await fetchImpl(exchangeUrl(name), {
      method: 'POST',
      headers: { Authorization: `Bearer ${idToken}` },
    });
    let message = '';
    if (res.status !== 201 && res.status !== 200) {
      try {
        const body = await res.json();
        message = String(body.message ?? body.error ?? '');
      } catch {
        // body is informational only
      }
    }
    // Deliberately do not read the body on success: it carries the minted credential.
    return { name, status: res.status, message };
  } catch (error) {
    return { name, status: 0, message: error instanceof Error ? error.message : String(error) };
  }
}

/** Bounded concurrency, so ~70 packages take seconds without hammering npm. */
async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  const root = process.cwd();
  const manifestPath = path.join(root, 'package.json');
  if (!existsSync(manifestPath)) {
    console.error('[check-oidc-exchange] run from the repository root (package.json not found).');
    process.exit(1);
  }
  const rootManifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const names = selectPackages({
    selection: process.env.RELEASE_PACKAGES,
    publishable: publishablePackages(root, rootManifest),
  });

  let idToken;
  try {
    idToken = await fetchIdToken(process.env);
  } catch (error) {
    console.error(`[check-oidc-exchange] ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  const results = await mapLimit(names, 6, (name) => exchangeOnce(name, idToken));
  const { failures, refused } = collectExchangeFailures(results);

  if (failures.length > 0) {
    console.error(
      `[check-oidc-exchange] npm refused the OIDC exchange for ${failures.length} of ${names.length} package(s). Nothing was published.`
    );
    for (const failure of failures) console.error(`  - ${failure}`);
    console.error(remedyFor(refused));
    process.exit(1);
  }
  console.log(
    `[check-oidc-exchange] OK: npm accepted the OIDC exchange for ${names.length} package(s)`
  );
}
