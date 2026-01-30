import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Logger } from '../../utils/logger.js';

/**
 * Map of export paths to their likely source file extensions.
 * This determines which source files to look for when adding development export conditions.
 */
const SOURCE_EXTENSIONS: Record<string, string[]> = {
  '.': ['index.ts', 'index.tsx', 'index.js'],
  './delivery': ['delivery/index.ts', 'delivery/index.tsx', 'delivery/index.js'],
  './author': ['author/index.tsx', 'author/index.ts', 'author/index.js'],
  './controller': ['controller/index.ts', 'controller/index.js'],
  './print': ['print/index.tsx', 'print/index.ts', 'print/index.js'],
  './configure': ['configure/index.tsx', 'configure/index.ts', 'configure/index.js'],
};

/**
 * Find the source file for a given export path in an element package.
 */
function findSourceFile(elementPath: string, exportPath: string): string | null {
  const possibleFiles = SOURCE_EXTENSIONS[exportPath] || [];

  for (const file of possibleFiles) {
    const fullPath = join(elementPath, 'src', file);
    if (existsSync(fullPath)) {
      return `./src/${file}`;
    }
  }

  return null;
}

interface PackageExports {
  [key: string]: string | { [condition: string]: string };
}

interface PackageJson {
  name?: string;
  exports?: PackageExports;
  [key: string]: unknown;
}

/**
 * Add development export conditions to a package.json file.
 * Returns true if the file was modified, false otherwise.
 */
function updatePackageJson(pkgPath: string, logger: Logger): boolean {
  const pkgJsonPath = join(pkgPath, 'package.json');

  if (!existsSync(pkgJsonPath)) {
    return false;
  }

  const content = readFileSync(pkgJsonPath, 'utf-8');
  const pkg: PackageJson = JSON.parse(content);

  if (!pkg.exports || typeof pkg.exports !== 'object') {
    logger.debug(`  ⚠️  No exports field found in ${pkg.name || pkgPath}`);
    return false;
  }

  let modified = false;

  for (const [exportPath, exportConfig] of Object.entries(pkg.exports)) {
    // Skip if not an object (string exports)
    if (typeof exportConfig !== 'object') {
      continue;
    }

    // Skip if already has development condition
    if ('development' in exportConfig) {
      continue;
    }

    // Find the source file
    const sourceFile = findSourceFile(pkgPath, exportPath);

    if (sourceFile) {
      // Add development condition as the first entry
      pkg.exports[exportPath] = {
        development: sourceFile,
        ...exportConfig,
      };
      modified = true;
      logger.debug(`    ✓ Added development export for ${exportPath} -> ${sourceFile}`);
    } else {
      logger.debug(`    ⚠️  Could not find source file for ${exportPath}`);
    }
  }

  if (modified) {
    // Write back with proper formatting
    writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    return true;
  }

  return false;
}

/**
 * Add development export conditions to element packages.
 * This allows Vite to resolve directly to src/ files in development mode
 * for Hot Module Reload (HMR) without needing a custom plugin.
 *
 * @param elementsDir - Path to the elements-react directory
 * @param packageNames - Optional array of specific package names to process (e.g., ['multiple-choice'])
 * @param logger - Logger instance for output
 * @returns Number of packages updated
 */
export async function addDevelopmentExports(
  elementsDir: string,
  packageNames: string[] | undefined,
  logger: Logger
): Promise<number> {
  if (!existsSync(elementsDir)) {
    logger.warn(`Elements directory not found: ${elementsDir}`);
    return 0;
  }

  let updated = 0;
  const packagesToProcess = packageNames || [];

  // If no specific packages provided, we don't process anything
  // (this function is meant to be called with specific packages after sync)
  if (packagesToProcess.length === 0) {
    return 0;
  }

  for (const pkgName of packagesToProcess) {
    const elementPath = join(elementsDir, pkgName);

    if (!existsSync(elementPath)) {
      logger.debug(`  Package not found: ${pkgName}`);
      continue;
    }

    logger.debug(`  Processing ${pkgName}...`);

    const wasUpdated = updatePackageJson(elementPath, logger);

    if (wasUpdated) {
      updated++;
      logger.debug(`    ✓ Updated\n`);
    } else {
      logger.debug(`    → Skipped (no changes needed)\n`);
    }
  }

  return updated;
}
