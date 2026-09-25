import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { findWorkspacePackages, workspaceDependencyClosure } from '@pie-element/element-bundler';

type BuildDependency = { name: string; version: string };

interface CacheSaltInput {
  workspaceRoot: string;
  dependencies: BuildDependency[];
  requestedBundles: string[];
  resolutionMode: 'workspace-fast' | 'prod-faithful';
  sourceMaps: boolean;
}

const FINGERPRINT_SCHEMA_VERSION = '2';
const BUNDLER_PACKAGE = '@pie-element/element-bundler';
const ROOT_FILES = ['bun.lock', 'package.json'];
const SKIP_DIRS = new Set([
  '.git',
  '.cache',
  '.turbo',
  '.svelte-kit',
  'node_modules',
  'dist',
  'build',
  'coverage',
]);
const HASHED_EXTENSIONS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.svelte',
  '.json',
  '.md',
  '.css',
  '.scss',
  '.sass',
  '.less',
  '.html',
  '.yaml',
  '.yml',
]);

const fileHashCache = new Map<string, { cacheKey: string; digest: string }>();

function extension(path: string): string {
  const idx = path.lastIndexOf('.');
  return idx >= 0 ? path.slice(idx) : '';
}

function toPosix(path: string): string {
  return path.replace(/\\/g, '/');
}

function sortUnique(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

// Walked on every call: a directory's mtime changes only when its own entries do, so a file list
// cached on it would miss files added or removed in nested directories.
function listRelevantFiles(dir: string): string[] {
  const files: string[] = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const entries = readdirSync(current, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    for (const entry of entries) {
      const next = join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) {
          stack.push(next);
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (HASHED_EXTENSIONS.has(extension(entry.name))) {
        files.push(next);
      }
    }
  }

  return files.sort();
}

function fileDigest(path: string): string {
  const stats = statSync(path);
  const cacheKey = `${stats.mtimeMs}:${stats.size}`;
  const cached = fileHashCache.get(path);
  if (cached && cached.cacheKey === cacheKey) {
    return cached.digest;
  }

  const digest = createHash('sha256').update(readFileSync(path)).digest('hex');
  fileHashCache.set(path, { cacheKey, digest });
  return digest;
}

function dependencySignature(dependencies: BuildDependency[]): string {
  return dependencies
    .map((dep) => `${dep.name}@${dep.version || 'latest'}`)
    .sort()
    .join('+');
}

/**
 * The directories a `workspace-fast` build of `dependencies` reads: every workspace package in
 * their `dependencies` closure, and the bundler's own sources. A bundler resolved from the registry
 * has no workspace sources; `bun.lock` pins it instead.
 */
export function workspaceBuildInputDirs(
  workspaceRoot: string,
  dependencies: BuildDependency[]
): string[] {
  const packages = findWorkspacePackages(workspaceRoot);
  const dirs = workspaceDependencyClosure(
    packages,
    dependencies.map((dep) => dep.name)
  ).map((pkg) => pkg.dir);
  const bundler = packages.find((pkg) => pkg.name === BUNDLER_PACKAGE);
  if (bundler) {
    dirs.push(join(bundler.dir, 'src'));
  }
  return sortUnique(dirs.map((dir) => resolve(dir)).filter((dir) => existsSync(dir)));
}

export function createWorkspaceCacheSaltForDependencies(input: CacheSaltInput): string {
  const workspaceRoot = resolve(input.workspaceRoot);
  const manifestHash = createHash('sha256');
  const rootFiles = ROOT_FILES.map((file) => join(workspaceRoot, file)).filter((file) =>
    existsSync(file)
  );

  manifestHash.update(`schema:${FINGERPRINT_SCHEMA_VERSION}\n`);
  manifestHash.update(`resolution:${input.resolutionMode}\n`);
  manifestHash.update(`sourceMaps:${input.sourceMaps ? '1' : '0'}\n`);
  manifestHash.update(`bundles:${sortUnique(input.requestedBundles).join(',')}\n`);
  manifestHash.update(`deps:${dependencySignature(input.dependencies)}\n`);

  for (const filePath of rootFiles) {
    manifestHash.update(
      `file:${toPosix(relative(workspaceRoot, filePath))}:${fileDigest(filePath)}\n`
    );
  }

  for (const dir of workspaceBuildInputDirs(workspaceRoot, input.dependencies)) {
    for (const filePath of listRelevantFiles(dir)) {
      manifestHash.update(
        `file:${toPosix(relative(workspaceRoot, filePath))}:${fileDigest(filePath)}\n`
      );
    }
  }

  return `workspace-v${FINGERPRINT_SCHEMA_VERSION}-${manifestHash.digest('hex').slice(0, 24)}`;
}
