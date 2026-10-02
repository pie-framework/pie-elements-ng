/**
 * Package installer - downloads and installs PIE element packages using Bun
 * Simplified from pie-api-aws/packages/bundler/src/installers/
 */

import { execSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import pacote from 'pacote';
import type { BuildDependency, BuildResolutionMode } from './types.js';
import { createWorkspacePackageJson } from './runtime-template.js';
import { WORKSPACE_SCOPES, findWorkspacePackages } from './workspace-packages.js';

export async function installPackages(
  deps: BuildDependency[],
  workspaceDir: string,
  registry?: string,
  options?: { workspaceRoot?: string; resolutionMode?: BuildResolutionMode }
): Promise<void> {
  const resolutionMode = options?.resolutionMode || 'prod-faithful';
  const existingWorkspaceRoot = options?.workspaceRoot || process.env.PIE_BUNDLER_WORKSPACE_ROOT;
  if (resolutionMode === 'workspace-fast' && existingWorkspaceRoot) {
    console.log(`[installer] Using existing workspace root: ${existingWorkspaceRoot}`);
    prepareWorkspaceLink(workspaceDir, existingWorkspaceRoot);
    return;
  }

  const registryUrl = registry || process.env.NPM_REGISTRY || 'https://registry.npmjs.org/';
  console.log(`[installer] Installing ${deps.length} packages to ${workspaceDir}`);
  console.log(`[installer] Using registry: ${registryUrl}`);

  mkdirSync(workspaceDir, { recursive: true });

  const packagesDir = join(workspaceDir, 'packages');
  mkdirSync(packagesDir, { recursive: true });

  // Create runtime package.json from shared template.
  writeFileSync(
    join(workspaceDir, 'package.json'),
    JSON.stringify(createWorkspacePackageJson(deps, { useWorkspaceRefs: false }), null, 2)
  );

  // Download each package using pacote
  for (const dep of deps) {
    const packageName = dep.name.split('/')[1]; // @pie-element/foo -> foo
    const targetDir = join(packagesDir, packageName);

    console.log(`[installer] Downloading ${dep.name}@${dep.version}...`);

    await pacote.extract(`${dep.name}@${dep.version}`, targetDir, {
      registry: registryUrl,
    });
  }

  // Run bun install
  console.log('[installer] Running bun install...');
  try {
    execSync('bun install', {
      cwd: workspaceDir,
      stdio: 'inherit',
    });
  } catch (error: any) {
    console.error('[installer] bun install failed:', error.message);
    throw error;
  }

  console.log('[installer] Installation complete');
}

function prepareWorkspaceLink(workspaceDir: string, workspaceRoot: string): void {
  mkdirSync(workspaceDir, { recursive: true });
  const workspaceNodeModules = join(workspaceDir, 'node_modules');
  const rootNodeModules = join(workspaceRoot, 'node_modules');

  if (!existsSync(rootNodeModules)) {
    throw new Error(
      `Workspace node_modules not found at ${rootNodeModules}. Run 'bun install' in repo root first.`
    );
  }

  rmSync(workspaceNodeModules, { recursive: true, force: true });
  writeFileSync(
    join(workspaceDir, 'package.json'),
    JSON.stringify(createWorkspacePackageJson([], { useWorkspaceRefs: true }), null, 2)
  );
  execSync('bun install', {
    cwd: workspaceDir,
    stdio: 'inherit',
  });

  mkdirSync(workspaceNodeModules, { recursive: true });

  // Mirror root node_modules entries first (bun store, external deps, etc).
  const rootEntries = readdirSync(rootNodeModules);
  for (const entry of rootEntries) {
    const from = join(rootNodeModules, entry);
    const to = join(workspaceNodeModules, entry);
    try {
      symlinkSync(from, to, 'dir');
    } catch {
      // Ignore duplicate/broken entries and continue.
    }
  }

  linkWorkspacePackages(workspaceRoot, workspaceNodeModules);
}

/**
 * Link every workspace package into `nodeModulesDir` under its package name. Bundling resolves
 * each one from its sources (see `resolveSourceAliases`), so no package needs a build first.
 */
export function linkWorkspacePackages(workspaceRoot: string, nodeModulesDir: string): void {
  for (const scope of WORKSPACE_SCOPES) {
    ensureOwnScopeDir(join(nodeModulesDir, scope));
  }
  for (const pkg of findWorkspacePackages(workspaceRoot)) {
    const target = join(nodeModulesDir, pkg.name);
    rmSync(target, { recursive: true, force: true });
    symlinkSync(pkg.dir, target, 'dir');
  }
}

/**
 * Make `scopeDir` a real directory. Mirroring the root `node_modules` can leave it a symlink into
 * the root install, and linking through that would rewrite the root's own entries; the mirrored
 * entries are relinked individually instead.
 */
function ensureOwnScopeDir(scopeDir: string): void {
  if (!lstatSync(scopeDir, { throwIfNoEntry: false })?.isSymbolicLink()) {
    mkdirSync(scopeDir, { recursive: true });
    return;
  }
  const mirroredDir = realpathSync(scopeDir);
  unlinkSync(scopeDir);
  mkdirSync(scopeDir);
  for (const entry of readdirSync(mirroredDir)) {
    symlinkSync(join(mirroredDir, entry), join(scopeDir, entry), 'dir');
  }
}
