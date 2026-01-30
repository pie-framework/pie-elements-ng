/**
 * Vite Plugin: Workspace Resolver
 *
 * Resolves workspace:* dependencies to their source files during development
 * instead of built dist/ files. This enables Hot Module Reload (HMR) while
 * maintaining proper dependency declarations in package.json.
 *
 * How it works:
 * 1. Reads package.json to find all workspace:* dependencies
 * 2. For each workspace package, reads its package.json to find exports
 * 3. Creates aliases that map package exports to their source files
 * 4. Falls back to src/index.ts if no exports field exists
 */

import type { Plugin } from 'vite';
import { resolve, dirname, join } from 'node:path';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

interface WorkspacePackage {
  name: string;
  path: string;
  packageJson: any;
}

interface ResolverOptions {
  /**
   * Root directory of the monorepo (where root package.json lives)
   * @default process.cwd()
   */
  workspaceRoot?: string;

  /**
   * Whether to resolve to source files (src/) or built files (dist/)
   * @default true
   */
  resolveSources?: boolean;

  /**
   * Enable debug logging
   * @default false
   */
  debug?: boolean;
}

export function findWorkspaceRoot(startDir: string): string {
  let currentDir = startDir;

  while (true) {
    const pkgPath = join(currentDir, 'package.json');
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
        const workspaces = pkg.workspaces;
        if (Array.isArray(workspaces) || Array.isArray(workspaces?.packages)) {
          return currentDir;
        }
      } catch {
        // Ignore parse errors and continue walking up.
      }
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return startDir;
    }
    currentDir = parentDir;
  }
}

