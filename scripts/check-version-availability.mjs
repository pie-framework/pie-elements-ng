#!/usr/bin/env node
/**
 * Refuse to release a version number npm already holds.
 *
 * This repo publishes `@pie-lib/*` and `@pie-element/*` names that
 * pie-framework/pie-lib and pie-framework/pie-elements also publish, and both
 * sides increment the same `<base>-next.N` series. When a bump lands on a
 * number the other lineage already published, npm refuses the overwrite: the
 * package is never published from here, yet every element that pins it keeps
 * resolving whatever tarball does sit at that number - the other repo's build,
 * with a different API surface.
 *
 * That is PIE-1041. `next.9` shipped 28 elements linked against June 2026 lib
 * code, failed 25 of 172 bundle combinations on exports that only exist in this
 * repo's builds (`ToolPropTypeFields`, `InlineMenu`), and left five landed
 * fixes out of the bundles. Nothing in the release pipeline noticed, because
 * nothing asked the registry.
 *
 * Run this after `changeset version` and before the bump is committed or
 * pushed. It reads the versions the bump just produced, asks the registry about
 * each one, and fails on:
 *   - a bumped version that already exists on npm (the collision)
 *   - a bumped version that exists with a different `main` (a foreign lineage,
 *     which is the shape a collision takes here and worth naming explicitly)
 *
 * Only packages whose `version` actually changed against the ref are checked.
 * An unbumped package still sits at its published version, which is expected.
 *
 * Usage:
 *   node scripts/check-version-availability.mjs             # compare against HEAD
 *   node scripts/check-version-availability.mjs --ref=develop
 *   node scripts/check-version-availability.mjs --json
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const refArg = args.find((a) => a.startsWith('--ref='));
const REF = refArg ? refArg.slice('--ref='.length) : 'HEAD';
const AS_JSON = args.includes('--json');
const REGISTRY = (process.env.NPM_CONFIG_REGISTRY || 'https://registry.npmjs.org').replace(
  /\/$/,
  ''
);

const git = (gitArgs) =>
  execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });

const readJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/** Manifests whose `version` differs between the working tree and REF. */
const collectBumpedPackages = () => {
  const changed = git(['diff', '--name-only', REF, '--', '*/package.json'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bumped = [];
  for (const manifest of changed) {
    const local = readJson(readFileSync(manifest, 'utf-8'));
    if (!local?.name || !local.version || local.private === true) continue;

    let previous = null;
    try {
      previous = readJson(git(['show', `${REF}:${manifest}`]));
    } catch {
      // New manifest at this ref - treat as a bump so a brand new package is checked too.
    }
    if (previous?.version === local.version) continue;

    bumped.push({
      manifest,
      name: local.name,
      version: local.version,
      previousVersion: previous?.version ?? null,
      main: local.main ?? null,
    });
  }
  return bumped;
};

const fetchPackument = async (name) => {
  const res = await fetch(`${REGISTRY}/${name.replace('/', '%2F')}`, {
    headers: { accept: 'application/json' },
  });
  if (res.status === 404) return null; // never published - every version is free
  if (!res.ok) throw new Error(`registry lookup for ${name} failed with ${res.status}`);
  return res.json();
};

const main = async () => {
  const bumped = collectBumpedPackages();

  if (bumped.length === 0) {
    const message = `[check-version-availability] no package versions changed vs ${REF}; nothing to check`;
    console.log(AS_JSON ? JSON.stringify({ ok: true, checked: 0, problems: [] }) : message);
    return;
  }

  const problems = [];

  for (const pkg of bumped) {
    let packument;
    try {
      packument = await fetchPackument(pkg.name);
    } catch (error) {
      // A registry that cannot be reached must not wave a release through.
      problems.push({ ...pkg, kind: 'registry-unreachable', detail: String(error.message ?? error) });
      continue;
    }

    const published = packument?.versions?.[pkg.version];
    if (!published) continue;

    const publishedMain = published.main ?? null;
    problems.push({
      ...pkg,
      kind: publishedMain !== pkg.main ? 'taken-by-other-lineage' : 'already-published',
      publishedMain,
      publishedAt: packument?.time?.[pkg.version] ?? null,
    });
  }

  if (AS_JSON) {
    console.log(JSON.stringify({ ok: problems.length === 0, checked: bumped.length, problems }, null, 2));
  } else {
    console.log(`[check-version-availability] checked ${bumped.length} bumped package(s) vs ${REF}`);
    for (const p of problems) {
      if (p.kind === 'registry-unreachable') {
        console.error(`\n- ${p.name}@${p.version}\n  registry lookup failed: ${p.detail}`);
        continue;
      }
      console.error(`\n- ${p.name}@${p.version} is ALREADY ON NPM`);
      if (p.previousVersion) console.error(`  bumped from: ${p.previousVersion}`);
      if (p.publishedAt) console.error(`  published:   ${p.publishedAt.slice(0, 10)}`);
      if (p.kind === 'taken-by-other-lineage') {
        console.error(`  main on npm: ${p.publishedMain} (local: ${p.main}) - a different lineage`);
      }
    }
    if (problems.length > 0) {
      console.error(
        `\n${problems.length} version(s) cannot be published. npm will not overwrite an existing\n` +
          `version, so publishing would leave these bumped in git but unpublished, and every\n` +
          `consumer pinning them would resolve the tarball already at that number.\n\n` +
          `Move the affected packages onto a base the other lineage does not use (a major bump),\n` +
          `then re-run. See PIE-1041.`
      );
    } else {
      console.log('OK: every bumped version is free on npm');
    }
  }

  if (problems.length > 0) process.exitCode = 1;
};

await main();
