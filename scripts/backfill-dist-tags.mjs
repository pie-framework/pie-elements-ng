import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { globSync } from 'glob';

const repoRoot = process.cwd();
const VALID_CHANNELS = new Set(['latest']);

const usage = () => {
  console.log(`Usage:
  node scripts/backfill-dist-tags.mjs [--apply] [--packages <pkg1,pkg2>]

Options:
  --apply              Apply npm dist-tag updates (default is dry-run)
  --packages           Optional comma-separated package allowlist
  --help, -h           Show this message

Examples:
  node scripts/backfill-dist-tags.mjs
  node scripts/backfill-dist-tags.mjs --packages @pie-element/extended-text-entry
  node scripts/backfill-dist-tags.mjs --apply --packages @pie-element/extended-text-entry,@pie-element/multiple-choice
`);
};

const parseArgs = (argv) => {
  let apply = false;
  let allowlist = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--apply') {
      apply = true;
      continue;
    }
    if (arg === '--packages') {
      allowlist = String(argv[i + 1] || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    apply,
    allowlist: new Set(allowlist),
  };
};

const run = (cmd, args) => {
  const result = spawnSync(cmd, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.error) throw result.error;
  return result;
};

const parseJsonOutput = (raw) => {
  const text = String(raw || '').trim();
  if (!text) return null;
  return JSON.parse(text);
};

const parseStableSemver = (version) => {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version || '').trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    raw: match[0],
  };
};

const compareStable = (a, b) => {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
};

const loadWorkspacePackageNames = () => {
  const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  const workspacePatterns = Array.isArray(rootPackage.workspaces) ? rootPackage.workspaces : [];
  const packageJsonPaths = new Set();

  for (const workspacePattern of workspacePatterns) {
    const matches = globSync(join(workspacePattern, 'package.json'), {
      cwd: repoRoot,
      absolute: true,
      ignore: ['**/node_modules/**'],
    });
    for (const match of matches) packageJsonPaths.add(match);
  }

  const names = new Set();
  for (const packageJsonPath of packageJsonPaths) {
    try {
      const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      if (pkg?.name?.startsWith('@pie-element/') && pkg.private !== true) {
        names.add(pkg.name);
      }
    } catch {
      // Ignore invalid package manifests.
    }
  }

  return [...names].sort();
};

const getRegistryVersions = (packageName) => {
  const result = run('npm', ['view', packageName, 'versions', '--json']);
  if (result.status !== 0) return [];
  const parsed = parseJsonOutput(result.stdout);
  if (Array.isArray(parsed)) return parsed;
  if (typeof parsed === 'string' && parsed.trim()) return [parsed.trim()];
  return [];
};

const getRegistryTags = (packageName) => {
  const result = run('npm', ['view', packageName, 'dist-tags', '--json']);
  if (result.status !== 0) return {};
  const parsed = parseJsonOutput(result.stdout);
  if (parsed && typeof parsed === 'object') return parsed;
  return {};
};

const findHighestStableVersion = (versions) => {
  const stable = versions
    .map((version) => parseStableSemver(version))
    .filter(Boolean)
    .sort(compareStable);
  if (stable.length === 0) return null;
  return stable[stable.length - 1].raw;
};

const applyLatestTag = (packageName, version) => {
  const result = run('npm', ['dist-tag', 'add', `${packageName}@${version}`, 'latest']);
  if (result.status !== 0) {
    throw new Error(
      `[backfill] Failed to set latest for ${packageName}@${version}\n${result.stderr || result.stdout}`
    );
  }
};

const main = () => {
  const { apply, allowlist } = parseArgs(process.argv.slice(2));
  const discovered = loadWorkspacePackageNames();
  const candidates =
    allowlist.size > 0
      ? discovered.filter((name) => allowlist.has(name))
      : discovered;

  if (candidates.length === 0) {
    console.log('[backfill] No matching @pie-element/* packages found.');
    return;
  }

  if (allowlist.size > 0) {
    const missing = [...allowlist].filter((name) => !discovered.includes(name));
    if (missing.length > 0) {
      console.warn(`[backfill] Warning: package(s) not found in workspace: ${missing.join(', ')}`);
    }
  }

  console.log(
    `[backfill] Auditing ${candidates.length} package(s) in ${apply ? 'apply' : 'dry-run'} mode`
  );

  const updates = [];
  for (const packageName of candidates) {
    const versions = getRegistryVersions(packageName);
    if (versions.length === 0) {
      console.log(`[backfill] Skipping ${packageName} (no versions on npm registry)`);
      continue;
    }
    const distTags = getRegistryTags(packageName);
    const latestTag = String(distTags.latest || '').trim();
    const highestStable = findHighestStableVersion(versions);
    if (!highestStable) {
      console.log(`[backfill] Skipping ${packageName} (no stable semver versions found)`);
      continue;
    }

    if (!VALID_CHANNELS.has('latest')) {
      throw new Error('[backfill] Internal invariant violated: latest channel missing.');
    }

    if (latestTag === highestStable) {
      console.log(`[backfill] OK ${packageName} latest=${latestTag}`);
      continue;
    }

    updates.push({
      packageName,
      from: latestTag || '(unset)',
      to: highestStable,
    });
  }

  if (updates.length === 0) {
    console.log('[backfill] No stale latest tags detected.');
    return;
  }

  console.log(`[backfill] Found ${updates.length} package(s) with stale latest tags:`);
  for (const update of updates) {
    console.log(
      `  - ${update.packageName}: latest ${update.from} -> ${update.to} (npm dist-tag add ${update.packageName}@${update.to} latest)`
    );
  }

  if (!apply) {
    console.log('[backfill] Dry-run complete. Re-run with --apply to update tags.');
    return;
  }

  for (const update of updates) {
    console.log(`[backfill] Applying latest tag for ${update.packageName}@${update.to}`);
    applyLatestTag(update.packageName, update.to);
  }

  console.log('[backfill] Tag backfill complete.');
};

main();
