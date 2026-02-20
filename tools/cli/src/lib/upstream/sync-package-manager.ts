/**
 * Centralized package.json management for upstream sync operations
 *
 * This module consolidates all package.json generation and management logic
 * to eliminate the massive duplication between controllers-strategy and react-strategy.
 */

import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadPackageJson, type PackageJson } from '../../utils/package-json.js';
import type { SyncConfig } from './sync-strategy.js';
import { existsAny } from './sync-filesystem.js';
import { applyPackageJsonTransforms } from './sync-transforms.js';
import { BUILD_TOOLS, REACT, PACKAGE_DEFAULTS, SCRIPTS, WORKSPACE } from './sync-constants.js';

interface EntryPointMap {
  hasIndex: boolean;
  hasDelivery: boolean;
  hasAuthor: boolean;
  hasController: boolean;
  hasConfigure: boolean;
  hasPrint: boolean;
  hasTypes: boolean;
}

/**
 * Detect available entry points in an element package
 */
export function detectEntryPoints(elementDir: string): EntryPointMap {
  return {
    hasIndex: existsAny([
      join(elementDir, 'src/index.ts'),
      join(elementDir, 'src/index.tsx'),
      join(elementDir, 'src/index.js'),
      join(elementDir, 'src/index.jsx'),
    ]),
    hasDelivery: existsAny([
      join(elementDir, 'src/delivery/index.ts'),
      join(elementDir, 'src/delivery/index.tsx'),
      join(elementDir, 'src/delivery/index.js'),
      join(elementDir, 'src/delivery/index.jsx'),
    ]),
    hasAuthor: existsAny([
      join(elementDir, 'src/author/index.ts'),
      join(elementDir, 'src/author/index.tsx'),
      join(elementDir, 'src/author/index.js'),
      join(elementDir, 'src/author/index.jsx'),
    ]),
    hasController: existsAny([
      join(elementDir, 'src/controller/index.ts'),
      join(elementDir, 'src/controller/index.tsx'),
      join(elementDir, 'src/controller/index.js'),
      join(elementDir, 'src/controller/index.jsx'),
    ]),
    hasConfigure: existsAny([
      join(elementDir, 'src/configure/index.ts'),
      join(elementDir, 'src/configure/index.tsx'),
      join(elementDir, 'src/configure/index.js'),
      join(elementDir, 'src/configure/index.jsx'),
    ]),
    hasPrint: existsAny([
      join(elementDir, 'src/print/index.ts'),
      join(elementDir, 'src/print/index.tsx'),
      join(elementDir, 'src/print/index.js'),
      join(elementDir, 'src/print/index.jsx'),
    ]),
    hasTypes: existsAny([
      join(elementDir, 'src/types/index.ts'),
      join(elementDir, 'src/types/index.tsx'),
      join(elementDir, 'src/types/index.js'),
      join(elementDir, 'src/types/index.jsx'),
    ]),
  };
}

/**
 * Generate exports object based on available entry points
 */
export function generateExportsObject(entryPoints: EntryPointMap): Record<string, unknown> {
  const exports: Record<string, unknown> = {
    '.': {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    },
  };

  if (entryPoints.hasDelivery) {
    exports['./delivery'] = {
      types: './dist/delivery/index.d.ts',
      default: './dist/delivery/index.js',
    };
  }

  if (entryPoints.hasAuthor) {
    exports['./author'] = {
      types: './dist/author/index.d.ts',
      default: './dist/author/index.js',
    };
  }

  if (entryPoints.hasController) {
    exports['./controller'] = {
      types: './dist/controller/index.d.ts',
      default: './dist/controller/index.js',
    };
  }

  if (entryPoints.hasConfigure) {
    exports['./configure'] = {
      types: './dist/configure/index.d.ts',
      default: './dist/configure/index.js',
    };
  }

  if (entryPoints.hasPrint) {
    exports['./print'] = {
      types: './dist/print/index.d.ts',
      default: './dist/print/index.js',
    };
  }

  if (entryPoints.hasTypes) {
    exports['./types'] = {
      types: './dist/types/index.d.ts',
      default: './dist/types/index.js',
    };
  }

  return exports;
}

/**
 * Extract imports from source files to determine runtime dependencies
 */
