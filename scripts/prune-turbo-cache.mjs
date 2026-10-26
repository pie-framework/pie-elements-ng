#!/usr/bin/env node

// Turbo never evicts its local cache, so `.turbo/cache` keeps every build output it ever stored.
// This deletes the entries the current `turbo run build` would not read: CI runs it before saving
// the cache, so the saved cache holds one build, and `--dry-run` reports what it would delete.

import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// turbo.json sets no `cacheDir`, so Turbo uses its default.
const CACHE_DIR = path.join(ROOT, '.turbo', 'cache');
const LABEL = '[prune-turbo-cache]';

// A cache entry is the archive plus its metadata, all named by the task hash.
const ENTRY_FILE = /^([0-9a-f]{16})(?:\.tar\.zst|-meta\.json|-manifest\.json)$/;

// The cache files that belong to no live task hash. Files Turbo did not name by hash are kept.
export function staleCacheFiles(fileNames, liveHashes) {
  return fileNames.filter((name) => {
    const hash = ENTRY_FILE.exec(name)?.[1];
    return hash !== undefined && !liveHashes.has(hash);
  });
}

// The hashes of every task `turbo run build` would run from the current tree.
function liveBuildHashes() {
  const dry = spawnSync('bun', ['x', 'turbo', 'run', 'build', '--dry=json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  if (dry.status !== 0) {
    throw new Error(`turbo run build --dry=json failed:\n${dry.stderr}`);
  }
  return new Set(JSON.parse(dry.stdout).tasks.map((task) => task.hash));
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  let names;
  try {
    names = readdirSync(CACHE_DIR);
  } catch {
    console.log(`${LABEL} No cache at ${path.relative(ROOT, CACHE_DIR)}.`);
    return;
  }

  const live = liveBuildHashes();
  const stale = staleCacheFiles(names, live);
  let bytes = 0;
  for (const name of stale) {
    const file = path.join(CACHE_DIR, name);
    bytes += statSync(file).size;
    if (!dryRun) rmSync(file);
  }
  const megabytes = (bytes / 1024 / 1024).toFixed(0);
  console.log(
    `${LABEL} ${dryRun ? 'Would delete' : 'Deleted'} ${stale.length} of ${names.length} files (${megabytes} MB); kept the entries of ${live.size} build tasks.`
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
