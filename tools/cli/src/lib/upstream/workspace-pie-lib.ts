import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WORKSPACE } from './sync-constants.js';

/**
 * Workspace directories that hold `@pie-lib/*` packages. A framework-independent
 * library lives under `packages/shared` while keeping its `@pie-lib` name, so a
 * package is found by the name in its manifest, never by its directory.
 */
const PIE_LIB_PARENT_DIRS = ['packages/lib-react', 'packages/lib-svelte', 'packages/shared'];

/** Maps each workspace `@pie-lib/<name>` package's `<name>` to its directory. */
export function findWorkspacePieLibPackages(root: string): Map<string, string> {
  const packages = new Map<string, string>();
  for (const parent of PIE_LIB_PARENT_DIRS) {
    const parentDir = join(root, parent);
    if (!existsSync(parentDir)) continue;
    for (const entry of readdirSync(parentDir)) {
      const manifestPath = join(parentDir, entry, 'package.json');
      if (!existsSync(manifestPath)) continue;
      const name = JSON.parse(readFileSync(manifestPath, 'utf8')).name;
      if (typeof name === 'string' && name.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
        packages.set(name.slice(WORKSPACE.PIE_LIB_PREFIX.length), join(parentDir, entry));
      }
    }
  }
  return packages;
}
