/**
 * Centralized package.json management for upstream sync operations
 *
 * This module consolidates all package.json generation and management logic
 * to eliminate the massive duplication between controllers-strategy and react-strategy.
 */

import { existsSync, readFileSync } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { loadPackageJson, type PackageJson } from '../../utils/package-json.js';
import type { SyncConfig } from './sync-strategy.js';
import { existsAny } from './sync-filesystem.js';
import { applyPackageJsonTransforms } from './sync-transforms.js';
import { BUILD_TOOLS, REACT, PACKAGE_DEFAULTS, SCRIPTS, WORKSPACE } from './sync-constants.js';
import {
  getPieLibDependencyAugmentations,
  getPieLibDependencyOverride,
  shouldGenerateConfigUiFractionHelper,
  shouldGenerateAutosizeInputComponent,
} from './sync-presets.js';

interface EntryPointMap {
  hasIndex: boolean;
  hasDelivery: boolean;
  hasAuthor: boolean;
  hasController: boolean;
  hasConfigure: boolean;
  hasPrint: boolean;
  hasRuntimeSupport: boolean;
  hasTypes: boolean;
}

interface BrowserEsmPolicy {
  sharedDependencyVersions?: Record<string, string>;
}

type LegacyConfigureEntry = 'author' | 'configure';

function getLegacyConfigureEntry(entryPoints: EntryPointMap): LegacyConfigureEntry | null {
  if (entryPoints.hasConfigure) {
    return 'configure';
  }
  if (entryPoints.hasAuthor) {
    return 'author';
  }
  return null;
}

function distEntryExport(entry: LegacyConfigureEntry): Record<string, string> {
  return {
    types: `./dist/${entry}/index.d.ts`,
    default: `./dist/${entry}/index.js`,
  };
}