export function workspaceResolver(options: ResolverOptions = {}): Plugin {
  const {
    workspaceRoot = findWorkspaceRoot(process.cwd()),
    resolveSources = true,
    debug = false,
  } = options;

  let aliases: Record<string, string> = {};

  function log(...args: any[]) {
    if (debug) {
      console.log('[workspace-resolver]', ...args);
    }
  }

  /**
   * Find all workspace packages by reading root package.json workspaces field
   */
  function findWorkspacePackages(): WorkspacePackage[] {
    const rootPkgPath = join(workspaceRoot, 'package.json');
    if (!existsSync(rootPkgPath)) {
      log('Root package.json not found at', rootPkgPath);
      return [];
    }

    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    const workspaces = rootPkg.workspaces || [];

    log('Found workspaces:', workspaces);

    const packages: WorkspacePackage[] = [];

    // Simple glob expansion (handles patterns like "packages/*")
    for (const pattern of workspaces) {
      if (pattern.includes('*')) {
        // Expand glob pattern
        const baseDir = pattern.replace('/*', '');
        const basePath = join(workspaceRoot, baseDir);

        if (!existsSync(basePath)) continue;

        const dirs = readdirSync(basePath, { withFileTypes: true })
          .filter((d: any) => d.isDirectory())
          .map((d: any) => d.name);

        for (const dir of dirs) {
          const pkgPath = join(basePath, dir);
          const pkgJsonPath = join(pkgPath, 'package.json');

          if (existsSync(pkgJsonPath)) {
            const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
            packages.push({
              name: pkgJson.name,
              path: pkgPath,
              packageJson: pkgJson,
            });
          }
        }
      } else {
        // Direct path
        const pkgPath = join(workspaceRoot, pattern);
        const pkgJsonPath = join(pkgPath, 'package.json');

        if (existsSync(pkgJsonPath)) {
          const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
          packages.push({
            name: pkgJson.name,
            path: pkgPath,
            packageJson: pkgJson,
          });
        }
      }
    }

    log(`Found ${packages.length} workspace packages`);
    return packages;
  }

  /**
   * Create aliases for a workspace package based on its exports
   */
  function createAliasesForPackage(pkg: WorkspacePackage): Record<string, string> {
    const aliases: Record<string, string> = {};
    const exports = pkg.packageJson.exports;

    if (!resolveSources) {
      // In production, use default resolution (dist/)
      return aliases;
    }

    // Handle different export patterns
    if (typeof exports === 'string') {
      // Simple export: { "exports": "./dist/index.js" }
      const sourcePath = resolveToSource(pkg.path, exports);
      if (sourcePath) {
        aliases[pkg.name] = sourcePath;
        log(`Resolved ${exports} -> ${sourcePath}`);
      }
    } else if (typeof exports === 'object' && exports !== null) {
      // Complex exports
      for (const [exportKey, exportValue] of Object.entries(exports)) {
        if (typeof exportValue === 'string') {
          const sourcePath = resolveToSource(pkg.path, exportValue);
          if (sourcePath) {
            if (exportKey === '.') {
              // Main export: "@pie-element/foo"
              aliases[pkg.name] = sourcePath;
            } else {
              // Subpath export: "@pie-element/foo/controller"
              const subpath = exportKey.replace(/^\.\//, '');
              aliases[`${pkg.name}/${subpath}`] = sourcePath;
            }
            log(`Resolved ${exportKey} (${exportValue}) -> ${sourcePath}`);
          }
        } else if (typeof exportValue === 'object') {
          // Conditional exports: { "import": "...", "require": "..." }
          const importPath = (exportValue as any).import || (exportValue as any).default;
          if (importPath) {
            const sourcePath = resolveToSource(pkg.path, importPath);
            if (sourcePath) {
              if (exportKey === '.') {
                aliases[pkg.name] = sourcePath;
              } else {
                const subpath = exportKey.replace(/^\.\//, '');
                aliases[`${pkg.name}/${subpath}`] = sourcePath;
              }
              log(`Resolved ${exportKey} (${importPath}) -> ${sourcePath}`);
            } else {
              log(`Failed to resolve ${exportKey} (${importPath}) in ${pkg.path}`);
            }
          }
        }
      }
    }

    // Fallback: if no exports or no aliases created, try src/index.ts
    if (Object.keys(aliases).length === 0) {
      const fallbackPath = join(pkg.path, 'src/index.ts');
      if (existsSync(fallbackPath)) {
        aliases[pkg.name] = fallbackPath;
        log(`Using fallback for ${pkg.name}: ${fallbackPath}`);
      } else {
        const fallbackJs = join(pkg.path, 'src/index.js');
        if (existsSync(fallbackJs)) {
          aliases[pkg.name] = fallbackJs;
          log(`Using fallback for ${pkg.name}: ${fallbackJs}`);
        }
      }
    }

    return aliases;
  }

  /**
   * Convert a dist/ path to src/ path
   * Examples:
   *   ./dist/index.js -> src/index.ts
   *   ./dist/controller/index.js -> src/controller/index.ts
   */
  function resolveToSource(pkgPath: string, distPath: string): string | null {
    // Remove leading "./"
    const normalizedPath = distPath.replace(/^\.\//, '');

    // Convert dist/ to src/
    const srcPath = normalizedPath.replace(/^dist\//, 'src/');

    // Try .ts first, then .tsx, then .js, then .jsx
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.svelte'];

    for (const ext of extensions) {
      // Remove existing extension and add new one
      const withoutExt = srcPath.replace(/\.(js|ts|tsx|jsx|svelte)$/, '');
      const fullPath = join(pkgPath, withoutExt + ext);

      if (existsSync(fullPath)) {
        log(`Resolved ${distPath} -> ${fullPath}`);
        return fullPath;
      }
    }

    // If no source file found, try the path as-is
    const directPath = join(pkgPath, srcPath);
    if (existsSync(directPath)) {
      log(`Resolved ${distPath} -> ${directPath}`);
      return directPath;
    }

    log(`Could not resolve source for ${distPath} in ${pkgPath}`);
    return null;
  }

  return {
    name: 'vite-plugin-workspace-resolver',

    config(config) {
      // Build aliases during config phase
      const packages = findWorkspacePackages();

      for (const pkg of packages) {
        const pkgAliases = createAliasesForPackage(pkg);
        Object.assign(aliases, pkgAliases);
      }

      if (debug) {
        log('Generated aliases:');
        for (const [key, value] of Object.entries(aliases)) {
          log(`  ${key} -> ${value}`);
        }
        log(`Total aliases: ${Object.keys(aliases).length}`);
      }

      // Return aliases in Vite's array format
      // IMPORTANT: Sort by length descending so longer/more-specific paths match first
      // This prevents "@pie-element/categorize" from matching "@pie-element/categorize/controller"
      const aliasArray = Object.entries(aliases)
        .sort(([a], [b]) => b.length - a.length) // Sort by key length, longest first
        .map(([find, replacement]) => ({
          find,
          replacement,
        }));

      if (debug) {
        log('Returning alias array to Vite config:');
        log(JSON.stringify(aliasArray.slice(0, 5), null, 2));
      }

      // Get existing aliases from config
      const existingAliases = config?.resolve?.alias || [];
      const mergedAliases = Array.isArray(existingAliases)
        ? [...aliasArray, ...existingAliases]
        : [...aliasArray];

      log(
        `Merged ${mergedAliases.length} total aliases (${aliasArray.length} workspace + existing)`
      );

      const configToReturn = {
        resolve: {
          alias: mergedAliases,
        },
      };

      if (debug) {
        log('Config being returned:', JSON.stringify(configToReturn, null, 2).substring(0, 500));
      }

      return configToReturn;
    },
  };
}