export async function extractImportsFromSources(elementDir: string): Promise<Set<string>> {
  const imports = new Set<string>();
  const srcDir = join(elementDir, 'src');

  if (!existsSync(srcDir)) {
    return imports;
  }

  // Recursively find all .ts, .tsx, .js, .jsx files
  const { readdir: readdirRecursive } = await import('node:fs/promises');

  async function scanDirectory(dir: string): Promise<void> {
    try {
      const entries = await readdirRecursive(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          try {
            const content = await readFile(fullPath, 'utf-8');
            // Match import statements: import ... from 'package' or import('package')
            const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
            const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

            let match: RegExpExecArray | null;

            match = importRegex.exec(content);
            while (match !== null) {
              const importPath = match[1];
              // Only track package imports (not relative imports)
              if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                const normalized = normalizePackageImport(importPath);
                if (normalized) imports.add(normalized);
              }
              match = importRegex.exec(content);
            }

            match = dynamicImportRegex.exec(content);
            while (match !== null) {
              const importPath = match[1];
              if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
                const normalized = normalizePackageImport(importPath);
                if (normalized) imports.add(normalized);
              }
              match = dynamicImportRegex.exec(content);
            }
          } catch (err) {
            // Skip files that can't be read
          }
        }
      }
    } catch (err) {
      // Skip directories that can't be read
    }
  }

  await scanDirectory(srcDir);
  return imports;
}

function normalizePackageImport(specifier: string): string | null {
  if (!specifier || specifier.startsWith('.') || specifier.startsWith('/')) {
    return null;
  }
  if (specifier.startsWith('@')) {
    const parts = specifier.split('/');
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
  }
  return specifier.split('/')[0] || null;
}

async function findInstalledPackageJson(
  packageName: string,
  fromDir: string
): Promise<PackageJson | null> {
  try {
    const { createRequire } = await import('node:module');
    const req = createRequire(join(fromDir, 'package.json'));
    const resolvedEntry = req.resolve(packageName);

    let currentDir = dirname(resolvedEntry);
    while (true) {
      const candidate = join(currentDir, 'package.json');
      if (existsSync(candidate)) {
        const pkg = await loadPackageJson(candidate).catch(() => null);
        if (pkg && pkg.name === packageName) {
          return pkg;
        }
      }

      const parent = dirname(currentDir);
      if (parent === currentDir) {
        break;
      }
      currentDir = parent;
    }
  } catch {
    // Package not resolvable from this location.
  }
  return null;
}

async function addTransitivePeerDependencies(
  deps: Record<string, string>,
  fromDir: string
): Promise<void> {
  const depNames = Object.keys(deps);

  for (const depName of depNames) {
    if (
      depName.startsWith(WORKSPACE.PIE_LIB_PREFIX) ||
      depName.startsWith(WORKSPACE.PIE_ELEMENT_PREFIX) ||
      depName.startsWith(WORKSPACE.PIE_FRAMEWORK_PREFIX)
    ) {
      continue;
    }

    const installedPkg = await findInstalledPackageJson(depName, fromDir);
    const peerDeps = (installedPkg?.peerDependencies as Record<string, string> | undefined) ?? {};

    for (const [peerName, peerVersion] of Object.entries(peerDeps)) {
      if (deps[peerName]) {
        continue;
      }

      if (
        peerName.startsWith(WORKSPACE.PIE_LIB_PREFIX) ||
        peerName.startsWith(WORKSPACE.PIE_ELEMENT_PREFIX) ||
        peerName.startsWith(WORKSPACE.PIE_FRAMEWORK_PREFIX)
      ) {
        deps[peerName] = WORKSPACE.VERSION;
      } else {
        deps[peerName] = peerVersion;
      }
    }
  }
}

async function inferPeerVersionFromDeclaredDeps(
  targetDep: string,
  deps: Record<string, string>,
  fromDir: string
): Promise<string | null> {
  for (const depName of Object.keys(deps)) {
    if (
      depName.startsWith(WORKSPACE.PIE_LIB_PREFIX) ||
      depName.startsWith(WORKSPACE.PIE_ELEMENT_PREFIX) ||
      depName.startsWith(WORKSPACE.PIE_FRAMEWORK_PREFIX)
    ) {
      continue;
    }

    const installedPkg = await findInstalledPackageJson(depName, fromDir);
    const peerDeps = (installedPkg?.peerDependencies as Record<string, string> | undefined) ?? {};
    if (peerDeps[targetDep]) {
      return peerDeps[targetDep];
    }
  }

  return null;
}

