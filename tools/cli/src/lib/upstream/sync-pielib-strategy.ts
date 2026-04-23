/**
 * Pie-lib sync strategy - syncs @pie-lib packages from upstream pie-lib
 *
 * Synced from: pie-lib/packages/{package}/src/
 * Target: packages/lib-react/{package}/src/
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, stat as fsStat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { convertJsToTs, convertJsxToTsx } from '../../utils/conversion.js';
import { getCurrentCommit } from '../../utils/git.js';
import type { SyncStrategy, SyncContext, SyncConfig, SyncResult } from './sync-strategy.js';
import { cleanDirectory, readdir } from './sync-filesystem.js';
import { fixImportsInFile, containsJsx } from './sync-imports.js';
import { generatePieLibViteConfig } from './sync-vite-config.js';
import { createPieLibTransformPipeline } from './sync-transforms.js';
import { ensurePieLibPackageJson } from './sync-package-manager.js';
import { EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES } from './sync-constants.js';
import {
  getPieLibSourcePreserveList,
  getPieLibSyncMode,
  PIE_LIB_COMPATIBILITY_APPEND_PATCHES,
} from './sync-presets.js';

interface InternalSyncResult {
  filesChecked: number;
  filesCopied: number;
  filesSkipped: number;
  filesUpdated: number;
}

export class PieLibStrategy implements SyncStrategy {
  private touchedPieLibPackages = new Set<string>();
  private result: InternalSyncResult = {
    filesChecked: 0,
    filesCopied: 0,
    filesSkipped: 0,
    filesUpdated: 0,
  };

  getName(): string {
    return 'pie-lib';
  }

  getDescription(): string {
    return '@pie-lib packages';
  }

  shouldRun(config: SyncConfig): boolean {
    return config.syncPieLib;
  }

  async execute(context: SyncContext): Promise<SyncResult> {
    const { config, logger } = context;
    this.touchedPieLibPackages.clear();
    this.result = {
      filesChecked: 0,
      filesCopied: 0,
      filesSkipped: 0,
      filesUpdated: 0,
    };

    if (!logger.isVerbose()) {
      logger.progressStart('Syncing @pie-lib packages...');
    } else {
      logger.section('📚 Syncing @pie-lib packages');
    }

    const upstreamLibDir = join(config.pieLib, 'packages');
    const targetBaseDir = join(config.pieElementsNg, 'packages/lib-react');

    // Verify pie-lib exists
    if (!existsSync(upstreamLibDir)) {
      logger.error(`pie-lib packages not found at ${upstreamLibDir}`);
      return { count: 0, packageNames: [] };
    }

    const upstreamCommit = getCurrentCommit(config.pieLib);

    // Get list of packages to sync
    const allPackages = await readdir(upstreamLibDir);
    let packagesToSync: string[];

    if (logger.isVerbose()) {
      logger.info(`   Compat report present: ${!!context.compatibilityReport}`);
      logger.info(
        `   Compat pieLibPackages: ${context.compatibilityReport?.pieLibPackages?.length || 0}`
      );
    }

    // Use the filtered list from config if available (computed from element dependencies)
    // This ensures we only sync the pie-lib packages actually needed by the elements being synced
    if (config.pieLibPackages && config.pieLibPackages.length > 0) {
      packagesToSync = config.pieLibPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using filtered pie-lib list: ${packagesToSync.length} packages`);
        logger.info(`   Packages: ${packagesToSync.join(', ')}`);
      }
    } else if (context.compatibilityReport?.pieLibPackages?.length) {
      // Fallback to compatibility report list (used when no filtering is needed)
      packagesToSync = context.compatibilityReport.pieLibPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using ESM compatibility report list: ${packagesToSync.length} packages`);
        logger.info(`   Packages: ${packagesToSync.join(', ')}`);
      }
    } else {
      // Final fallback: sync all packages
      packagesToSync = allPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using all packages fallback: ${allPackages.length} packages`);
      }
    }

    for (const pkg of packagesToSync) {
      if (
        EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES.includes(
          pkg as (typeof EXCLUDED_UPSTREAM_PIE_LIB_PACKAGES)[number]
        )
      ) {
        if (logger.isVerbose()) {
          logger.info(`  ⏭️  ${pkg}: skipping (locally owned package)`);
        }
        continue;
      }

      // Skip if package doesn't exist
      const pkgSrcDir = join(upstreamLibDir, pkg, 'src');
      if (!existsSync(pkgSrcDir)) {
        continue;
      }

      // Target: packages/lib-react/{package}/src/
      const targetDir = join(targetBaseDir, pkg);
      const targetSrcDir = join(targetDir, 'src');

      // Clean target src subtree first so removed upstream files don't linger
      await this.cleanTargetDir(targetSrcDir, pkg, `lib-react/${pkg}/src`, logger, config.dryRun);

      // Package sync mode is preset-driven (full sync vs wrapper generation).
      let filesProcessed: number;
      let libChanged: boolean;

      if (getPieLibSyncMode(pkg) === 'wrapper') {
        filesProcessed = await this.generateMathRenderingWrapper(targetSrcDir, logger);
        libChanged = filesProcessed > 0;
      } else {
        // Recursively sync all files from src/ directory
        const beforeChanges = this.result.filesCopied + this.result.filesUpdated;
        filesProcessed = await this.syncDirectory(
          pkgSrcDir,
          targetSrcDir,
          'src',
          pkg,
          upstreamCommit
        );
        const afterChanges = this.result.filesCopied + this.result.filesUpdated;
        libChanged = afterChanges > beforeChanges;
      }

      if (filesProcessed > 0 && logger.isVerbose()) {
        logger.success(`  ✨ ${pkg}: ${filesProcessed} file(s) synced`);
      }

      // Keep local compatibility exports that upstream plot package currently misses.
      const wroteCompatibilityPatch = await this.ensurePlotTypesCompatibilityPatch(
        pkg,
        targetSrcDir
      );

      // Ensure package.json has ESM module support and expected exports
      let wrotePkgJson = false;
      wrotePkgJson = await ensurePieLibPackageJson(pkg, targetDir, config);

      // Ensure vite.config.ts exists
      const wroteViteConfig = await this.ensureViteConfig(pkg, targetDir, logger);

      // Ensure tsconfig.json exists
      const wroteTsConfig = await this.ensureTsConfig(pkg, targetDir, logger);

      if (
        libChanged ||
        wroteCompatibilityPatch ||
        wrotePkgJson ||
        wroteViteConfig ||
        wroteTsConfig
      ) {
        this.touchedPieLibPackages.add(pkg);
      }
    }

    if (!logger.isVerbose()) {
      logger.progressCompleteWithCount(this.touchedPieLibPackages.size, 'packages');
    } else {
      logger.info(`\nSynced ${this.touchedPieLibPackages.size} @pie-lib package(s)`);
    }
    return {
      count: this.touchedPieLibPackages.size,
      packageNames: Array.from(this.touchedPieLibPackages)
        .sort()
        .map((pkg) => `@pie-lib/${pkg}`),
    };
  }

  private async cleanTargetDir(
    targetDir: string,
    pkgName: string,
    label: string,
    logger: any,
    dryRun: boolean
  ): Promise<void> {
    const preserve = getPieLibSourcePreserveList(pkgName);

    await cleanDirectory(targetDir, label, { dryRun, verbose: false, preserve }, logger);
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

      this.result.filesChecked++;
      filesProcessed++;

      // Read source
      let sourceContent = await readFile(srcPath, 'utf-8');

      // Apply all standard transformations
      const transformPipeline = createPieLibTransformPipeline();
      sourceContent = transformPipeline(sourceContent, srcPath);

      const hasJsx = item.endsWith('.jsx') || (item.endsWith('.js') && containsJsx(sourceContent));

      // Convert .js → .ts/.tsx and .jsx → .tsx
      const targetFile = item.replace(/\.jsx?$/, hasJsx ? '.tsx' : '.ts');
      const targetPath = join(targetDir, targetFile);

      // Convert based on file extension
      const conversionResult = hasJsx
        ? convertJsxToTsx(sourceContent, {
            sourcePath: `pie-lib/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
          })
        : convertJsToTs(sourceContent, {
            sourcePath: `pie-lib/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
          });

      let converted = conversionResult.code;

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
   * Generate a thin wrapper for math-rendering that re-exports from @pie-element/math-rendering
   */
  private async generateMathRenderingWrapper(targetSrcDir: string, logger: any): Promise<number> {
    await mkdir(targetSrcDir, { recursive: true });

    const wrapperContent = `// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-rendering
 * @auto-generated
 *
 * This is a thin wrapper that re-exports from @pie-element/shared-math-rendering-mathjax.
 * The actual implementation is in packages/shared/math-rendering-mathjax.
 */

export { renderMath, wrapMath, unWrapMath, mmlToLatex } from '@pie-element/shared-math-rendering-mathjax';
`;

    const indexPath = join(targetSrcDir, 'index.ts');
    const needsWrite =
      !existsSync(indexPath) || (await readFile(indexPath, 'utf-8')) !== wrapperContent;

    if (needsWrite) {
      await writeFile(indexPath, wrapperContent, 'utf-8');
      if (logger.isVerbose()) {
        logger.success(`  ✨ math-rendering: generated wrapper`);
      }
      return 1;
    }

    return 0;
  }

  private async ensureViteConfig(pkgName: string, pkgDir: string, logger: any): Promise<boolean> {
    if (!existsSync(pkgDir)) {
      return false;
    }

    const viteConfigPath = join(pkgDir, 'vite.config.ts');
    const viteConfig = generatePieLibViteConfig(pkgName, pkgDir);

    // Check if vite config needs to be written
    const currentContent = existsSync(viteConfigPath)
      ? await readFile(viteConfigPath, 'utf-8').catch(() => null)
      : null;

    if (currentContent === viteConfig) {
      return false;
    }

    await writeFile(viteConfigPath, viteConfig, 'utf-8');
    if (logger.isVerbose()) {
      logger.success(`  📝 ${pkgName}: generated vite.config.ts`);
    }
    return true;
  }

  private async ensurePlotTypesCompatibilityPatch(
    pkgName: string,
    targetSrcDir: string
  ): Promise<boolean> {
    const patchPreset = PIE_LIB_COMPATIBILITY_APPEND_PATCHES[pkgName];
    if (!patchPreset) {
      return false;
    }

    const typesPath = join(targetSrcDir, 'types.ts');
    if (!existsSync(typesPath)) {
      return false;
    }

    const current = await readFile(typesPath, 'utf-8');
    if (current.includes(patchPreset.requiredMarker)) {
      return false;
    }

    await writeFile(typesPath, `${current}${patchPreset.append}`, 'utf-8');
    return true;
  }

  private async ensureTsConfig(pkgName: string, pkgDir: string, logger: any): Promise<boolean> {
    if (!existsSync(pkgDir)) {
      return false;
    }

    const tsConfigPath = join(pkgDir, 'tsconfig.json');
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
      logger.success(`  📝 ${pkgName}: generated tsconfig.json`);
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
