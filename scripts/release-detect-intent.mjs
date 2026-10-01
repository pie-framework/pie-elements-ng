import { readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHANGESET_DIR = '.changeset';
// Changesets 3 archives the changesets a prerelease consumed under `.changeset/pre/`.
const PRE_ARCHIVE_DIR = 'pre';

async function readPreState(rootDir) {
  try {
    return JSON.parse(await readFile(join(rootDir, CHANGESET_DIR, 'pre.json'), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

function consumedPrereleaseChangesets(preState) {
  if (preState?.mode !== 'pre' || !Array.isArray(preState.changesets)) {
    return new Set();
  }
  return new Set(preState.changesets.filter((name) => typeof name === 'string'));
}

const markdownChangesets = (entries) =>
  entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith('.md') && name !== 'README.md')
    .map((name) => basename(name, '.md'));

// Changesets reads `.changeset/pre/` on every run and skips it only while prerelease mode is on.
// Outside that mode the archive is pending like any other changeset: the next stable
// `changeset version` consumes it, which is what assembles a stable changelog from everything the
// prereleases shipped.
async function readArchivedChangesets(rootDir, preState) {
  if (preState?.mode === 'pre') return [];
  try {
    const entries = await readdir(join(rootDir, CHANGESET_DIR, PRE_ARCHIVE_DIR), {
      withFileTypes: true,
    });
    return markdownChangesets(entries).map((name) => `${PRE_ARCHIVE_DIR}/${name}`);
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
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

  const preState = await readPreState(rootDir);
  const consumed = consumedPrereleaseChangesets(preState);
  const pendingChangesets = [
    ...markdownChangesets(entries).filter((name) => !consumed.has(name)),
    ...(await readArchivedChangesets(rootDir, preState)),
  ].sort();

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
