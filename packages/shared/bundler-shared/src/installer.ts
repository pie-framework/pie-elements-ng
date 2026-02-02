/**
 * Package installer - downloads and installs PIE element packages using Bun
 * Simplified from pie-api-aws/packages/bundler/src/installers/
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pacote from 'pacote';
import type { BuildDependency } from './types.js';

export async function installPackages(
  deps: BuildDependency[],
  workspaceDir: string,
  registry?: string
): Promise<void> {
  const registryUrl = registry || process.env.NPM_REGISTRY || 'https://registry.npmjs.org/';
  console.log(`[installer] Installing ${deps.length} packages to ${workspaceDir}`);
  console.log(`[installer] Using registry: ${registryUrl}`);

  mkdirSync(workspaceDir, { recursive: true });

  const packagesDir = join(workspaceDir, 'packages');
  mkdirSync(packagesDir, { recursive: true });

  // Create workspace package.json
  writeFileSync(
    join(workspaceDir, 'package.json'),
    JSON.stringify(
      {
        name: 'pie-bundler-workspace',
        private: true,
        workspaces: [
          'packages/*',
          'packages/*/controller',
          'packages/*/configure',
          'packages/*/author',
        ],
      },
      null,
      2
    )
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
