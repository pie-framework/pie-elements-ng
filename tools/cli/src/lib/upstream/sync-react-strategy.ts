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
import type { SyncStrategy, SyncContext, SyncConfig, SyncResult } from './sync-strategy.js';
import { cleanDirectory, existsAny, readdir } from './sync-filesystem.js';
import { createExternalFunction, createKonvaExternalFunction } from './sync-externals.js';
import { fixImportsInFile, containsJsx } from './sync-imports.js';
import { createReactComponentTransformPipeline } from './sync-transforms.js';
import { ensureElementPackageJson } from './sync-package-manager.js';
import { isSubdirectoryCompatible } from './sync-compatibility.js';

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
        if (!isSubdirectoryCompatible(pkg, 'src', context)) {
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

      // Recursively sync all files from src/ directory to delivery/ subdirectory
      const beforeChanges = this.result.filesCopied + this.result.filesUpdated;
      const targetDeliveryDir = join(targetDir, 'src/delivery');
      let elementFilesProcessed = await this.syncDirectory(
        componentSrcDir,
        targetDeliveryDir,
        'src',
        pkg,
        upstreamCommit
      );

      // Also sync configure/ if it exists and is ESM-compatible
      // Note: Renamed to author/ in the target directory
      const configureDir = join(upstreamElementsDir, pkg, 'configure');
      if (existsSync(configureDir)) {
        // Check if configure subdirectory is ESM-compatible
        const configureCompatible = isSubdirectoryCompatible(pkg, 'configure', context);
        if (configureCompatible) {
          // First, sync configure/src/ -> src/author/
          const configureSrcDir = join(configureDir, 'src');
          if (existsSync(configureSrcDir)) {
            const targetAuthorDir = join(targetDir, 'src/author');
            const configureFilesProcessed = await this.syncDirectory(
              configureSrcDir,
              targetAuthorDir,
              'configure/src',
              pkg,
              upstreamCommit
            );
            elementFilesProcessed += configureFilesProcessed;
          }

          // Then, sync configure/*.js files (not in subdirectories) -> src/author/
          // These are utility files that live directly in configure/ like utils.js
          const targetAuthorDir = join(targetDir, 'src/author');
          const configureRootFilesProcessed = await this.syncConfigureRootFiles(
            configureDir,
            targetAuthorDir,
            pkg,
            upstreamCommit
          );
          elementFilesProcessed += configureRootFilesProcessed;
        } else if (logger.isVerbose()) {
          logger.info(`  ⏭️  ${pkg}: skipping configure/ (not ESM-compatible)`);
        }
      }

      // Sync print file if it exists (src/print.js -> src/print/index.ts)
      const upstreamPrintFile = join(componentSrcDir, 'print.js');
      if (existsSync(upstreamPrintFile)) {
        const targetPrintDir = join(targetDir, 'src/print');
        const printFilesProcessed = await this.syncPrintFile(
          upstreamPrintFile,
          targetPrintDir,
          pkg,
          upstreamCommit
        );
        elementFilesProcessed += printFilesProcessed;
      }

      // Generate src/index.ts that re-exports from delivery/
      const mainIndexPath = join(targetDir, 'src/index.ts');
      const mainIndexContent = `export { default } from './delivery/index.js';\n`;
      await writeFile(mainIndexPath, mainIndexContent, 'utf-8');

      const afterChanges = this.result.filesCopied + this.result.filesUpdated;
      const elementChanged = afterChanges > beforeChanges;

      if (elementFilesProcessed > 0 && logger.isVerbose()) {
        logger.success(`  ✨ ${pkg}: ${elementFilesProcessed} file(s) synced`);
      }

      // Ensure package.json has ESM module support and expected exports
      let wrotePkgJson = false;
      const elementDir = join(targetBaseDir, pkg);
      wrotePkgJson = await ensureElementPackageJson(pkg, elementDir, config);
      await this.ensureElementViteConfig(pkg, elementDir, logger);
      const wroteTsConfig = await this.ensureTsConfig(pkg, elementDir, logger);

      // Ensure IIFE build configuration
      await this.ensureIifeEntryPoint(pkg, elementDir, config, logger);
      await this.ensureIifeViteConfig(pkg, elementDir, config, logger);

      // Ensure demo structure
      await this.ensureElementDemoStructure(pkg, elementDir, config, logger);
      // Demo configs are maintained locally - we do NOT apply overrides from upstream

      if (elementChanged || wrotePkgJson || wroteTsConfig) {
        this.touchedElementPackages.add(pkg);
      }
    }

    // Demo configs are maintained locally - we do NOT apply overrides to existing elements

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
    upstreamCommit: string
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
          upstreamCommit
        );
        filesProcessed += subFilesProcessed;
        continue;
      }

      // Only process .js and .jsx files
      if (!item.endsWith('.js') && !item.endsWith('.jsx')) {
        continue;
      }

      // Skip print.js/print.jsx files - they're synced to src/print/ separately
      if (item === 'print.js' || item === 'print.jsx') {
        continue;
      }

      this.result.filesChecked++;
      filesProcessed++;

      // Read source
      let sourceContent = await readFile(srcPath, 'utf-8');

      // Apply all standard transformations
      const packageName = `@pie-element/${pkg}`;
      const transformPipeline = createReactComponentTransformPipeline(packageName);
      sourceContent = transformPipeline(sourceContent, join(relativePath, item));

      const hasJsx = item.endsWith('.jsx') || (item.endsWith('.js') && containsJsx(sourceContent));

      // Convert .js → .ts/.tsx and .jsx → .tsx
      const targetFile = item.replace(/\.jsx?$/, hasJsx ? '.tsx' : '.ts');
      const targetPath = join(targetDir, targetFile);

      // Convert based on file extension
      const conversionResult = hasJsx
        ? convertJsxToTsx(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
          })
        : convertJsToTs(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
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

  /**
   * Sync root-level .js files from configure/ directory (not including subdirectories)
   * These are typically utility files like utils.js that are imported by files in configure/src/
   */
  private async syncConfigureRootFiles(
    sourceDir: string,
    targetDir: string,
    pkg: string,
    upstreamCommit: string
  ): Promise<number> {
    let filesProcessed = 0;

    const items = await readdir(sourceDir);

    for (const item of items) {
      const srcPath = join(sourceDir, item);
      const stat = await fsStat(srcPath);

      // Skip directories - we only want root-level files
      if (stat.isDirectory()) {
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

      // Apply all standard transformations
      const packageName = `@pie-element/${pkg}`;
      const transformPipeline = createReactComponentTransformPipeline(packageName);
      sourceContent = transformPipeline(sourceContent);

      const hasJsx = item.endsWith('.jsx') || (item.endsWith('.js') && containsJsx(sourceContent));

      // Convert .js → .ts/.tsx and .jsx → .tsx
      const targetFile = item.replace(/\.jsx?$/, hasJsx ? '.tsx' : '.ts');
      const targetPath = join(targetDir, targetFile);

      // Convert based on file extension
      const conversionResult = hasJsx
        ? convertJsxToTsx(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/configure/${item}`,
            commit: upstreamCommit,
          })
        : convertJsToTs(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/configure/${item}`,
            commit: upstreamCommit,
          });

      const converted = conversionResult.code;

      // Check if file already exists (synced from configure/src/)
      const isNew = !existsSync(targetPath);
      if (!isNew) {
        // File exists - this means configure/src/utils.js was already synced
        // We need to merge the exports instead of overwriting
        const existingContent = await readFile(targetPath, 'utf-8');

        // Extract exports from both files and merge them
        const mergedContent = this.mergeUtilsFiles(existingContent, converted);

        if (existingContent === mergedContent) {
          this.result.filesSkipped++;
          continue;
        }

        await writeFile(targetPath, mergedContent, 'utf-8');
        this.result.filesUpdated++;
      } else {
        // New file - just write it
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, converted, 'utf-8');
        this.result.filesCopied++;
      }
    }

    return filesProcessed;
  }

  /**
   * Sync a single print file (src/print.js -> src/print/index.ts)
   */
  private async syncPrintFile(
    sourceFile: string,
    targetDir: string,
    pkg: string,
    upstreamCommit: string
  ): Promise<number> {
    this.result.filesChecked++;

    // Read source
    let sourceContent = await readFile(sourceFile, 'utf-8');

    // Apply all standard transformations
    const packageName = `@pie-element/${pkg}`;
    const transformPipeline = createReactComponentTransformPipeline(packageName);
    sourceContent = transformPipeline(sourceContent);

    // Transform imports from './' to '../delivery/' since print is now in print/
    // This handles './main', './stimulus-tabs', './choice', etc.
    sourceContent = sourceContent.replace(/from\s+['"]\.\/([^'"]+)['"]/g, "from '../delivery/$1'");
    sourceContent = sourceContent.replace(
      /import\s*\(\s*['"]\.\/([^'"]+)['"]\s*\)/g,
      "import('../delivery/$1')"
    );

    const hasJsx = sourceContent.includes('React.createElement') || containsJsx(sourceContent);

    // Convert to TypeScript
    const conversionResult = hasJsx
      ? convertJsxToTsx(sourceContent, {
          sourcePath: `pie-elements/packages/${pkg}/src/print.js`,
          commit: upstreamCommit,
        })
      : convertJsToTs(sourceContent, {
          sourcePath: `pie-elements/packages/${pkg}/src/print.js`,
          commit: upstreamCommit,
        });

    const converted = conversionResult.code;
    const targetFile = hasJsx ? 'index.tsx' : 'index.ts';
    const targetPath = join(targetDir, targetFile);

    // Check if needs update
    const isNew = !existsSync(targetPath);
    if (!isNew) {
      const existingContent = await readFile(targetPath, 'utf-8');
      if (existingContent === converted) {
        this.result.filesSkipped++;
        return 1;
      }
      await writeFile(targetPath, converted, 'utf-8');
      this.result.filesUpdated++;
    } else {
      await mkdir(targetDir, { recursive: true });
      await writeFile(targetPath, converted, 'utf-8');
      this.result.filesCopied++;
    }

    return 1;
  }

  /**
   * Merge two utils files by combining their exports
   *
   * When syncing configure/ files, we may have:
   * - configure/src/utils.js (already synced to src/configure/utils.ts)
   * - configure/utils.js (being synced now to src/configure/utils.ts)
   *
   * Both files export different functions, so we need to merge them.
   */
  private mergeUtilsFiles(existingContent: string, newContent: string): string {
    // Extract the header comment from existing file (has sync metadata)
    const headerMatch = existingContent.match(/^\/\/ @ts-nocheck\n\/\*\*[\s\S]*?\*\/\n\n/);
    const existingHeader = headerMatch ? headerMatch[0] : '';

    // Extract exports from existing file (remove header and blank lines)
    const existingExports = existingContent
      .replace(/^\/\/ @ts-nocheck\n\/\*\*[\s\S]*?\*\/\n\n/, '')
      .trim();

    // Extract exports from new file (remove header and blank lines)
    const newExports = newContent.replace(/^\/\/ @ts-nocheck\n\/\*\*[\s\S]*?\*\/\n\n/, '').trim();

    // Combine: use existing header + both sets of exports
    return `${existingHeader}${existingExports}\n\n${newExports}\n`;
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

    const authorEntry = findEntry('src/author/index');
    if (authorEntry) {
      entryPoints['author/index'] = authorEntry;
    }

    const printEntry = findEntry('src/print/index');
    if (printEntry) {
      entryPoints['print/index'] = printEntry;
    }

    const typesEntry = findEntry('src/types/index');
    if (typesEntry) {
      entryPoints['types/index'] = typesEntry;
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
   * Ensure element demo structure exists with new dev/production split
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

    // Demo configs are maintained locally for the unified demo app (apps/element-demo).
    // We do NOT sync demo configs from upstream - each element should have its own
    // locally-maintained multi-demo config.mjs in docs/demo/.
    //
    // If a new element is synced and doesn't have a local demo config yet,
    // it should be created manually with multiple demo scenarios.
    //
    // The unified demo app showcases all elements with rich demo configurations,
    // so we maintain these locally rather than using upstream's single-demo configs.

    // Convert session.js (CommonJS) to session.mjs (ESM) if it exists upstream
    const sessionJs = join(upstreamDemoDir, 'session.js');
    const sessionMjs = join(upstreamDemoDir, 'session.mjs');

    let sessionContent: string | null = null;

    if (existsSync(sessionMjs)) {
      // If session.mjs exists, just copy it
      sessionContent = await readFile(sessionMjs, 'utf-8');
    } else if (existsSync(sessionJs)) {
      // Convert CommonJS session.js to ESM session.mjs
      const content = await readFile(sessionJs, 'utf-8');
      // Simple conversion: replace module.exports with export default
      sessionContent = content
        .replace(/module\.exports\s*=/, 'export default')
        .replace(/exports\.\w+\s*=/g, 'export const');
    }

    if (sessionContent) {
      await writeFile(join(targetDemoDir, 'session.mjs'), sessionContent, 'utf-8');
    }

    // Demo configs are maintained locally - we do NOT apply overrides from upstream

    // Remove unused generate.js if config.mjs exists (from demo dir only)
    const configPath = join(targetDemoDir, 'config.mjs');
    const generatePath = join(targetDemoDir, 'generate.js');
    if (existsSync(configPath) && existsSync(generatePath)) {
      await fsRm(generatePath, { force: true });
    }
  }

  private async ensureTsConfig(
    elementName: string,
    elementDir: string,
    logger: any
  ): Promise<boolean> {
    if (!existsSync(elementDir)) {
      return false;
    }

    const tsConfigPath = join(elementDir, 'tsconfig.json');
    const tsConfig = this.generateTsConfig();

    // Check if tsconfig needs to be written
    const currentContent = existsSync(tsConfigPath)
      ? await readFile(tsConfigPath, 'utf-8').catch(() => null)
      : null;

    if (currentContent === tsConfig) {
      return false;
    }

    await writeFile(tsConfigPath, tsConfig, 'utf-8');
    if (logger.isVerbose()) {
      logger.success(`  📝 ${elementName}: generated tsconfig.json`);
    }
    return true;
  }

  private generateTsConfig(): string {
    return `{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "declarationDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
`;
  }
}