function addKnownPeerFallbacks(deps: Record<string, string>): void {
  // Some widely used packages rely on peers that upstream metadata can omit
  // or that may not be inferable from local resolution during sync.
  if ((deps.recharts || deps['styled-components']) && !deps['react-is']) {
    deps['react-is'] = '^19.2.0';
  }

  if (deps['@tiptap/extension-character-count'] && !deps['@tiptap/extensions']) {
    deps['@tiptap/extensions'] = '^3.20.0';
  }

  if (deps['@tiptap/extension-list-item'] && !deps['@tiptap/extension-list']) {
    const tiptapVersion = deps['@tiptap/extension-list-item'];
    deps['@tiptap/extension-list'] = tiptapVersion;
  }

  if (deps['@testing-library/user-event'] && !deps['@testing-library/dom']) {
    deps['@testing-library/dom'] = '^10.4.1';
  }
}

/**
 * Extract and normalize dependencies from upstream package.json
 */
export function extractUpstreamDependencies(
  upstreamPkg: PackageJson | null
): Record<string, string> {
  if (!upstreamPkg) return {};

  const upstreamDeps = (upstreamPkg.dependencies as Record<string, string> | undefined) ?? {};
  const expectedDeps: Record<string, string> = {};

  for (const [name, version] of Object.entries(upstreamDeps)) {
    if (name.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
      expectedDeps[name] = WORKSPACE.VERSION;
    } else if (name !== 'react' && name !== 'react-dom') {
      expectedDeps[name] = version;
    }
  }

  return expectedDeps;
}

/**
 * Ensure devDependencies include all required build tools
 */
export function ensureBuildToolDependencies(pkg: PackageJson): void {
  if (!pkg.devDependencies || typeof pkg.devDependencies !== 'object') {
    pkg.devDependencies = {};
  }

  const devDeps = pkg.devDependencies as Record<string, string>;

  if (!devDeps.vite) devDeps.vite = BUILD_TOOLS.VITE;
  if (!devDeps.typescript) devDeps.typescript = BUILD_TOOLS.TYPESCRIPT;
  if (!devDeps['@vitejs/plugin-react'])
    devDeps['@vitejs/plugin-react'] = BUILD_TOOLS.VITE_REACT_PLUGIN;
  if (!devDeps['@types/react']) devDeps['@types/react'] = REACT.TYPES_VERSION;
  if (!devDeps['@types/react-dom']) devDeps['@types/react-dom'] = REACT.TYPES_VERSION;
}

/**
 * Check if a @pie-framework or @pie-element/shared- package exists in the workspace
 *
 * Supports both legacy @pie-framework naming and new @pie-element/shared- naming:
 * - @pie-framework/mathquill → packages/shared/math-engine (legacy alias)
 * - @pie-element/shared-math-engine → packages/shared/math-engine
 */
function isPieFrameworkWorkspacePackage(packageName: string, config: SyncConfig): boolean {
  let pkgName: string;

  if (packageName.startsWith(WORKSPACE.PIE_FRAMEWORK_PREFIX)) {
    // Legacy @pie-framework/* packages
    pkgName = packageName.replace(WORKSPACE.PIE_FRAMEWORK_PREFIX, '');
  } else if (packageName.startsWith(WORKSPACE.PIE_ELEMENT_PREFIX + 'shared-')) {
    // New @pie-element/shared-* packages
    pkgName = packageName.replace(WORKSPACE.PIE_ELEMENT_PREFIX + 'shared-', '');
  } else {
    return false;
  }

  const sharedPackagePath = join(config.pieElementsNg, 'packages/shared', pkgName, 'package.json');
  return existsSync(sharedPackagePath);
}

/**
 * Generate or update element package.json
 *
 * This function consolidates the ~400 lines of duplicated package.json management
 * logic from controllers-strategy and react-strategy into a single, maintainable function.
 */
