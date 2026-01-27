/**
 * Controller sync strategy - syncs controller logic from upstream pie-elements
 *
 * Synced from: pie-elements/packages/{element}/controller/src/
 * Target: packages/elements-react/{element}/src/controller/
 */

import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { convertJsToTs } from '../../utils/conversion.js';
import { getCurrentCommit } from '../../utils/git.js';
import { loadPackageJson, writePackageJson, type PackageJson } from '../../utils/package-json.js';
import type { SyncStrategy, SyncContext, SyncConfig, SyncResult } from './sync-strategy.js';
import { cleanDirectory, existsAny, readdir } from './sync-filesystem.js';
import { createExternalFunction } from './sync-externals.js';
import {
  transformLodashToLodashEs,
  transformPackageJsonLodash,
  transformPieFrameworkEventImports,
  transformPackageJsonPieEvents,
  transformControllerUtilsImports,
  transformPackageJsonControllerUtils,
  transformSharedPackageImports,
  transformPackageJsonSharedPackages,
} from './sync-imports.js';

interface InternalSyncResult {
  filesChecked: number;
  filesCopied: number;
  filesSkipped: number;
  filesUpdated: number;
}

export class ControllersStrategy implements SyncStrategy {
  private touchedElementPackages = new Set<string>();
  private result: InternalSyncResult = {
    filesChecked: 0,
    filesCopied: 0,
    filesSkipped: 0,
    filesUpdated: 0,
  };

  getName(): string {
    return 'controllers';
  }

  getDescription(): string {
    return 'controllers';
  }

