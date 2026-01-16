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

/**
 * Extract @pie-lib/* dependencies from a dependencies object
 */
export function extractPieLibDeps(deps: Record<string, string>): string[] {
  return Object.keys(deps)
    .filter((dep) => dep.startsWith('@pie-lib/'))
    .map((dep) => dep.replace('@pie-lib/', ''));
}

/**
 * Extract @pie-element/* dependencies from a dependencies object
 */
export function extractPieElementDeps(deps: Record<string, string>): string[] {
  return Object.keys(deps)
    .filter((dep) => dep.startsWith('@pie-element/'))
    .map((dep) => dep.replace('@pie-element/', ''));
}

/**
 * Generate ESM-compatible package.json exports for an element package
 */
export function generateElementExports(options: {
  hasController: boolean;
  hasConfigure: boolean;
}): Record<string, unknown> {
  const exports: Record<string, unknown> = {
    '.': {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    },
  };

  if (options.hasController) {
    exports['./controller'] = {
      types: './dist/controller/index.d.ts',
      default: './dist/controller/index.js',
    };
  }

  if (options.hasConfigure) {
    exports['./configure'] = {
      types: './dist/configure/index.d.ts',
      default: './dist/configure/index.js',
    };
  }

  return exports;
}

/**
 * Generate ESM-compatible package.json exports for a pie-lib package
 */
export function generatePieLibExports(): Record<string, unknown> {
  return {
    '.': {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    },
  };
}