export async function ensureElementPackageJson(
  elementName: string,
  elementDir: string,
  config: SyncConfig
): Promise<boolean> {
  if (!existsSync(elementDir)) {
    return false;
  }

  const pkgPath = join(elementDir, 'package.json');
  const upstreamPkgPath = join(config.pieElements, 'packages', elementName, 'package.json');

  // Load existing package.json
  let pkg: PackageJson | null = null;
  if (existsSync(pkgPath)) {
    pkg = await loadPackageJson(pkgPath).catch(() => null);
  }

  // Load upstream package.json for dependency info
  const upstreamPkg = existsSync(upstreamPkgPath)
    ? await loadPackageJson(upstreamPkgPath).catch(() => null)
    : null;

  // Extract and normalize upstream dependencies
  const expectedDeps = extractUpstreamDependencies(upstreamPkg);

  // Scan source files for actual imports to catch dependencies from skipped directories
  const importedPackages = await extractImportsFromSources(elementDir);

  // Add workspace dependencies found in imports
  const currentPackageName = `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}`;
  for (const imported of importedPackages) {
    // Skip self-dependencies (package importing from itself)
    if (imported === currentPackageName) {
      continue;
    }

    if (imported.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
      expectedDeps[imported] = WORKSPACE.VERSION;
    } else if (imported.startsWith(WORKSPACE.PIE_ELEMENT_PREFIX)) {
      expectedDeps[imported] = WORKSPACE.VERSION;
    } else if (imported.startsWith(WORKSPACE.PIE_FRAMEWORK_PREFIX)) {
      // Only add as workspace dependency if it actually exists in packages/shared/
      if (isPieFrameworkWorkspacePackage(imported, config)) {
        expectedDeps[imported] = WORKSPACE.VERSION;
      } else {
        // External @pie-framework package - add with latest version if not already in deps
        if (!expectedDeps[imported]) {
          expectedDeps[imported] = '^1.0.0'; // Use latest 1.x version as default
        }
      }
    }
  }
  await addTransitivePeerDependencies(expectedDeps, elementDir);
  addKnownPeerFallbacks(expectedDeps);

  // Create minimal package.json if missing
  if (!pkg) {
    pkg = {
      name: `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}`,
      private: true,
      version: '0.1.0',
      description:
        (upstreamPkg?.description as string | undefined) ??
        `React implementation of ${elementName} element synced from pie-elements`,
      dependencies: expectedDeps,
      peerDependencies: {
        react: REACT.VERSION,
        'react-dom': REACT.VERSION,
      },
    };
  }

  // Update dependencies to match upstream
  if (Object.keys(expectedDeps).length > 0) {
    pkg.dependencies = expectedDeps;
  }

  // Preserve pie metadata (if present upstream or locally)
  const pieMetadata = ((upstreamPkg as PackageJson | null | undefined)?.pie ??
    (pkg as PackageJson | null | undefined)?.pie ??
    undefined) as { capabilities?: string[] } | undefined;

  // Apply all standard transformations
  pkg = applyPackageJsonTransforms(pkg);

  if (pieMetadata) {
    pkg.pie = pieMetadata;
  }

  // Detect available entry points
  const entryPoints = detectEntryPoints(elementDir);

  // Generate exports based on entry points
  pkg.exports = generateExportsObject(entryPoints);

  // Warn when metadata/structure disagree for core capabilities
  const metadataCapabilities = Array.isArray(pieMetadata?.capabilities)
    ? new Set(pieMetadata.capabilities)
    : null;

  if (!entryPoints.hasDelivery || !entryPoints.hasController) {
    console.warn(
      `[upstream:update] ${elementName} missing required entry points:` +
        `${entryPoints.hasDelivery ? '' : ' delivery'}` +
        `${entryPoints.hasController ? '' : ' controller'}`
    );
  }

  if (metadataCapabilities) {
    if (metadataCapabilities.has('author') && !entryPoints.hasAuthor) {
      console.warn(
        `[upstream:update] ${elementName} metadata includes author but no src/author entry`
      );
    }
    if (metadataCapabilities.has('print') && !entryPoints.hasPrint) {
      console.warn(
        `[upstream:update] ${elementName} metadata includes print but no src/print entry`
      );
    }
  } else {
    if (entryPoints.hasAuthor) {
      console.warn(
        `[upstream:update] ${elementName} has src/author but no pie.capabilities metadata`
      );
    }
    if (entryPoints.hasPrint) {
      console.warn(
        `[upstream:update] ${elementName} has src/print but no pie.capabilities metadata`
      );
    }
  }

  // Set core package.json fields
  pkg.name = `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}`;
  pkg.type = PACKAGE_DEFAULTS.TYPE;
  pkg.main = './dist/index.js';
  pkg.types = './dist/index.d.ts';

  // Ensure files array
  const files = Array.isArray(pkg.files) ? (pkg.files as unknown[]) : [];
  const normalizedFiles = new Set<string>(files.filter((v): v is string => typeof v === 'string'));
  normalizedFiles.add('dist');
  normalizedFiles.add('src');
  pkg.files = Array.from(normalizedFiles).sort();

  // Set sideEffects
  if (typeof pkg.sideEffects === 'undefined') {
    pkg.sideEffects = PACKAGE_DEFAULTS.SIDE_EFFECTS;
  }

  // Ensure devDependencies
  ensureBuildToolDependencies(pkg);

  // Ensure build scripts
  if (!pkg.scripts || typeof pkg.scripts !== 'object') {
    pkg.scripts = {};
  }

  const scripts = pkg.scripts as Record<string, string>;
  const hasIifeEntry =
    existsSync(join(elementDir, 'src/index.iife.ts')) ||
    existsSync(join(elementDir, 'vite.config.iife.ts'));

  scripts.build = hasIifeEntry ? SCRIPTS.BUILD_WITH_IIFE : SCRIPTS.BUILD;
  scripts.dev = SCRIPTS.DEV;
  scripts.demo = SCRIPTS.DEMO;
  scripts.test = SCRIPTS.TEST;

  // Check if content changed
  const nextContent = `${JSON.stringify(pkg, null, 2)}\n`;
  const currentContent = existsSync(pkgPath)
    ? await readFile(pkgPath, 'utf-8').catch(() => null)
    : null;

  if (currentContent === nextContent) {
    return false;
  }

  // Write updated package.json
  await writeFile(pkgPath, nextContent, 'utf-8');
  return true;
}

