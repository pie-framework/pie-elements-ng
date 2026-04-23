import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

type BuildDependency = { name: string; version: string };

interface CacheSaltInput {
  workspaceRoot: string;
  dependencies: BuildDependency[];
  packageDirs: string[];
  requestedBundles: string[];
  resolutionMode: 'workspace-fast' | 'prod-faithful';
  sourceMaps: boolean;
  extraFiles?: string[];
}

const FINGERPRINT_SCHEMA_VERSION = '1';
const DEFAULT_ROOT_FILES = ['bun.lock', 'package.json'];
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
const dirFileCache = new Map<string, { cacheKey: string; files: string[] }>();

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

function listRelevantFiles(dir: string): string[] {
  const stats = statSync(dir);
  const cacheKey = `${stats.mtimeMs}:${stats.size}`;
  const cached = dirFileCache.get(dir);
  if (cached && cached.cacheKey === cacheKey) {
    return cached.files;
  }

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

  files.sort();
  dirFileCache.set(dir, { cacheKey, files });
  return files;
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

function normalizedPackageDirs(workspaceRoot: string, packageDirs: string[]): string[] {
  return sortUnique(
    packageDirs
      .map((dir) => resolve(dir))
      .filter((dir) => dir.startsWith(resolve(workspaceRoot)))
      .filter((dir) => existsSync(dir))
  );
}

export function resolveElementPackageDir(
  workspaceRoot: string,
  packageName: string
): string | null {
  if (!packageName.startsWith('@pie-element/')) {
    return null;
  }
  const elementName = packageName.replace('@pie-element/', '');
  const dir = join(workspaceRoot, 'packages', 'elements-react', elementName);
  return existsSync(dir) ? dir : null;
}

export function createWorkspaceCacheSalt(input: CacheSaltInput): string {
  const workspaceRoot = resolve(input.workspaceRoot);
  const manifestHash = createHash('sha256');
  const packageDirs = normalizedPackageDirs(workspaceRoot, input.packageDirs);
  const rootFiles = [...DEFAULT_ROOT_FILES, ...(input.extraFiles || [])]
    .map((file) => join(workspaceRoot, file))
    .filter((file) => existsSync(file))
    .sort();

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

  for (const packageDir of packageDirs) {
    const files = listRelevantFiles(packageDir);
    for (const filePath of files) {
      manifestHash.update(
        `file:${toPosix(relative(workspaceRoot, filePath))}:${fileDigest(filePath)}\n`
      );
    }
  }

  return `workspace-v${FINGERPRINT_SCHEMA_VERSION}-${manifestHash.digest('hex').slice(0, 24)}`;
}

export function createWorkspaceCacheSaltForDependencies(input: {
  workspaceRoot: string;
  dependencies: BuildDependency[];
  requestedBundles: string[];
  resolutionMode: 'workspace-fast' | 'prod-faithful';
  sourceMaps: boolean;
  extraFiles?: string[];
}): string {
  const packageDirs = input.dependencies
    .map((dep) => resolveElementPackageDir(input.workspaceRoot, dep.name))
    .filter((dir): dir is string => Boolean(dir));

  return createWorkspaceCacheSalt({
    workspaceRoot: input.workspaceRoot,
    dependencies: input.dependencies,
    packageDirs,
    requestedBundles: input.requestedBundles,
    resolutionMode: input.resolutionMode,
    sourceMaps: input.sourceMaps,
    extraFiles: input.extraFiles,
  });
}
