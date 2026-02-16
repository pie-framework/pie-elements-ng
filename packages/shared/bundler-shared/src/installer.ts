/**
 * Package installer - downloads and installs PIE element packages using Bun
 * Simplified from pie-api-aws/packages/bundler/src/installers/
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pacote from 'pacote';
import type { BuildDependency, BuildResolutionMode } from './types.js';
import { createWorkspacePackageJson } from './runtime-template.js';

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

  // Add @pie-element aliases expected by bundler input names.
  const pieElementScopeDir = join(workspaceNodeModules, '@pie-element');
  mkdirSync(pieElementScopeDir, { recursive: true });
  linkPackageDir(join(workspaceRoot, 'packages', 'elements-react'), pieElementScopeDir, '', true);
  linkPackageDir(join(workspaceRoot, 'packages', 'elements-svelte'), pieElementScopeDir, '', true);
  linkPackageDir(join(workspaceRoot, 'packages', 'shared'), pieElementScopeDir, 'shared-');

  // Add @pie-lib aliases expected by bundler internals.
  const pieLibScopeDir = join(workspaceNodeModules, '@pie-lib');
  mkdirSync(pieLibScopeDir, { recursive: true });
  linkPackageDir(join(workspaceRoot, 'packages', 'lib-react'), pieLibScopeDir);
  linkPackageDir(join(workspaceRoot, 'packages', 'lib-svelte'), pieLibScopeDir);
}

function linkPackageDir(
  sourceDir: string,
  targetScopeDir: string,
  namePrefix = '',
  createLegacySubpathLinks = false
): void {
  if (!existsSync(sourceDir)) return;

  for (const packageFolder of readdirSync(sourceDir)) {
    const packagePath = join(sourceDir, packageFolder);
    if (!existsSync(join(packagePath, 'package.json'))) {
      continue;
    }
    const targetName = `${namePrefix}${packageFolder}`;
    const targetPath = join(targetScopeDir, targetName);
    rmSync(targetPath, { recursive: true, force: true });

    if (!createLegacySubpathLinks) {
      symlinkSync(packagePath, targetPath, 'dir');
      continue;
    }

    // Create a compat layout for imports like @pie-element/foo/controller.
    mkdirSync(targetPath, { recursive: true });
    const distPath = join(packagePath, 'dist');
    if (existsSync(distPath)) {
      symlinkSync(distPath, join(targetPath, 'dist'), 'dir');
      for (const subPath of ['controller', 'author', 'configure', 'delivery', 'print']) {
        const sourceSubPath = join(distPath, subPath);
        if (existsSync(sourceSubPath)) {
          symlinkSync(sourceSubPath, join(targetPath, subPath), 'dir');
        }
      }
    }
    const packageJsonPath = join(packagePath, 'package.json');
    if (existsSync(packageJsonPath)) {
      symlinkSync(packageJsonPath, join(targetPath, 'package.json'));
    }
  }
}
