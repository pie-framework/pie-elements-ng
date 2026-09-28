/**
 * Package.json utilities for sync operations
 */
import type { PackageJson } from '../../utils/package-json.js';

/**
 * Get all dependencies from a package.json (dependencies + optionalDependencies + devDependencies)
 */
export function getAllDeps(
  pkg: PackageJson | null,
  includeDevDeps = false
): Record<string, string> {
  if (!pkg) {
    return {};
  }

  const optionalDependencies =
    (pkg.optionalDependencies as Record<string, string> | undefined) ?? {};

  return {
    ...(pkg.dependencies ?? {}),
    ...optionalDependencies,
    ...(includeDevDeps && pkg.devDependencies ? pkg.devDependencies : {}),
  };
}
