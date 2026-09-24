import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const DEFAULT_WORKSPACE_PREFIXES = ['packages/', 'tools/'];

export const readJson = (filePath) => JSON.parse(readFileSync(filePath, 'utf8'));

export const toPosix = (value) => value.replaceAll(path.sep, '/');

export const parseNpmPackJson = (rawOutput) => {
  const text = String(rawOutput || '');
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start < 0 || end < 0 || end < start) {
    throw new Error('npm pack --dry-run --json did not include a JSON payload');
  }
  return JSON.parse(text.slice(start, end + 1));
};

export const getWorkspaceDirs = ({
  root = process.cwd(),
  includePrefixes = DEFAULT_WORKSPACE_PREFIXES,
} = {}) => {
  const rootPkg = readJson(path.join(root, 'package.json'));
  const workspaces = Array.isArray(rootPkg.workspaces) ? rootPkg.workspaces : [];
  const dirs = new Set();

  for (const workspace of workspaces) {
    if (typeof workspace !== 'string') continue;
    if (!includePrefixes.some((prefix) => workspace.startsWith(prefix))) {
      continue;
    }
    if (workspace.endsWith('/*')) {
      const parent = path.join(root, workspace.slice(0, -2));
      if (!existsSync(parent)) continue;
      for (const entry of readdirSync(parent, { withFileTypes: true })) {
        if (entry.isDirectory()) dirs.add(path.join(parent, entry.name));
      }
      continue;
    }
    dirs.add(path.join(root, workspace));
  }

  return [...dirs].filter((dir) => existsSync(path.join(dir, 'package.json')));
};

export const collectJsFiles = (dir, { extensions = ['.js'] } = {}) => {
  if (!existsSync(dir)) return [];
  const extensionSet = new Set(extensions);
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectJsFiles(fullPath, { extensions }));
    } else if (entry.isFile() && extensionSet.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
};

export const defaultPackRunner = ({ dir }) =>
  execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: dir,
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
  });

export const packedFilesFromPackOutput = (rawOutput) => {
  const packData = parseNpmPackJson(rawOutput);
  return new Set((packData?.[0]?.files ?? []).map((entry) => toPosix(entry.path)));
};

export const createPackageSnapshots = ({
  root = process.cwd(),
  includePrivate = false,
  includePackedFiles = false,
  packRunner = defaultPackRunner,
} = {}) => {
  const snapshots = [];

  for (const dir of getWorkspaceDirs({ root })) {
    const pkg = readJson(path.join(dir, 'package.json'));
    if (!includePrivate && pkg.private) continue;
    const snapshot = {
      dir,
      relativeDir: toPosix(path.relative(root, dir)),
      pkg,
    };
    if (includePackedFiles) {
      try {
        snapshot.packedFiles = packedFilesFromPackOutput(packRunner({ dir, pkg, root }));
      } catch (error) {
        snapshot.packError = error;
      }
    }
    snapshots.push(snapshot);
  }

  return snapshots;
};
