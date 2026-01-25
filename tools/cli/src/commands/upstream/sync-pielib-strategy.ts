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
import { loadPackageJson, writePackageJson, type PackageJson } from '../../utils/package-json.js';
import type { SyncStrategy, SyncContext, SyncConfig, SyncResult } from './sync-strategy.js';
import { cleanDirectory, readdir } from './sync-filesystem.js';
import {
  fixImportsInFile,
  containsJsx,
  transformLodashToLodashEs,
  transformPieFrameworkEventImports,
  inlineEditableHtmlConstants,
  reexportTokenTypes,
} from './sync-imports.js';
import { generatePieLibViteConfig } from './sync-vite-config.js';

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
    const syncDate = new Date().toISOString().split('T')[0];

    // Get list of packages to sync
    const allPackages = await readdir(upstreamLibDir);
    let packagesToSync: string[];

    if (logger.isVerbose()) {
      logger.info(`   Compat report present: ${!!context.compatibilityReport}`);
      logger.info(
        `   Compat pieLibPackages: ${context.compatibilityReport?.pieLibPackages?.length || 0}`
      );
    }

    // Note: packageFilter is for elements, not pie-lib packages
    // Always use compatibility report list for pie-lib packages
    if (context.compatibilityReport?.pieLibPackages?.length) {
      // Use ESM compatibility report list
      packagesToSync = context.compatibilityReport.pieLibPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using ESM compatibility report list: ${packagesToSync.length} packages`);
        logger.info(`   Packages: ${packagesToSync.join(', ')}`);
      }
    } else {
      // Fallback: sync all packages
      packagesToSync = allPackages;
      if (logger.isVerbose()) {
        logger.info(`   Using all packages fallback: ${allPackages.length} packages`);
      }
    }

    for (const pkg of packagesToSync) {
      // Skip if package doesn't exist
      const pkgSrcDir = join(upstreamLibDir, pkg, 'src');
      if (!existsSync(pkgSrcDir)) {
        continue;
      }

      // Target: packages/lib-react/{package}/src/
      const targetDir = join(targetBaseDir, pkg);
      const targetSrcDir = join(targetDir, 'src');

      // Clean target src subtree first so removed upstream files don't linger
      await this.cleanTargetDir(targetSrcDir, `lib-react/${pkg}/src`, logger);

      // Special handling for math-rendering - generate wrapper instead of full sync
      let filesProcessed: number;
      let libChanged: boolean;

      if (pkg === 'math-rendering') {
        filesProcessed = await this.generateMathRenderingWrapper(
          targetSrcDir,
          upstreamCommit,
          syncDate,
          logger
        );
        libChanged = filesProcessed > 0;
      } else {
        // Recursively sync all files from src/ directory
        const beforeChanges = this.result.filesCopied + this.result.filesUpdated;
        filesProcessed = await this.syncDirectory(
          pkgSrcDir,
          targetSrcDir,
          'src',
          pkg,
          upstreamCommit,
          syncDate
        );
        const afterChanges = this.result.filesCopied + this.result.filesUpdated;
        libChanged = afterChanges > beforeChanges;
      }

      if (filesProcessed > 0 && logger.isVerbose()) {
        logger.success(`  ✨ ${pkg}: ${filesProcessed} file(s) synced`);
      }

      // Ensure package.json has ESM module support and expected exports
      let wrotePkgJson = false;
      wrotePkgJson = await this.ensurePieLibPackageJson(pkg, targetDir, config, logger);

      // Ensure vite.config.ts exists
      const wroteViteConfig = await this.ensureViteConfig(pkg, targetDir, logger);

      if (libChanged || wrotePkgJson || wroteViteConfig) {
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

  private async cleanTargetDir(targetDir: string, label: string, logger: any): Promise<void> {
    await cleanDirectory(targetDir, label, { dryRun: false, verbose: false }, logger);
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

      // Inline editable-html constants (editable-html is not ESM-compatible)
      sourceContent = inlineEditableHtmlConstants(sourceContent);

      // Fix missing TokenTypes re-export in text-select
      sourceContent = reexportTokenTypes(sourceContent, srcPath);

      const hasJsx = item.endsWith('.jsx') || (item.endsWith('.js') && containsJsx(sourceContent));

      // Convert .js → .ts/.tsx and .jsx → .tsx
      const targetFile = item.replace(/\.jsx?$/, hasJsx ? '.tsx' : '.ts');
      const targetPath = join(targetDir, targetFile);

      // Convert based on file extension
      const conversionResult = hasJsx
        ? convertJsxToTsx(sourceContent, {
            sourcePath: `pie-lib/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
            date: syncDate,
          })
        : convertJsToTs(sourceContent, {
            sourcePath: `pie-lib/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
            date: syncDate,
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
   * Generate a thin wrapper for math-rendering that re-exports from @pie-element/shared-math-rendering
   */
  private async generateMathRenderingWrapper(
    targetSrcDir: string,
    upstreamCommit: string,
    syncDate: string,
    logger: any
  ): Promise<number> {
    await mkdir(targetSrcDir, { recursive: true });

    const wrapperContent = `// @ts-nocheck
/**
 * @synced-from pie-lib/packages/math-rendering
 * @synced-commit ${upstreamCommit}
 * @synced-date ${syncDate}
 * @auto-generated
 *
 * This is a thin wrapper that re-exports from @pie-element/shared-math-rendering.
 * The actual implementation is in packages/shared/math-rendering.
 */

export { renderMath, wrapMath, unWrapMath, mmlToLatex } from '@pie-element/shared-math-rendering';
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

  private async ensurePieLibPackageJson(
    pkgName: string,
    pkgDir: string,
    config: SyncConfig,
    _logger: any
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

    const upstreamDeps = (upstreamPkg?.dependencies as Record<string, string> | undefined) ?? {};
    const expectedDeps: Record<string, string> = {};
    for (const [name, version] of Object.entries(upstreamDeps)) {
      if (name.startsWith('@pie-lib/')) {
        expectedDeps[name] = 'workspace:*';
      } else {
        expectedDeps[name] = version;
      }
    }

    if (!pkg) {
      pkg = {
        name: `@pie-lib/${pkgName}`,
        private: true,
        version: '0.1.0',
        description:
          (upstreamPkg?.description as string | undefined) ??
          `React implementation of @pie-lib/${pkgName} synced from pie-lib`,
        dependencies: expectedDeps,
      };
    }
    if (Object.keys(expectedDeps).length > 0) {
      pkg.dependencies = expectedDeps;
    }

    // Special handling for math-rendering: reference shared package
    if (pkgName === 'math-rendering') {
      pkg.dependencies = {
        '@pie-element/shared-math-rendering': 'workspace:*',
      };
    }

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

    pkg.name = `@pie-lib/${pkgName}`;
    pkg.type = 'module';
    pkg.main = './dist/index.js';
    pkg.types = './dist/index.d.ts';
    pkg.exports = exportsObj;

    const files = Array.isArray(pkg.files) ? (pkg.files as unknown[]) : [];
    const normalizedFiles = new Set<string>(
      files.filter((v): v is string => typeof v === 'string')
    );
    normalizedFiles.add('dist');
    normalizedFiles.add('src');
    pkg.files = Array.from(normalizedFiles).sort();

    if (typeof pkg.sideEffects === 'undefined') {
      pkg.sideEffects = false;
    }

    // Ensure build scripts exist
    if (!pkg.scripts || typeof pkg.scripts !== 'object') {
      pkg.scripts = {};
    }
    const scripts = pkg.scripts as Record<string, string>;
    scripts.build = 'bun x vite build && bun x tsc --emitDeclarationOnly';
    scripts.dev = 'bun x vite';
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
}
