import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHANGESET_DIR = '.changeset';

async function readConsumedPrereleaseChangesets(rootDir) {
  const preJsonPath = join(rootDir, CHANGESET_DIR, 'pre.json');
  let content;
  try {
    content = await readFile(preJsonPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return new Set();
    }
    throw error;
  }

  const preState = JSON.parse(content);
  if (preState?.mode !== 'pre' || !Array.isArray(preState.changesets)) {
    return new Set();
  }
  return new Set(preState.changesets.filter((name) => typeof name === 'string'));
}

export async function detectPendingChangesets(rootDir = process.cwd()) {
  const changesetDir = join(rootDir, CHANGESET_DIR);
  let entries;
  try {
    entries = await readdir(changesetDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return { hasChangesets: false, pendingChangesets: [] };
    }
    throw error;
  }

  const consumed = await readConsumedPrereleaseChangesets(rootDir);
  const pendingChangesets = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .map((name) => basename(name, '.md'))
    .filter((name) => !consumed.has(name))
    .sort();

  return {
    hasChangesets: pendingChangesets.length > 0,
    pendingChangesets,
  };
}

async function main() {
  const rootDir = process.argv[2] || process.cwd();
  const result = await detectPendingChangesets(rootDir);
  console.log(`has_changesets=${result.hasChangesets ? 'true' : 'false'}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
