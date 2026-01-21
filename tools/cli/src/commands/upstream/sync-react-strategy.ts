/**
 * React components sync strategy - syncs React components from upstream pie-elements
 *
 * Synced from: pie-elements/packages/{element}/src/
 * Target: packages/elements-react/{element}/src/
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat as fsStat, writeFile, rm as fsRm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { convertJsToTs, convertJsxToTsx } from '../../utils/conversion.js';
import { getCurrentCommit } from '../../utils/git.js';
import { loadPackageJson, writePackageJson, type PackageJson } from '../../utils/package-json.js';
import type { SyncStrategy, SyncContext, SyncConfig, SyncResult } from './sync-strategy.js';
import { cleanDirectory, existsAny, readdir } from './sync-filesystem.js';
import { demoOverrides } from './demo-overrides.js';
import { createExternalFunction, createKonvaExternalFunction } from './sync-externals.js';
import {
  fixImportsInFile,
  containsJsx,
  transformLodashToLodashEs,
  transformPackageJsonLodash,
  transformPieFrameworkEventImports,
  transformPackageJsonPieEvents,
  inlineConfigureDefaults,
} from './sync-imports.js';

interface InternalSyncResult {
  filesChecked: number;
  filesCopied: number;
  filesSkipped: number;
  filesUpdated: number;
}

export class ReactComponentsStrategy implements SyncStrategy {
  private touchedElementPackages = new Set<string>();
  private result: InternalSyncResult = {
    filesChecked: 0,
    filesCopied: 0,
    filesSkipped: 0,
    filesUpdated: 0,
  };

  getName(): string {
    return 'react-components';
  }

  getDescription(): string {
    return 'React components';
  }

  shouldRun(config: SyncConfig): boolean {
    return config.syncReactComponents;
  }

  async execute(context: SyncContext): Promise<SyncResult> {
    const { config, logger } = context;
    this.touchedElementPackages.clear();
    this.result = {
      filesChecked: 0,
      filesCopied: 0,
      filesSkipped: 0,
      filesUpdated: 0,
    };

    if (!logger.isVerbose()) {
      logger.progressStart('Syncing React components...');
    } else {
      logger.section('⚛️  Syncing React components');
    }

    const upstreamElementsDir = join(config.pieElements, 'packages');
    const targetBaseDir = join(config.pieElementsNg, 'packages/elements-react');

    const upstreamCommit = getCurrentCommit(config.pieElements);
    const syncDate = new Date().toISOString().split('T')[0];

    const packages = await readdir(upstreamElementsDir);

    for (const pkg of packages) {
      if (context.packageFilter && pkg !== context.packageFilter) {
        continue;
      }

      // Check if element is in compatibility report (ESM-compatible)
      if (context.compatibilityReport) {
        if (!context.compatibilityReport.elements.includes(pkg)) {
          continue; // Skip non-compatible elements
        }

        // Check if student UI (src/) is ESM-compatible
        if (!this.isSubdirectoryCompatible(pkg, 'src', context)) {
          if (logger.isVerbose()) {
            logger.info(`  ⏭️  ${pkg}: skipping src/ (not ESM-compatible)`);
          }
          continue;
        }
      }

      // Check if React component exists upstream (src/ directory)
      const componentSrcDir = join(upstreamElementsDir, pkg, 'src');
      if (!existsSync(componentSrcDir)) {
        continue;
      }

      // Target: packages/elements-react/{element}/src/
      const targetDir = join(targetBaseDir, pkg);
      const targetSrcDir = join(targetDir, 'src');

      // Clean target src subtree first so removed upstream files don't linger
      // BUT: preserve controller/ subdirectory if it exists (synced separately)
      await this.cleanTargetDirExcept(
        targetSrcDir,
        ['controller'],
        `elements-react/${pkg}/src`,
        logger
      );

      // Recursively sync all files from src/ directory
      const beforeChanges = this.result.filesCopied + this.result.filesUpdated;
      let elementFilesProcessed = await this.syncDirectory(
        componentSrcDir,
        targetSrcDir,
        'src',
        pkg,
        upstreamCommit,
        syncDate
      );

      // Also sync configure/src/ if it exists and is ESM-compatible
      const configureSrcDir = join(upstreamElementsDir, pkg, 'configure/src');
      if (existsSync(configureSrcDir)) {
        // Check if configure subdirectory is ESM-compatible
        const configureCompatible = this.isSubdirectoryCompatible(pkg, 'configure', context);
        if (configureCompatible) {
          const targetConfigureDir = join(targetDir, 'src/configure');
          const configureFilesProcessed = await this.syncDirectory(
            configureSrcDir,
            targetConfigureDir,
            'configure/src',
            pkg,
            upstreamCommit,
            syncDate
          );
          elementFilesProcessed += configureFilesProcessed;
        } else if (logger.isVerbose()) {
          logger.info(`  ⏭️  ${pkg}: skipping configure/ (not ESM-compatible)`);
        }
      }
      const afterChanges = this.result.filesCopied + this.result.filesUpdated;
      const elementChanged = afterChanges > beforeChanges;

      if (elementFilesProcessed > 0 && logger.isVerbose()) {
        logger.success(`  ✨ ${pkg}: ${elementFilesProcessed} file(s) synced`);
      }

      // Ensure package.json has ESM module support and expected exports
      let wrotePkgJson = false;
      const elementDir = join(targetBaseDir, pkg);
      wrotePkgJson = await this.ensureElementPackageJson(pkg, elementDir, config, logger);
      await this.ensureElementViteConfig(pkg, elementDir, logger);

      // Ensure IIFE build configuration
      await this.ensureIifeEntryPoint(pkg, elementDir, config, logger);
      await this.ensureIifeViteConfig(pkg, elementDir, config, logger);

      // Ensure demo structure
      await this.ensureElementDemoStructure(pkg, elementDir, config, logger);
      await this.applyDemoOverrides(pkg, elementDir);

      if (elementChanged || wrotePkgJson) {
        this.touchedElementPackages.add(pkg);
      }
    }

    await this.applyOverridesForExistingElements(targetBaseDir);

    if (!logger.isVerbose()) {
      logger.progressCompleteWithCount(this.touchedElementPackages.size, 'packages');
    } else {
      logger.info(`\nSynced ${this.touchedElementPackages.size} React component package(s)`);
    }
    return {
      count: this.touchedElementPackages.size,
      packageNames: Array.from(this.touchedElementPackages).sort(),
    };
  }

  private async applyOverridesForExistingElements(targetBaseDir: string): Promise<void> {
    const overrideElements = Object.keys(demoOverrides);
    for (const elementName of overrideElements) {
      const elementDir = join(targetBaseDir, elementName);
      if (!existsSync(elementDir)) continue;
      await this.applyDemoOverrides(elementName, elementDir);
    }
  }

  /**
   * Check if a subdirectory is ESM-compatible based on the compatibility report
   */
  private isSubdirectoryCompatible(
    elementName: string,
    subdir: 'src' | 'configure' | 'controller',
    context: SyncContext
  ): boolean {
    // If no compatibility report, assume compatible (backward compatibility)
    if (!context.compatibilityReport) {
      return true;
    }

    const elementDetail = context.compatibilityReport.elementDetails[elementName];
    if (!elementDetail) {
      return true; // Element not in report, assume compatible
    }

    // Check subdirectory-specific compatibility
    if (subdir === 'configure' && elementDetail.configure) {
      return elementDetail.configure.compatible;
    }
    if (subdir === 'controller' && elementDetail.controller) {
      return elementDetail.controller.compatible;
    }
    if (subdir === 'src' && elementDetail.studentUI) {
      return elementDetail.studentUI.compatible;
    }

    // If no subdirectory info, fall back to element-level compatibility
    return elementDetail.compatible;
  }

  private async cleanTargetDirExcept(
    targetDir: string,
    preserveDirs: string[],
    label: string,
    logger: any
  ): Promise<void> {
    await cleanDirectory(
      targetDir,
      label,
      { dryRun: false, verbose: false, preserve: preserveDirs },
      logger
    );
  }

  private async syncDirectory(
    sourceDir: string,
    targetDir: string,
    relativePath: string,
    pkg: string,
    upstreamCommit: string,
    syncDate: string
  ): Promise<number> {
    let filesProcessed = 0;
    const defaultExportFiles = new Set<string>(); // Track files with default exports

    const items = await readdir(sourceDir);

    for (const item of items) {
      const srcPath = join(sourceDir, item);
      const stat = await fsStat(srcPath);

      if (stat.isDirectory()) {
        // Skip __tests__, __mocks__, etc.
        if (item.startsWith('__')) {
          continue;
        }
        // Recursively sync subdirectories
        const subFilesProcessed = await this.syncDirectory(
          srcPath,
          join(targetDir, item),
          join(relativePath, item),
          pkg,
          upstreamCommit,
          syncDate
        );
        filesProcessed += subFilesProcessed;
        continue;
      }

      // Only process .js and .jsx files
      if (!item.endsWith('.js') && !item.endsWith('.jsx')) {
        continue;
      }

      this.result.filesChecked++;
      filesProcessed++;

      // Read source
      let sourceContent = await readFile(srcPath, 'utf-8');

      // Transform lodash to lodash-es for ESM compatibility
      sourceContent = transformLodashToLodashEs(sourceContent);

      // Transform @pie-framework event packages to internal packages
      sourceContent = transformPieFrameworkEventImports(sourceContent);

      // Inline configure defaults if configure wasn't synced
      sourceContent = inlineConfigureDefaults(sourceContent);

      const hasJsx = item.endsWith('.jsx') || (item.endsWith('.js') && containsJsx(sourceContent));

      // Convert .js → .ts/.tsx and .jsx → .tsx
      const targetFile = item.replace(/\.jsx?$/, hasJsx ? '.tsx' : '.ts');
      const targetPath = join(targetDir, targetFile);

      // Convert based on file extension
      const conversionResult = hasJsx
        ? convertJsxToTsx(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
            date: syncDate,
          })
        : convertJsToTs(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
            date: syncDate,
          });

      const converted = conversionResult.code;

      // Track files that export default objects (for import fixing later)
      if (conversionResult.hasDefaultObjectExport) {
        // Store the file name without extension for import matching
        const fileNameWithoutExt = targetFile.replace(/\.(ts|tsx)$/, '');
        defaultExportFiles.add(fileNameWithoutExt);
      }

      // Check if different
      // NOTE: This comparison is exact (===) to ensure any changes in:
      // - Upstream source code
      // - Transformation logic (lodash-es, event packages, etc.)
      // - Sync version (tracked in @sync-version header)
      // will trigger a file update. This prioritizes correctness over speed.
      const isNew = !existsSync(targetPath);
      if (!isNew) {
        const currentContent = await readFile(targetPath, 'utf-8');
        if (currentContent === converted) {
          this.result.filesSkipped++;
          continue;
        }
        this.result.filesUpdated++;
      } else {
        this.result.filesCopied++;
      }

      // Write
      await mkdir(dirname(targetPath), { recursive: true });
      await writeFile(targetPath, converted, 'utf-8');
    }

    // After all files are synced, fix import statements in consuming files
    if (defaultExportFiles.size > 0) {
      const targetDirItems = await readdir(targetDir);
      for (const item of targetDirItems) {
        const itemPath = join(targetDir, item);
        const stat = await fsStat(itemPath);
        if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
          await fixImportsInFile(itemPath, defaultExportFiles);
        }
      }
    }

    return filesProcessed;
  }

  private async ensureElementPackageJson(
    elementName: string,
    elementDir: string,
    config: SyncConfig,
    _logger: any
  ): Promise<boolean> {
    // Only operate when the element directory exists
    if (!existsSync(elementDir)) {
      return false;
    }

    const pkgPath = join(elementDir, 'package.json');
    const upstreamPkgPath = join(config.pieElements, 'packages', elementName, 'package.json');

    let pkg: PackageJson | null = null;
    if (existsSync(pkgPath)) {
      pkg = await loadPackageJson(pkgPath).catch(() => null);
    }

    const upstreamPkg = existsSync(upstreamPkgPath)
      ? await loadPackageJson(upstreamPkgPath).catch(() => null)
      : null;

    const upstreamDeps = (upstreamPkg?.dependencies as Record<string, string> | undefined) ?? {};
    const expectedDeps: Record<string, string> = {};

    for (const [name, version] of Object.entries(upstreamDeps)) {
      if (name.startsWith('@pie-lib/')) {
        expectedDeps[name] = 'workspace:*';
      } else if (name !== 'react' && name !== 'react-dom') {
        expectedDeps[name] = version;
      }
    }

    // If missing, generate a minimal package.json based on upstream deps
    if (!pkg) {
      pkg = {
        name: `@pie-element/${elementName}`,
        private: true,
        version: '0.1.0',
        description:
          (upstreamPkg?.description as string | undefined) ??
          `React implementation of ${elementName} element synced from pie-elements`,
        dependencies: expectedDeps,
        peerDependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      };
    }
    // Keep dependencies aligned with upstream for existing packages too.
    if (Object.keys(expectedDeps).length > 0) {
      pkg.dependencies = expectedDeps;
    }

    // Transform lodash to lodash-es for ESM compatibility
    pkg = transformPackageJsonLodash(pkg);

    // Transform @pie-framework event packages to internal packages
    pkg = transformPackageJsonPieEvents(pkg);

    // Compute expected exports based on present source entrypoints
    const exportsObj: Record<string, unknown> = {
      ...(typeof pkg.exports === 'object' && pkg.exports
        ? (pkg.exports as Record<string, unknown>)
        : {}),
    };

    exportsObj['.'] = {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    };
    exportsObj['./src/*'] = './src/*';

    const hasDelivery = existsAny([
      join(elementDir, 'src/delivery/index.ts'),
      join(elementDir, 'src/delivery/index.tsx'),
      join(elementDir, 'src/delivery/index.js'),
      join(elementDir, 'src/delivery/index.jsx'),
    ]);
    if (hasDelivery) {
      exportsObj['./delivery'] = {
        types: './dist/delivery/index.d.ts',
        default: './dist/delivery/index.js',
      };
    }

    const hasAuthoring = existsAny([
      join(elementDir, 'src/authoring/index.ts'),
      join(elementDir, 'src/authoring/index.tsx'),
      join(elementDir, 'src/authoring/index.js'),
      join(elementDir, 'src/authoring/index.jsx'),
    ]);
    if (hasAuthoring) {
      exportsObj['./authoring'] = {
        types: './dist/authoring/index.d.ts',
        default: './dist/authoring/index.js',
      };
    }

    const hasController = existsAny([
      join(elementDir, 'src/controller/index.ts'),
      join(elementDir, 'src/controller/index.tsx'),
      join(elementDir, 'src/controller/index.js'),
      join(elementDir, 'src/controller/index.jsx'),
    ]);
    if (hasController) {
      exportsObj['./controller'] = {
        types: './dist/controller/index.d.ts',
        default: './dist/controller/index.js',
      };
    }

    const hasConfigure = existsAny([
      join(elementDir, 'src/configure/index.ts'),
      join(elementDir, 'src/configure/index.tsx'),
      join(elementDir, 'src/configure/index.js'),
      join(elementDir, 'src/configure/index.jsx'),
    ]);
    if (hasConfigure) {
      exportsObj['./configure'] = {
        types: './dist/configure/index.d.ts',
        default: './dist/configure/index.js',
      };
    }

    pkg.name = `@pie-element/${elementName}`;
    pkg.type = 'module';
    pkg.main = './dist/index.js';
    pkg.types = './dist/index.d.ts';
    pkg.exports = exportsObj;

    // Ensure files includes dist/src (without removing existing entries)
    const files = Array.isArray(pkg.files) ? (pkg.files as unknown[]) : [];
    const normalizedFiles = new Set<string>(
      files.filter((v): v is string => typeof v === 'string')
    );
    normalizedFiles.add('dist');
    normalizedFiles.add('src');
    pkg.files = Array.from(normalizedFiles).sort();

    // Recommend tree-shaking by default unless explicitly set otherwise
    if (typeof pkg.sideEffects === 'undefined') {
      pkg.sideEffects = false;
    }

    // Ensure devDependencies for build tools
    if (!pkg.devDependencies || typeof pkg.devDependencies !== 'object') {
      pkg.devDependencies = {};
    }
    const devDeps = pkg.devDependencies as Record<string, string>;
    if (!devDeps.vite) {
      devDeps.vite = '^6.0.0';
    }
    if (!devDeps.typescript) {
      devDeps.typescript = '^5.9.3';
    }
    if (!devDeps['@vitejs/plugin-react']) {
      devDeps['@vitejs/plugin-react'] = '^4.2.0';
    }
    if (!devDeps['@types/react']) {
      devDeps['@types/react'] = '^18.2.0';
    }
    if (!devDeps['@types/react-dom']) {
      devDeps['@types/react-dom'] = '^18.2.0';
    }

    // Ensure build scripts exist
    if (!pkg.scripts || typeof pkg.scripts !== 'object') {
      pkg.scripts = {};
    }
    const scripts = pkg.scripts as Record<string, string>;
    // Always update build scripts to use bun x for workspace resolution
    // Include IIFE build if IIFE entry point exists
    const hasIifeEntry = existsSync(join(elementDir, 'src/index.iife.ts'));
    if (hasIifeEntry) {
      scripts.build =
        'bun x vite build && bun x vite build --config vite.config.iife.ts && bun x tsc --emitDeclarationOnly';
    } else {
      scripts.build = 'bun x vite build && bun x tsc --emitDeclarationOnly';
    }
    scripts.dev = 'bun x vite';
    scripts.demo = 'bun x vite --mode demo';
    scripts.test = 'bun x vitest run';

    const nextContent = `${JSON.stringify(pkg, null, 2)}\n`;
    const currentContent = existsSync(pkgPath)
      ? await readFile(pkgPath, 'utf-8').catch(() => null)
      : null;
    if (currentContent === nextContent) {
      return false;
    }

    await writePackageJson(pkgPath, pkg);
    return true;
  }

  private async ensureElementViteConfig(
    _elementName: string,
    elementDir: string,
    _logger: any
  ): Promise<void> {
    if (!existsSync(elementDir)) {
      return;
    }

    const viteConfigPath = join(elementDir, 'vite.config.ts');

    // Always regenerate to reflect current directory structure
    // (e.g., if configure/ was skipped due to ESM incompatibility)

    // Detect entry points
    const entryPoints: Record<string, string> = {};

    // Helper to find which file extension exists (.ts or .tsx)
    const findEntry = (basePath: string): string | null => {
      if (existsSync(join(elementDir, `${basePath}.tsx`))) return `${basePath}.tsx`;
      if (existsSync(join(elementDir, `${basePath}.ts`))) return `${basePath}.ts`;
      return null;
    };

    const indexEntry = findEntry('src/index');
    if (indexEntry) {
      entryPoints.index = indexEntry;
    }

    const controllerEntry = findEntry('src/controller/index');
    if (controllerEntry) {
      entryPoints['controller/index'] = controllerEntry;
    }

    const configureEntry = findEntry('src/configure/index');
    if (configureEntry) {
      entryPoints['configure/index'] = configureEntry;
    }

    const deliveryEntry = findEntry('src/delivery/index');
    if (deliveryEntry) {
      entryPoints['delivery/index'] = deliveryEntry;
    }

    if (Object.keys(entryPoints).length === 0) {
      return; // No entry points, skip vite config
    }

    // Format entry points for vite config
    const entryLines = Object.entries(entryPoints)
      .map(([key, value]) => `        '${key}': resolve(__dirname, '${value}'),`)
      .join('\n');

    // Konva is now external like other dependencies - no special bundling needed
    // This avoids workspace dependency resolution issues
    const shouldBundleKonva = false;

    // Check if demo directory exists
    const hasDemoDir = existsSync(join(elementDir, 'docs/demo'));

    // Generate appropriate config based on element characteristics
    const viteConfig = shouldBundleKonva
      ? this.generateViteConfigWithBundledKonva(entryLines, hasDemoDir)
      : this.generateStandardViteConfig(entryLines, hasDemoDir);

    await writeFile(viteConfigPath, viteConfig, 'utf-8');
  }

  private generateStandardViteConfig(entryLines: string, hasDemoDir: boolean): string {
    const demoModeConfig = hasDemoDir
      ? `({ mode, command }) => {
  // Demo mode: serve the docs/demo directory
  if (mode === 'demo' && command === 'serve') {
    return {
      plugins: [react()],
      root: resolve(__dirname, 'docs/demo'),
    };
  }

  // Build mode: build the library
  return {`
      : `{`;

    return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(${demoModeConfig}
  plugins: [react()],
  build: {
    lib: {
      entry: {
${entryLines}
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ${createExternalFunction('element')},
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },${hasDemoDir ? '\n  };' : ''}
});
`;
  }

  private generateViteConfigWithBundledKonva(entryLines: string, hasDemoDir: boolean): string {
    const demoModeConfig = hasDemoDir
      ? `({ mode, command }) => ({
  plugins: [react()],
  // Only change root for demo mode when serving (not building)
  root: mode === 'demo' && command === 'serve' ? resolve(__dirname, 'docs/demo') : __dirname,`
      : `{
  plugins: [react()],`;

    return `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(${demoModeConfig}
  build: {
    lib: {
      entry: {
${entryLines}
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ${createKonvaExternalFunction()},
      output: {
        preserveModules: false,
        // Paths helps resolve external lodash imports correctly in the bundled output
        paths: (id) => {
          if (id.startsWith('lodash/')) {
            // Keep lodash subpath imports as-is so they resolve via import map
            return id;
          }
          return id;
        },
      },
    },
  },
}${hasDemoDir ? '))' : ')'};
`;
  }

  /**
   * Ensure IIFE entry point exists for element
   */
  private async ensureIifeEntryPoint(
    elementName: string,
    elementDir: string,
    _config: SyncConfig,
    _logger: any
  ): Promise<void> {
    const iifeEntryPath = join(elementDir, 'src/index.iife.ts');

    // Check if main entry point exists
    const mainEntryExists = existsAny([
      join(elementDir, 'src/index.ts'),
      join(elementDir, 'src/index.tsx'),
    ]);

    if (!mainEntryExists) {
      return; // No main entry, skip IIFE
    }

    const iifeContent = `/**
 * IIFE entry point for ${elementName} element
 * This file is only used for IIFE builds and includes auto-registration
 *
 * @sync-generated - Auto-generated during sync from pie-elements
 */

import Element from './index';

// Auto-register the custom element for IIFE mode
if (typeof window !== 'undefined' && !customElements.get('${elementName}-element')) {
  customElements.define('${elementName}-element', Element);
}

// Export for IIFE global
export default Element;
`;

    await writeFile(iifeEntryPath, iifeContent, 'utf-8');
  }

  /**
   * Ensure IIFE Vite config exists for element
   */
  private async ensureIifeViteConfig(
    elementName: string,
    elementDir: string,
    _config: SyncConfig,
    _logger: any
  ): Promise<void> {
    const iifeViteConfigPath = join(elementDir, 'vite.config.iife.ts');

    // Check if IIFE entry exists
    if (!existsSync(join(elementDir, 'src/index.iife.ts'))) {
      return;
    }

    // Compute global name (e.g., "hotspot" → "HotspotElement")
    const globalName =
      elementName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('') + 'Element';

    const config = `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false, // Don't wipe existing ESM builds
    lib: {
      entry: resolve(__dirname, 'src/index.iife.ts'),
      name: '${globalName}',
      fileName: () => 'index.iife.js',
      formats: ['iife'] as const,
    },
    rollupOptions: {
      external: (id: string) => {
        // Bundle everything including React and math-rendering
        // This creates a fully self-contained IIFE bundle
        return false;
      },
      output: {
        // IIFE global name
        name: '${globalName}',
        extend: true,
      },
    },
  },
});
`;

    await writeFile(iifeViteConfigPath, config, 'utf-8');
  }

  /**
   * Ensure element demo structure exists with dual ESM/IIFE support
   */
  private async ensureElementDemoStructure(
    elementName: string,
    elementDir: string,
    config: SyncConfig,
    _logger: any
  ): Promise<void> {
    const upstreamDemoDir = join(config.pieElements, 'packages', elementName, 'docs/demo');

    // Only generate if upstream has demo files
    if (!existsSync(upstreamDemoDir)) {
      return;
    }

    const targetDemoDir = join(elementDir, 'docs/demo');
    await mkdir(targetDemoDir, { recursive: true });

    // Copy template files and substitute placeholders
    const templates = ['esm-demo.html', 'index.html', 'vite.config.ts.template'];

    const templateDir = join(config.pieElementsNg, 'packages/shared/element-player/templates');

    for (const template of templates) {
      const templatePath = join(templateDir, template);
      if (!existsSync(templatePath)) continue;

      let content = await readFile(templatePath, 'utf-8');

      // Substitute placeholders
      const elementTitle = elementName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      content = content
        .replace(/\{\{ELEMENT_NAME\}\}/g, elementName)
        .replace(/\{\{ELEMENT_TITLE\}\}/g, elementTitle);

      // Determine target filename
      let targetFile = template.replace('.template', '');
      if (template === 'esm-demo.html') targetFile = 'esm.html';

      const targetPath = join(targetDemoDir, targetFile);
      await writeFile(targetPath, content, 'utf-8');
    }

    // Generate esm.ts from template
    const initTemplate = await readFile(join(templateDir, 'demo-init.ts.template'), 'utf-8');

    const content = initTemplate
      .replace(/\{\{MODE\}\}/g, 'esm')
      .replace(/\{\{ELEMENT_NAME\}\}/g, elementName);

    const srcDir = join(targetDemoDir, 'src');
    await mkdir(srcDir, { recursive: true });
    await writeFile(join(srcDir, 'esm.ts'), content, 'utf-8');

    // Copy config.mjs if it exists upstream
    const configMjs = join(upstreamDemoDir, 'config.mjs');
    if (existsSync(configMjs)) {
      const content = await readFile(configMjs, 'utf-8');
      await writeFile(join(targetDemoDir, 'config.mjs'), content, 'utf-8');
    }

    // Convert session.js (CommonJS) to session.mjs (ESM) if it exists upstream
    const sessionJs = join(upstreamDemoDir, 'session.js');
    const sessionMjs = join(upstreamDemoDir, 'session.mjs');

    if (existsSync(sessionMjs)) {
      // If session.mjs exists, just copy it
      const content = await readFile(sessionMjs, 'utf-8');
      await writeFile(join(targetDemoDir, 'session.mjs'), content, 'utf-8');
    } else if (existsSync(sessionJs)) {
      // Convert CommonJS session.js to ESM session.mjs
      const content = await readFile(sessionJs, 'utf-8');
      // Simple conversion: replace module.exports with export default
      const esmContent = content
        .replace(/module\.exports\s*=/, 'export default')
        .replace(/exports\.\w+\s*=/g, 'export const');
      await writeFile(join(targetDemoDir, 'session.mjs'), esmContent, 'utf-8');
    }

    // Apply demo overrides if configured
    await this.applyDemoOverrides(elementName, elementDir);

    // Remove unused generate.js if config.mjs exists
    const configPath = join(targetDemoDir, 'config.mjs');
    const generatePath = join(targetDemoDir, 'generate.js');
    if (existsSync(configPath) && existsSync(generatePath)) {
      await fsRm(generatePath, { force: true });
    }
  }

  private async applyDemoOverrides(elementName: string, elementDir: string): Promise<void> {
    const override = demoOverrides[elementName];
    if (!override) return;

    const targetDemoDir = join(elementDir, 'docs/demo');
    if (!existsSync(targetDemoDir)) return;

    if (override.model) {
      const configPath = join(targetDemoDir, 'config.mjs');
      const configContent = `export default ${JSON.stringify({ models: [override.model] }, null, 2)};\n`;
      await writeFile(configPath, configContent, 'utf-8');

      const generatePath = join(targetDemoDir, 'generate.js');
      if (existsSync(generatePath)) {
        await fsRm(generatePath, { force: true });
      }
    }

    if (override.session) {
      const sessionPath = join(targetDemoDir, 'session.mjs');
      const sessionContent = `export default ${JSON.stringify(override.session, null, 2)};\n`;
      await writeFile(sessionPath, sessionContent, 'utf-8');
    }
  }
}
