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
import { demoOverrides } from './demo-overrides.js';
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

  /**
   * Convert kebab-case element name to PascalCase class name
   * e.g., "multiple-choice" → "MultipleChoice"
   */
  private toPascalCase(elementName: string): string {
    return elementName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Get element tag name (kebab-case with -element suffix)
   * e.g., "multiple-choice" → "multiple-choice-element"
   */
  private toElementTag(elementName: string): string {
    return `${elementName}-element`;
  }

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
        upstreamCommit,
        syncDate
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
              upstreamCommit,
              syncDate
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
            upstreamCommit,
            syncDate
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
          upstreamCommit,
          syncDate
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
      await this.applyDemoOverrides(pkg, elementDir);

      if (elementChanged || wrotePkgJson || wroteTsConfig) {
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

      // Skip print.js/print.jsx files - they're synced to src/print/ separately
      if (item === 'print.js' || item === 'print.jsx') {
        continue;
      }

      this.result.filesChecked++;
      filesProcessed++;

      // Read source
      let sourceContent = await readFile(srcPath, 'utf-8');

      // Apply all standard transformations
      const transformPipeline = createReactComponentTransformPipeline();
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

  /**
   * Sync root-level .js files from configure/ directory (not including subdirectories)
   * These are typically utility files like utils.js that are imported by files in configure/src/
   */
  private async syncConfigureRootFiles(
    sourceDir: string,
    targetDir: string,
    pkg: string,
    upstreamCommit: string,
    syncDate: string
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
      const transformPipeline = createReactComponentTransformPipeline();
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
            date: syncDate,
          })
        : convertJsToTs(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/configure/${item}`,
            commit: upstreamCommit,
            date: syncDate,
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
    upstreamCommit: string,
    syncDate: string
  ): Promise<number> {
    this.result.filesChecked++;

    // Read source
    let sourceContent = await readFile(sourceFile, 'utf-8');

    // Apply all standard transformations
    const transformPipeline = createReactComponentTransformPipeline();
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
          date: syncDate,
        })
      : convertJsToTs(sourceContent, {
          sourcePath: `pie-elements/packages/${pkg}/src/print.js`,
          commit: upstreamCommit,
          date: syncDate,
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
    const targetProductionTestDir = join(elementDir, 'docs/production-test');
    await mkdir(targetDemoDir, { recursive: true });
    await mkdir(targetProductionTestDir, { recursive: true });

    const templateDir = join(config.pieElementsNg, 'packages/shared/element-player/templates');

    // Prepare substitution values
    const elementTitle = elementName
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const elementClass = this.toPascalCase(elementName) + 'Element';
    const elementTag = this.toElementTag(elementName);
    const port = 5174; // Standard dev port

    // 1. Create dev demo files
    // dev.html
    let devHtml = await readFile(join(templateDir, 'dev.html'), 'utf-8');
    devHtml = devHtml
      .replace(/\{\{ELEMENT_NAME\}\}/g, elementName)
      .replace(/\{\{ELEMENT_TITLE\}\}/g, elementTitle);
    await writeFile(join(targetDemoDir, 'dev.html'), devHtml, 'utf-8');

    // index.html (redirects to dev.html)
    let indexHtml = await readFile(join(templateDir, 'demo-index.html'), 'utf-8');
    indexHtml = indexHtml.replace(/\{\{ELEMENT_NAME\}\}/g, elementName);
    await writeFile(join(targetDemoDir, 'index.html'), indexHtml, 'utf-8');

    // vite.config.ts
    let viteConfig = await readFile(join(templateDir, 'demo-vite.config.ts.template'), 'utf-8');
    viteConfig = viteConfig
      .replace(/\{\{ELEMENT_NAME\}\}/g, elementName)
      .replace(/\{\{ELEMENT_TITLE\}\}/g, elementTitle)
      .replace(/\{\{PORT\}\}/g, port.toString());
    await writeFile(join(targetDemoDir, 'vite.config.ts'), viteConfig, 'utf-8');

    // src/dev.ts
    let devTs = await readFile(join(templateDir, 'dev.ts.template'), 'utf-8');
    devTs = devTs
      .replace(/\{\{ELEMENT_NAME\}\}/g, elementName)
      .replace(/\{\{ELEMENT_CLASS\}\}/g, elementClass)
      .replace(/\{\{ELEMENT_TAG\}\}/g, elementTag);
    const srcDir = join(targetDemoDir, 'src');
    await mkdir(srcDir, { recursive: true });
    await writeFile(join(srcDir, 'dev.ts'), devTs, 'utf-8');

    // 2. Create production-test files
    // Copy esm-demo.html to production-test/index.html
    if (existsSync(join(templateDir, 'esm-demo.html'))) {
      let esmHtml = await readFile(join(templateDir, 'esm-demo.html'), 'utf-8');
      esmHtml = esmHtml
        .replace(/\{\{ELEMENT_NAME\}\}/g, elementName)
        .replace(/\{\{ELEMENT_TITLE\}\}/g, elementTitle);
      await writeFile(join(targetProductionTestDir, 'index.html'), esmHtml, 'utf-8');
    }

    // Copy or generate config.mjs to both demo and production-test directories
    const configMjs = join(upstreamDemoDir, 'config.mjs');
    const configJs = join(upstreamDemoDir, 'config.js');
    const generateJs = join(upstreamDemoDir, 'generate.js');

    let configContent: string | null = null;

    if (existsSync(configMjs)) {
      // Copy config.mjs if it exists
      configContent = await readFile(configMjs, 'utf-8');
    } else if (existsSync(configJs) && existsSync(generateJs)) {
      // Generate config.mjs from config.js + generate.js
      configContent = await this.generateConfigContent(upstreamDemoDir, elementName);
    }

    if (configContent) {
      // Write to both directories
      await writeFile(join(targetDemoDir, 'config.mjs'), configContent, 'utf-8');
      await writeFile(join(targetProductionTestDir, 'config.mjs'), configContent, 'utf-8');
    }

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
      // Write to both directories
      await writeFile(join(targetDemoDir, 'session.mjs'), sessionContent, 'utf-8');
      await writeFile(join(targetProductionTestDir, 'session.mjs'), sessionContent, 'utf-8');
    }

    // Apply demo overrides if configured
    await this.applyDemoOverrides(elementName, elementDir);

    // Remove unused generate.js if config.mjs exists (from demo dir only)
    const configPath = join(targetDemoDir, 'config.mjs');
    const generatePath = join(targetDemoDir, 'generate.js');
    if (existsSync(configPath) && existsSync(generatePath)) {
      await fsRm(generatePath, { force: true });
    }
  }

  /**
   * Generate config.mjs content from upstream config.js + generate.js
   *
   * This method handles the conversion from upstream's CommonJS config system
   * to our ESM-based config.mjs format. It also normalizes element names to
   * match our package naming convention (e.g., "hotspot-element" -> "hotspot").
   *
   * @returns The generated config.mjs content, or null if generation fails
   */
  private async generateConfigContent(
    upstreamDemoDir: string,
    elementName: string
  ): Promise<string | null> {
    try {
      // Execute config.js in upstream context to get the model
      // We need to use child_process to run Node.js with the correct require resolution
      const { execSync } = await import('node:child_process');

      // Create a temporary script file to avoid escaping issues
      const tempScriptPath = join(upstreamDemoDir, '.generate-config-temp.js');
      const script = `const { model } = require('./generate.js');
const config = require('./config.js');

// Determine what element name to pass to the model function
// Check if config.models exists and get the element name from it
let upstreamElementName = '${elementName}-element';
if (config.models && config.models[0]) {
  if (typeof config.models[0] === 'function') {
    // If it's a function, call it to get the element name
    const testModel = config.models[0]('1', 'test-element');
    upstreamElementName = testModel.element || upstreamElementName;
  } else {
    // If it's an object, get the element name directly
    upstreamElementName = config.models[0].element || upstreamElementName;
  }
}

// Generate the model using the upstream's expected element name
const generatedModel = model('1', upstreamElementName);

// Normalize element name to match our package naming convention
// Remove common suffixes like -element, -el, etc. and use just the base package name
generatedModel.element = '${elementName}';

console.log(JSON.stringify({ models: [generatedModel] }, null, 2));`;

      await writeFile(tempScriptPath, script, 'utf-8');

      const result = execSync('node .generate-config-temp.js', {
        cwd: upstreamDemoDir,
        encoding: 'utf-8',
      });

      // Clean up temp file
      await fsRm(tempScriptPath, { force: true });

      return `export default ${result};\n`;
    } catch (error) {
      // If generation fails, log warning but don't fail the sync
      console.warn(
        `Warning: Could not generate config.mjs for ${elementName} from config.js + generate.js:`,
        error
      );
      return null;
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
