#!/usr/bin/env node
/**
 * Detect regressions introduced by an upstream sync.
 *
 * `upstream:sync` / `upstream:update` replace each synced package's `dependencies`
 * wholesale with what upstream declares. Package *versions* survive
 * (resolveSyncedVersion prefers the local value), but any dependency range that
 * was raised locally - by Dependabot, or by hand - is silently reset to
 * upstream's older range.
 *
 * This has bitten twice already. Commit dba8c652 ("fix(sync): restore downgraded
 * deps") manually repaired @mdi/js ^7.4.47 -> ^3.6.95, @tiptap/pm 3.30.2 -> 3.20.0,
 * @visx/curve ^4.0.0 -> ^3.0.0 and others after a sync walked them backwards.
 *
 * Run this after any sync, before committing. It compares the working tree
 * against a git ref and fails on:
 *   - a dependency range that moved backwards
 *   - a package `version` that moved backwards
 *   - a dependency that disappeared entirely
 *
 * Usage:
 *   node scripts/check-sync-regressions.mjs            # compare against HEAD
 *   node scripts/check-sync-regressions.mjs --ref=develop
 *   node scripts/check-sync-regressions.mjs --json
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const refArg = args.find((a) => a.startsWith('--ref='));
const REF = refArg ? refArg.slice('--ref='.length) : 'HEAD';
const AS_JSON = args.includes('--json');

const DEP_BUCKETS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

const git = (gitArgs) =>
  execFileSync('git', gitArgs, { cwd: ROOT, encoding: 'utf-8', maxBuffer: 64 * 1024 * 1024 });

/** Ranges we cannot meaningfully compare - protocol or tag specifiers. */
const isComparable = (range) =>
  typeof range === 'string' &&
  /\d/.test(range) &&
  !/^(workspace:|file:|link:|git|https?:|npm:)/.test(range);

/**
 * Pull the lowest concrete version out of a range and return it as a numeric
 * tuple. Deliberately simple: enough to spot a downgrade without pulling in a
 * semver dependency. Prerelease suffixes are compared as strings at the tail.
 */
const parseFloor = (range) => {
  const match = /(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?/.exec(String(range));
  if (!match) return null;
  return {
    nums: [Number(match[1]), Number(match[2]), Number(match[3])],
    pre: match[4] || '',
  };
};

/** -1 if a < b, 0 if equal, 1 if a > b, null if not comparable. */
const compare = (a, b) => {
  const pa = parseFloor(a);
  const pb = parseFloor(b);
  if (!pa || !pb) return null;
  for (let i = 0; i < 3; i++) {
    if (pa.nums[i] !== pb.nums[i]) return pa.nums[i] < pb.nums[i] ? -1 : 1;
  }
  // A release outranks a prerelease of the same numbers.
  if (pa.pre === pb.pre) return 0;
  if (!pa.pre) return 1;
  if (!pb.pre) return -1;
  return pa.pre < pb.pre ? -1 : 1;
};

const listManifests = () =>
  git(['ls-files', 'packages/*/*/package.json', 'packages/*/package.json'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const readAtRef = (relPath) => {
  try {
    return JSON.parse(git(['show', `${REF}:${relPath}`]));
  } catch {
    return null; // new package, nothing to regress against
  }
};

const readWorking = (relPath) => {
  const abs = path.join(ROOT, relPath);
  if (!existsSync(abs)) return null;
  try {
    return JSON.parse(readFileSync(abs, 'utf-8'));
  } catch {
    return null;
  }
};

const findings = [];

for (const relPath of listManifests()) {
  const before = readAtRef(relPath);
  const after = readWorking(relPath);
  if (!before || !after) continue;

  const pkgName = after.name || before.name || relPath;

  if (isComparable(before.version) && isComparable(after.version)) {
    if (compare(after.version, before.version) === -1) {
      findings.push({
        package: pkgName,
        file: relPath,
        kind: 'version-downgrade',
        field: 'version',
        from: before.version,
        to: after.version,
      });
    }
  }

  for (const bucket of DEP_BUCKETS) {
    const beforeDeps = before[bucket] || {};
    const afterDeps = after[bucket] || {};

    for (const [dep, beforeRange] of Object.entries(beforeDeps)) {
      const afterRange = afterDeps[dep];

      if (afterRange === undefined) {
        findings.push({
          package: pkgName,
          file: relPath,
          kind: 'dependency-removed',
          field: `${bucket}.${dep}`,
          from: beforeRange,
          to: null,
        });
        continue;
      }

      if (!isComparable(beforeRange) || !isComparable(afterRange)) continue;
      if (compare(afterRange, beforeRange) === -1) {
        findings.push({
          package: pkgName,
          file: relPath,
          kind: 'dependency-downgrade',
          field: `${bucket}.${dep}`,
          from: beforeRange,
          to: afterRange,
        });
      }
    }
  }
}

if (AS_JSON) {
  console.log(JSON.stringify({ ref: REF, findings }, null, 2));
} else if (findings.length === 0) {
  console.log(`[check-sync-regressions] OK: no downgrades or removals vs ${REF}`);
} else {
  console.error(`[check-sync-regressions] ${findings.length} regression(s) vs ${REF}:\n`);
  const byPackage = new Map();
  for (const finding of findings) {
    if (!byPackage.has(finding.package)) byPackage.set(finding.package, []);
    byPackage.get(finding.package).push(finding);
  }
  for (const [pkgName, entries] of [...byPackage].sort()) {
    console.error(`- ${pkgName}`);
    for (const entry of entries) {
      const to = entry.to === null ? '(removed)' : entry.to;
      console.error(`  - ${entry.field}: ${entry.from} -> ${to}`);
    }
  }
  console.error(
    "\nAn upstream sync replaces `dependencies` with upstream's ranges, so locally\n" +
      'raised versions get reset. Restore the higher range, or if the downgrade is\n' +
      'intentional, commit it separately with a reason.'
  );
}

process.exit(findings.length === 0 ? 0 : 1);
