/**
 * Discover the workspace packages a `workspace-fast` build links, keyed by package name.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** The scopes the bundler resolves from the workspace. */
export const WORKSPACE_SCOPES = ['@pie-element', '@pie-lib'] as const;

export interface WorkspacePackage {
  name: string;
  dir: string;
}

/**
 * Every package in a `WORKSPACE_SCOPES` scope that the root `package.json` `workspaces` field
 * declares, identified by its `name`. The directory a package lives in plays no part: two folders
 * with the same basename in different groups are distinct packages.
 *
 * Patterns support literal and `*` segments, which is all the root manifest uses.
 */
export function findWorkspacePackages(workspaceRoot: string): WorkspacePackage[] {
  const workspaces = readManifest(join(workspaceRoot, 'package.json'))?.workspaces;
  const patterns: unknown[] = Array.isArray(workspaces)
    ? workspaces
    : isRecord(workspaces) && Array.isArray(workspaces.packages)
      ? workspaces.packages
      : [];

  const byName = new Map<string, WorkspacePackage>();
  for (const pattern of patterns) {
    if (typeof pattern !== 'string') {
      continue;
    }
    for (const dir of expandPattern(workspaceRoot, pattern)) {
      const name = readManifest(join(dir, 'package.json'))?.name;
      if (typeof name !== 'string' || !isWorkspaceScoped(name)) {
        continue;
      }
      const existing = byName.get(name);
      if (existing && existing.dir !== dir) {
        throw new Error(`Workspace package ${name} is declared twice: ${existing.dir} and ${dir}`);
      }
      byName.set(name, { name, dir });
    }
  }

  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const;

/**
 * The workspace packages a `workspace-fast` build of `names` reads: each named package among
 * `packages`, plus every one reachable from it through any dependency section. A source build reads
 * whatever a package imports, and a Svelte element declares the libraries its own build inlines as
 * `devDependencies`. A dependency is followed whatever version it declares, because the build links
 * the workspace copy by name. Names outside `packages`, such as registry-only packages, contribute
 * nothing.
 */
export function workspaceDependencyClosure(
  packages: readonly WorkspacePackage[],
  names: readonly string[]
): WorkspacePackage[] {
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  const reached = new Map<string, WorkspacePackage>();
  const pending = [...names];
  while (pending.length > 0) {
    const pkg = byName.get(pending.pop() as string);
    if (!pkg || reached.has(pkg.name)) {
      continue;
    }
    reached.set(pkg.name, pkg);
    const manifest = readManifest(join(pkg.dir, 'package.json'));
    for (const section of DEPENDENCY_SECTIONS) {
      const declared = manifest?.[section];
      if (isRecord(declared)) {
        pending.push(...Object.keys(declared));
      }
    }
  }
  return Array.from(reached.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function isWorkspaceScoped(name: string): boolean {
  return WORKSPACE_SCOPES.some((scope) => name.startsWith(`${scope}/`));
}

function expandPattern(root: string, pattern: string): string[] {
  let dirs = [root];
  for (const segment of pattern.split('/').filter(Boolean)) {
    const next: string[] = [];
    for (const dir of dirs) {
      if (segment === '*') {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            next.push(join(dir, entry.name));
          }
        }
      } else if (existsSync(join(dir, segment))) {
        next.push(join(dir, segment));
      }
    }
    dirs = next;
  }
  return dirs.filter((dir) => existsSync(join(dir, 'package.json')));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A parsed `package.json`, or undefined when it is missing or unreadable. */
export function readManifest(path: string): Record<string, unknown> | undefined {
  try {
    const manifest: unknown = JSON.parse(readFileSync(path, 'utf-8'));
    return isRecord(manifest) ? manifest : undefined;
  } catch {
    return undefined;
  }
}