  shouldRun(config: SyncConfig): boolean {
    return config.syncControllers;
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
      logger.progressStart('Syncing controllers...');
    } else {
      logger.section('📦 Syncing controllers');
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

      // Check if controller exists upstream
      const controllerPath = join(upstreamElementsDir, pkg, 'controller/src/index.js');
      if (!existsSync(controllerPath)) {
        continue;
      }

      // Check if controller subdirectory is ESM-compatible
      const controllerCompatible = this.isSubdirectoryCompatible(pkg, 'controller', context);
      if (!controllerCompatible) {
        if (logger.isVerbose()) {
          logger.info(`  ⏭️  ${pkg}: skipping controller/ (not ESM-compatible)`);
        }
        continue;
      }

      this.result.filesChecked++;

      // Target: packages/elements-react/{element}/src/controller/index.ts
      const targetDir = join(targetBaseDir, pkg, 'src/controller');
      const targetPath = join(targetDir, 'index.ts');

      // Clean target controller subtree first so removed upstream files don't linger
      await this.cleanTargetDir(targetDir, `elements-react/${pkg}/src/controller`, logger);

      // Read source
      let sourceContent = await readFile(controllerPath, 'utf-8');

      // Transform lodash to lodash-es for ESM compatibility
      sourceContent = transformLodashToLodashEs(sourceContent);

      // Transform @pie-framework event packages to internal packages
      sourceContent = transformPieFrameworkEventImports(sourceContent);

      // Transform @pie-lib/controller-utils to @pie-framework/controller-utils
      sourceContent = transformControllerUtilsImports(sourceContent);

      // Transform @pie-lib shared packages to @pie-element/shared-*
      sourceContent = transformSharedPackageImports(sourceContent);

      // Convert JS to TS
      const { code: converted } = convertJsToTs(sourceContent, {
        sourcePath: `pie-elements/packages/${pkg}/controller/src/index.js`,
        commit: upstreamCommit,
        date: syncDate,
      });

      let elementChanged = false;

      // Sync index.ts
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
        } else {
          this.result.filesUpdated++;
          elementChanged = true;
          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, converted, 'utf-8');
        }
      } else {
        this.result.filesCopied++;
        elementChanged = true;
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, converted, 'utf-8');
      }

      // Also sync related files (defaults.js, utils.js, scoring.js, tickUtils.js)
      const relatedFiles = ['defaults.js', 'utils.js', 'scoring.js', 'tickUtils.js'];
      for (const file of relatedFiles) {
        const relatedPath = join(upstreamElementsDir, pkg, 'controller/src', file);
        if (existsSync(relatedPath)) {
          const relatedTarget = join(targetDir, file.replace('.js', '.ts'));
          let relatedContent = await readFile(relatedPath, 'utf-8');

          // Transform lodash to lodash-es for ESM compatibility
          relatedContent = transformLodashToLodashEs(relatedContent);

          // Transform @pie-framework event packages to internal packages
          relatedContent = transformPieFrameworkEventImports(relatedContent);

          // Transform @pie-lib/controller-utils to @pie-framework/controller-utils
          relatedContent = transformControllerUtilsImports(relatedContent);

          const { code: relatedConverted } = convertJsToTs(relatedContent, {
            sourcePath: `pie-elements/packages/${pkg}/controller/src/${file}`,
            commit: upstreamCommit,
            date: syncDate,
          });

          const relatedIsNew = !existsSync(relatedTarget);
          if (!relatedIsNew) {
            const currentRelated = await readFile(relatedTarget, 'utf-8');
            if (currentRelated === relatedConverted) {
              this.result.filesSkipped++;
              continue;
            }
            this.result.filesUpdated++;
            elementChanged = true;
          } else {
            this.result.filesCopied++;
            elementChanged = true;
          }

          await mkdir(dirname(relatedTarget), { recursive: true });
          await writeFile(relatedTarget, relatedConverted, 'utf-8');
        }
      }

      // Ensure package.json has ESM module support (even in controller-only sync)
      let wrotePkgJson = false;
      const elementDir = join(targetBaseDir, pkg);
      wrotePkgJson = await this.ensureElementPackageJson(pkg, elementDir, config, logger);
      await this.ensureElementViteConfig(pkg, elementDir, logger);

      if (elementChanged || wrotePkgJson) {
        if (logger.isVerbose()) {
          logger.success(`  🔄 ${pkg}: controller package updated`);
        }
        this.touchedElementPackages.add(pkg);
      }
    }

    if (!logger.isVerbose()) {
      logger.progressCompleteWithCount(this.touchedElementPackages.size, 'packages');
    } else {
      logger.info(`\nSynced ${this.touchedElementPackages.size} controller package(s)`);
    }
    return {
      count: this.touchedElementPackages.size,
      packageNames: Array.from(this.touchedElementPackages).sort(),
    };
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

  private async cleanTargetDir(targetDir: string, label: string, logger: any): Promise<void> {
    await cleanDirectory(targetDir, label, { dryRun: false, verbose: false }, logger);
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

    // Transform @pie-lib/controller-utils to @pie-framework/controller-utils
    pkg = transformPackageJsonControllerUtils(pkg);

    // Transform @pie-lib shared packages to @pie-element/shared-*
    pkg = transformPackageJsonSharedPackages(pkg);

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
    scripts.build = 'bun x vite build && bun x tsc --emitDeclarationOnly';
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
    const indexEntry = existsAny([
      join(elementDir, 'src/index.ts'),
      join(elementDir, 'src/index.tsx'),
    ]);
    if (indexEntry) {
      entryPoints.index = 'src/index.ts';
    }

    const hasController = existsAny([
      join(elementDir, 'src/controller/index.ts'),
      join(elementDir, 'src/controller/index.tsx'),
    ]);
    if (hasController) {
      entryPoints['controller/index'] = 'src/controller/index.ts';
    }

    const hasConfigure = existsAny([
      join(elementDir, 'src/configure/index.ts'),
      join(elementDir, 'src/configure/index.tsx'),
    ]);
    if (hasConfigure) {
      entryPoints['configure/index'] = 'src/configure/index.ts';
    }

    const hasDelivery = existsAny([
      join(elementDir, 'src/delivery/index.ts'),
      join(elementDir, 'src/delivery/index.tsx'),
    ]);
    if (hasDelivery) {
      entryPoints['delivery/index'] = 'src/delivery/index.ts';
    }

    if (Object.keys(entryPoints).length === 0) {
      return; // No entry points, skip vite config
    }

    // Format entry points for vite config
    const entryLines = Object.entries(entryPoints)
      .map(([key, value]) => `        '${key}': resolve(__dirname, '${value}'),`)
      .join('\n');

    const viteConfig = `import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: {
${entryLines}
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ${createExternalFunction('pielib')},
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
  },
});
`;

    await writeFile(viteConfigPath, viteConfig, 'utf-8');
  }
}