function readBrowserEsmPolicy(rootDir: string): BrowserEsmPolicy {
  const policyPath = join(rootDir, 'tools/vite/browser-esm-policy.json');
  if (!existsSync(policyPath)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(policyPath, 'utf-8')) as BrowserEsmPolicy;
  } catch {
    return {};
  }
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
    hasRuntimeSupport: existsAny([
      join(elementDir, 'src/runtime-support.ts'),
      join(elementDir, 'src/runtime-support.tsx'),
      join(elementDir, 'src/runtime-support.js'),
      join(elementDir, 'src/runtime-support.jsx'),
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
export function generateExportsObject(
  entryPoints: EntryPointMap,
  options: { includeBrowserExports?: boolean } = {}
): Record<string, unknown> {
  const includeBrowserExports = options.includeBrowserExports ?? false;
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
    if (includeBrowserExports) {
      exports['./browser/delivery'] = {
        default: './dist/browser/delivery/index.js',
      };
    }
  }

  if (entryPoints.hasAuthor) {
    exports['./author'] = {
      types: './dist/author/index.d.ts',
      default: './dist/author/index.js',
    };
    if (includeBrowserExports) {
      exports['./browser/author'] = {
        default: './dist/browser/author/index.js',
      };
    }
  }

  const legacyConfigureEntry = getLegacyConfigureEntry(entryPoints);
  if (legacyConfigureEntry) {
    exports['./configure'] = distEntryExport(legacyConfigureEntry);
  }

  if (entryPoints.hasController) {
    exports['./controller'] = {
      types: './dist/controller/index.d.ts',
      default: './dist/controller/index.js',
    };
    exports['./controller.js'] = {
      types: './dist/controller/index.d.ts',
      default: './dist/controller/index.js',
    };
    if (includeBrowserExports) {
      exports['./browser/controller'] = {
        default: './dist/browser/controller/index.js',
      };
    }
  }

  if (entryPoints.hasPrint) {
    exports['./print'] = {
      types: './dist/print/index.d.ts',
      default: './dist/print/index.js',
    };
    if (includeBrowserExports) {
      exports['./browser/print'] = {
        default: './dist/browser/print/index.js',
      };
    }
  }

  if (entryPoints.hasTypes) {
    exports['./types'] = {
      types: './dist/types/index.d.ts',
      default: './dist/types/index.js',
    };
  }

  if (entryPoints.hasRuntimeSupport) {
    exports['./runtime-support'] = {
      types: './dist/runtime-support.d.ts',
      default: './dist/runtime-support.js',
    };
  }

  return exports;
}

function generateRuntimeSupportSource(elementName: string, entryPoints: EntryPointMap): string {
  const packageName = `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}`;
  return `export const runtimeSupport = {
  schemaVersion: 1,
  packageName: '${packageName}',
  supports: {
    esm: {
      delivery: ${entryPoints.hasDelivery},
      author: ${entryPoints.hasAuthor},
      print: ${entryPoints.hasPrint},
    },
  },
};

export default runtimeSupport;
`;
}

async function ensureBrowserRuntimeSupportSource(
  elementName: string,
  elementDir: string,
  entryPoints: EntryPointMap
): Promise<boolean> {
  const runtimeSupportPath = join(elementDir, 'src', 'runtime-support.ts');
  const nextContent = generateRuntimeSupportSource(elementName, entryPoints);
  const currentContent = existsSync(runtimeSupportPath)
    ? await readFile(runtimeSupportPath, 'utf-8').catch(() => null)
    : null;

  if (currentContent === nextContent) {
    return false;
  }

  await mkdir(dirname(runtimeSupportPath), { recursive: true });
  await writeFile(runtimeSupportPath, nextContent, 'utf-8');
  return true;
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

const LEGACY_PEERS_TO_SKIP = new Set(['@emotion/core']);

async function findInstalledPackageJson(
  packageName: string,
  fromDir: string
): Promise<PackageJson | null> {
  try {
    const { createRequire } = await import('node:module');
    const req = createRequire(resolve(fromDir, 'package.json'));
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
  fromDir: string,
  declaredPeerDeps: Set<string> = new Set()
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
    const optionalPeers = new Set(
      Object.entries(
        (installedPkg?.peerDependenciesMeta as Record<string, { optional?: boolean }>) ?? {}
      )
        .filter(([, meta]) => meta?.optional)
        .map(([peerName]) => peerName)
    );

    for (const [peerName, peerVersion] of Object.entries(peerDeps)) {
      if (
        deps[peerName] ||
        declaredPeerDeps.has(peerName) ||
        optionalPeers.has(peerName) ||
        LEGACY_PEERS_TO_SKIP.has(peerName)
      ) {
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
    deps['react-is'] = '^18.3.1';
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

  if (deps['@visx/curve'] && !deps['d3-shape']) {
    deps['d3-shape'] = '^3.2.0';
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
  let expectedDeps: Record<string, string> = {};

  for (const [name, version] of Object.entries(upstreamDeps)) {
    if (name.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
      expectedDeps[name] = WORKSPACE.VERSION;
    } else if (name !== 'react' && name !== 'react-dom') {
      expectedDeps[name] = version;
    }
  }

  return expectedDeps;
}

function resolveSyncedVersion(
  upstreamPkg: PackageJson | null,
  existingPkg: PackageJson | null
): string {
  const existingVersion = typeof existingPkg?.version === 'string' ? existingPkg.version : null;
  if (existingVersion) {
    return existingVersion;
  }
  const upstreamVersion = typeof upstreamPkg?.version === 'string' ? upstreamPkg.version : null;
  return upstreamVersion || '0.1.0';
}

/**
 * Ensure devDependencies include all required build tools.
 *
 * The pinned versions in BUILD_TOOLS / REACT are the source of truth for the
 * monorepo's toolchain, so we overwrite any existing entries instead of only
 * filling in missing ones. This prevents an upstream package.json from
 * silently downgrading vite / @vitejs/plugin-react / typescript across the
 * pie-lib packages during `upstream:update`.
 */
export function ensureBuildToolDependencies(pkg: PackageJson): void {
  if (!pkg.devDependencies || typeof pkg.devDependencies !== 'object') {
    pkg.devDependencies = {};
  }

  const devDeps = pkg.devDependencies as Record<string, string>;

  devDeps.vite = BUILD_TOOLS.VITE;
  devDeps.typescript = BUILD_TOOLS.TYPESCRIPT;
  devDeps['@vitejs/plugin-react'] = BUILD_TOOLS.VITE_REACT_PLUGIN;
  devDeps['@types/react'] = REACT.TYPES_VERSION;
  devDeps['@types/react-dom'] = REACT.TYPES_VERSION;
}

/**
 * Check if a @pie-framework or @pie-element/shared- package exists in the workspace
 *
 * Supports both legacy @pie-framework naming and new @pie-element/shared- naming.
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
  config: SyncConfig,
  options: { includeBrowserExports?: boolean } = {}
): Promise<boolean> {
  if (!existsSync(elementDir)) {
    return false;
  }

  const pkgPath = join(elementDir, 'package.json');
  const upstreamPkgPath = join(config.pieElements, 'packages', elementName, 'package.json');
  const includeBrowserExports = options.includeBrowserExports ?? false;

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
  const declaredPeerDeps = new Set([
    ...Object.keys((pkg?.peerDependencies as Record<string, string> | undefined) ?? {}),
    'react',
    'react-dom',
  ]);

  // Scan source files for actual imports to catch dependencies from skipped directories
  const importedPackages = await extractImportsFromSources(elementDir);

  // Add workspace dependencies found in imports
  const currentPackageName = `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}`;
  for (const imported of importedPackages) {
    // Skip self-dependencies (package importing from itself)
    if (imported === currentPackageName) {
      continue;
    }
    if (imported === 'react' || imported === 'react-dom') {
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
    } else if (!expectedDeps[imported]) {
      // Keep element package.json aligned with actual runtime imports from src/.
      // Upstream package.json can miss third-party deps after source transforms.
      const installedPkg = await findInstalledPackageJson(imported, elementDir);
      if (installedPkg?.version) {
        expectedDeps[imported] = `^${installedPkg.version}`;
      } else {
        const inferredPeerVersion = await inferPeerVersionFromDeclaredDeps(
          imported,
          expectedDeps,
          elementDir
        );
        if (inferredPeerVersion) {
          expectedDeps[imported] = inferredPeerVersion;
        }
      }
    }
  }
  await addTransitivePeerDependencies(expectedDeps, elementDir, declaredPeerDeps);
  addKnownPeerFallbacks(expectedDeps);

  // Create minimal package.json if missing
  if (!pkg) {
    pkg = {
      name: `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}`,
      private: true,
      version: resolveSyncedVersion(upstreamPkg, null),
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
  pkg.peerDependencies = {
    ...((pkg.peerDependencies as Record<string, string> | undefined) ?? {}),
    react: REACT.VERSION,
    'react-dom': REACT.VERSION,
  };

  // Preserve pie metadata (if present upstream or locally)
  const pieMetadata = ((upstreamPkg as PackageJson | null | undefined)?.pie ??
    (pkg as PackageJson | null | undefined)?.pie ??
    undefined) as
    | {
        capabilities?: string[];
        controller?: string;
        configure?: string;
        browserSharedDependencies?: Record<string, string>;
      }
    | undefined;

  // Apply all standard transformations
  pkg = applyPackageJsonTransforms(pkg);

  // Detect available entry points
  const entryPoints = detectEntryPoints(elementDir);
  const wroteRuntimeSupport =
    includeBrowserExports && !entryPoints.hasRuntimeSupport
      ? await ensureBrowserRuntimeSupportSource(elementName, elementDir, entryPoints)
      : false;
  if (includeBrowserExports) {
    entryPoints.hasRuntimeSupport = true;
  }

  // Generate dist-only exports based on entry points. Do not preserve
  // source-backed `development` conditions; PIE-605 makes raw source paths a
  // private implementation detail and keeps public package surfaces dist-only.
  const nextPieMetadata = pieMetadata ? { ...pieMetadata } : {};
  if (entryPoints.hasController) {
    nextPieMetadata.controller = `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}/controller`;
  } else {
    delete nextPieMetadata.controller;
  }
  const legacyConfigureEntry = getLegacyConfigureEntry(entryPoints);
  if (legacyConfigureEntry) {
    nextPieMetadata.configure = `${WORKSPACE.PIE_ELEMENT_PREFIX}${elementName}/configure`;
  } else {
    delete nextPieMetadata.configure;
  }
  if (includeBrowserExports) {
    const browserEsmPolicy = readBrowserEsmPolicy(config.pieElementsNg);
    if (browserEsmPolicy.sharedDependencyVersions) {
      nextPieMetadata.browserSharedDependencies = browserEsmPolicy.sharedDependencyVersions;
    }
  } else {
    delete nextPieMetadata.browserSharedDependencies;
  }

  if (Object.keys(nextPieMetadata).length > 0) {
    pkg.pie = nextPieMetadata;
  } else {
    delete pkg.pie;
  }

  const hasBrowserBuild = includeBrowserExports;
  pkg.exports = generateExportsObject(entryPoints, { includeBrowserExports: hasBrowserBuild });

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
  pkg.version = resolveSyncedVersion(upstreamPkg, pkg);
  pkg.type = PACKAGE_DEFAULTS.TYPE;
  pkg.main = './dist/index.js';
  pkg.types = './dist/index.d.ts';

  // Ensure publish surface is dist-only. Source remains available in the repo,
  // but must not be published as a public package API. Controller-bearing
  // elements additionally publish the root shim required by legacy builders.
  const files = Array.isArray(pkg.files) ? (pkg.files as unknown[]) : [];
  const normalizedFiles = new Set<string>(files.filter((v): v is string => typeof v === 'string'));
  normalizedFiles.add('dist');
  normalizedFiles.delete('src');
  if (entryPoints.hasController) {
    normalizedFiles.add('controller.js');
  } else {
    normalizedFiles.delete('controller.js');
  }
  if (legacyConfigureEntry) {
    normalizedFiles.add('configure.js');
  } else {
    normalizedFiles.delete('configure.js');
  }
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

  if (hasBrowserBuild) {
    scripts.build = hasIifeEntry ? SCRIPTS.BUILD_WITH_IIFE_AND_BROWSER : SCRIPTS.BUILD_WITH_BROWSER;
  } else {
    scripts.build = hasIifeEntry ? SCRIPTS.BUILD_WITH_IIFE : SCRIPTS.BUILD;
  }
  scripts.dev = SCRIPTS.DEV;
  scripts.demo = SCRIPTS.DEMO;
  scripts.test = SCRIPTS.TEST;

  const controllerShimPath = join(elementDir, 'controller.js');
  const controllerShimContent = "export * from './dist/controller/index.js';\n";
  const hasControllerShim = existsSync(controllerShimPath);
  const currentControllerShim = hasControllerShim
    ? await readFile(controllerShimPath, 'utf-8').catch(() => null)
    : null;
  const shouldWriteControllerShim =
    entryPoints.hasController && currentControllerShim !== controllerShimContent;
  const shouldRemoveControllerShim = !entryPoints.hasController && hasControllerShim;
  const configureShimPath = join(elementDir, 'configure.js');
  const configureShimContent = legacyConfigureEntry
    ? `export { default } from './dist/${legacyConfigureEntry}/index.js';\nexport * from './dist/${legacyConfigureEntry}/index.js';\n`
    : null;
  const hasConfigureShim = existsSync(configureShimPath);
  const currentConfigureShim = hasConfigureShim
    ? await readFile(configureShimPath, 'utf-8').catch(() => null)
    : null;
  const shouldWriteConfigureShim =
    configureShimContent !== null && currentConfigureShim !== configureShimContent;
  const shouldRemoveConfigureShim = configureShimContent === null && hasConfigureShim;

  // Check if content changed
  const nextContent = `${JSON.stringify(pkg, null, 2)}\n`;
  const currentContent = existsSync(pkgPath)
    ? await readFile(pkgPath, 'utf-8').catch(() => null)
    : null;

  if (
    currentContent === nextContent &&
    !wroteRuntimeSupport &&
    !shouldWriteControllerShim &&
    !shouldRemoveControllerShim &&
    !shouldWriteConfigureShim &&
    !shouldRemoveConfigureShim
  ) {
    return false;
  }

  // Write updated package.json
  if (currentContent !== nextContent) {
    await writeFile(pkgPath, nextContent, 'utf-8');
  }
  if (shouldWriteControllerShim) {
    await writeFile(controllerShimPath, controllerShimContent, 'utf-8');
  } else if (shouldRemoveControllerShim) {
    await unlink(controllerShimPath).catch(() => {});
  }
  if (shouldWriteConfigureShim && configureShimContent !== null) {
    await writeFile(configureShimPath, configureShimContent, 'utf-8');
  } else if (shouldRemoveConfigureShim) {
    await unlink(configureShimPath).catch(() => {});
  }
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
  let expectedDeps: Record<string, string> = {};

  for (const [name, version] of Object.entries(upstreamDeps)) {
    if (name.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
      expectedDeps[name] = WORKSPACE.VERSION;
    } else {
      expectedDeps[name] = version;
    }
  }

  const importedPackages = await extractImportsFromSources(pkgDir);
  for (const importedPkg of importedPackages) {
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

  const dependencyAugmentations = getPieLibDependencyAugmentations(pkgName);
  for (const [depName, version] of Object.entries(dependencyAugmentations)) {
    if (!expectedDeps[depName]) {
      expectedDeps[depName] = version;
    }
  }

  const declaresReactRuntime =
    typeof expectedDeps.react === 'string' || typeof expectedDeps['react-dom'] === 'string';

  expectedDeps =
    (applyPackageJsonTransforms({ dependencies: expectedDeps } as PackageJson, {
      removeReactInputAutosize: shouldGenerateAutosizeInputComponent(pkgName),
      removeMathjs:
        shouldGenerateConfigUiFractionHelper(pkgName) && !importedPackages.has('mathjs'),
    }).dependencies as Record<string, string> | undefined) ?? {};

  // Create minimal package.json if missing
  if (!pkg) {
    pkg = {
      name: `${WORKSPACE.PIE_LIB_PREFIX}${pkgName}`,
      private: true,
      version: resolveSyncedVersion(upstreamPkg, null),
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

  const dependencyOverride = getPieLibDependencyOverride(pkgName);
  if (dependencyOverride) {
    pkg.dependencies = dependencyOverride;
  }

  if (declaresReactRuntime) {
    pkg.peerDependencies = {
      ...((pkg.peerDependencies as Record<string, string> | undefined) ?? {}),
      react: REACT.VERSION,
      'react-dom': REACT.VERSION,
    };
  }

  // Generate dist-only exports. Pie-lib packages expose only their compiled
  // top-level entry; raw source paths are intentionally not public.
  const exportsObj: Record<string, unknown> = {};

  exportsObj['.'] = {
    types: './dist/index.d.ts',
    default: './dist/index.js',
  };

  pkg.name = `${WORKSPACE.PIE_LIB_PREFIX}${pkgName}`;
  pkg.version = resolveSyncedVersion(upstreamPkg, pkg);
  pkg.type = PACKAGE_DEFAULTS.TYPE;
  pkg.main = './dist/index.js';
  pkg.types = './dist/index.d.ts';
  pkg.exports = exportsObj;

  // Ensure publish surface is dist-only. Source remains available in the repo,
  // but must not be published as a public package API.
  pkg.files = ['dist'];

  if (typeof pkg.sideEffects === 'undefined') {
    pkg.sideEffects = PACKAGE_DEFAULTS.SIDE_EFFECTS;
  }

  // Pie-lib packages use a vite.config.ts that imports @vitejs/plugin-react,
  // so their devDependencies must include the same build toolchain that
  // element packages do. Without this, a fresh `bun install` (no hoisting)
  // fails to resolve the plugin when turbo runs `vite build` per package.
  ensureBuildToolDependencies(pkg);

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