/**
 * Generate or update pie-lib package.json
 */
export async function ensurePieLibPackageJson(
  pkgName: string,
  pkgDir: string,
  config: SyncConfig
): Promise<boolean> {
  if (!existsSync(pkgDir)) {
    return false;
  }

  const pkgPath = join(pkgDir, 'package.json');
  const upstreamPkgPath = join(config.pieLib, 'packages', pkgName, 'package.json');

  let pkg: PackageJson | null = null;
  if (existsSync(pkgPath)) {
    pkg = await loadPackageJson(pkgPath).catch(() => null);
  }

  const upstreamPkg = existsSync(upstreamPkgPath)
    ? await loadPackageJson(upstreamPkgPath).catch(() => null)
    : null;

  // Extract upstream dependencies
  const upstreamDeps = (upstreamPkg?.dependencies as Record<string, string> | undefined) ?? {};
  const expectedDeps: Record<string, string> = {};

  for (const [name, version] of Object.entries(upstreamDeps)) {
    // Transform legacy mathquill dependencies to shared-math-engine
    if (name === '@pie-framework/mathquill') {
      expectedDeps['@pie-element/shared-math-engine'] = WORKSPACE.VERSION;
    } else if (name === '@pie-element/shared-mathquill' || name === 'mathquill') {
      expectedDeps['@pie-element/shared-math-engine'] = WORKSPACE.VERSION;
    } else if (name.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
      expectedDeps[name] = WORKSPACE.VERSION;
    } else {
      expectedDeps[name] = version;
    }
  }

  const importedPackages = await extractImportsFromSources(pkgDir);
  for (const importedPkg of importedPackages) {
    if (
      importedPkg === '@pie-framework/mathquill' ||
      importedPkg === '@pie-element/shared-mathquill'
    ) {
      expectedDeps['@pie-element/shared-math-engine'] = WORKSPACE.VERSION;
      continue;
    }
    if (importedPkg.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
      expectedDeps[importedPkg] = WORKSPACE.VERSION;
      continue;
    }
    if (importedPkg.startsWith(WORKSPACE.PIE_ELEMENT_PREFIX)) {
      expectedDeps[importedPkg] = WORKSPACE.VERSION;
      continue;
    }

    // Keep pie-lib package.json aligned with actual runtime imports from src/.
    // Upstream package.json can miss some third-party dependencies.
    if (!expectedDeps[importedPkg]) {
      const installedPkg = await findInstalledPackageJson(importedPkg, pkgDir);
      if (installedPkg?.version) {
        expectedDeps[importedPkg] = `^${installedPkg.version}`;
      } else {
        const inferredPeerVersion = await inferPeerVersionFromDeclaredDeps(
          importedPkg,
          expectedDeps,
          pkgDir
        );
        if (inferredPeerVersion) {
          expectedDeps[importedPkg] = inferredPeerVersion;
        }
      }
    }
  }

  await addTransitivePeerDependencies(expectedDeps, pkgDir);
  addKnownPeerFallbacks(expectedDeps);

  // graphing imports @dnd-kit/core directly in source but upstream metadata can omit it.
  if (pkgName === 'graphing' && !expectedDeps['@dnd-kit/core']) {
    expectedDeps['@dnd-kit/core'] = '^6.3.0';
  }

  // charting pulls in @visx packages whose ESM modules rely on d3 peer deps that
  // upstream metadata can omit. Keep these declared locally to avoid demo IIFE bundling
  // failures (missing d3-time/d3-interpolate/d3-shape at runtime resolution time).
  if (pkgName === 'charting') {
    if (!expectedDeps['d3-time']) expectedDeps['d3-time'] = '^3.1.0';
    if (!expectedDeps['d3-interpolate']) expectedDeps['d3-interpolate'] = '^3.0.1';
    if (!expectedDeps['d3-shape']) expectedDeps['d3-shape'] = '^3.2.0';
  }

  // Create minimal package.json if missing
  if (!pkg) {
    pkg = {
      name: `${WORKSPACE.PIE_LIB_PREFIX}${pkgName}`,
      private: true,
      version: '0.1.0',
      description:
        (upstreamPkg?.description as string | undefined) ??
        `React implementation of @pie-lib/${pkgName} synced from pie-lib`,
      dependencies: expectedDeps,
    };
  }

  // Update dependencies
  if (Object.keys(expectedDeps).length > 0) {
    pkg.dependencies = expectedDeps;
  }

  // Special handling for math-rendering: reference MathJax adapter package
  if (pkgName === 'math-rendering') {
    pkg.dependencies = {
      [`${WORKSPACE.PIE_ELEMENT_PREFIX}shared-math-rendering-mathjax`]: WORKSPACE.VERSION,
    };
  }

  // Generate exports
  const exportsObj: Record<string, unknown> = {
    ...(typeof pkg.exports === 'object' && pkg.exports
      ? (pkg.exports as Record<string, unknown>)
      : {}),
  };

  exportsObj['.'] = {
    types: './dist/index.d.ts',
    default: './dist/index.js',
  };

  pkg.name = `${WORKSPACE.PIE_LIB_PREFIX}${pkgName}`;
  pkg.type = PACKAGE_DEFAULTS.TYPE;
  pkg.main = './dist/index.js';
  pkg.types = './dist/index.d.ts';
  pkg.exports = exportsObj;

  // Ensure files array
  const files = Array.isArray(pkg.files) ? (pkg.files as unknown[]) : [];
  const normalizedFiles = new Set<string>(files.filter((v): v is string => typeof v === 'string'));
  normalizedFiles.add('dist');
  normalizedFiles.add('src');
  pkg.files = Array.from(normalizedFiles).sort();

  if (typeof pkg.sideEffects === 'undefined') {
    pkg.sideEffects = PACKAGE_DEFAULTS.SIDE_EFFECTS;
  }

  // Ensure build scripts
  if (!pkg.scripts || typeof pkg.scripts !== 'object') {
    pkg.scripts = {};
  }

  const scripts = pkg.scripts as Record<string, string>;
  scripts.build = SCRIPTS.BUILD;
  scripts.dev = SCRIPTS.DEV;
  scripts.test = SCRIPTS.TEST;

  const nextContent = `${JSON.stringify(pkg, null, 2)}\n`;
  const currentContent = existsSync(pkgPath)
    ? await readFile(pkgPath, 'utf-8').catch(() => null)
    : null;

  if (currentContent === nextContent) {
    return false;
  }

  await writeFile(pkgPath, nextContent, 'utf-8');
  return true;
}
