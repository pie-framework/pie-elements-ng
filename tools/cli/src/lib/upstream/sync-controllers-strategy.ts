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
import type { SyncStrategy, SyncContext, SyncConfig, SyncResult } from './sync-strategy.js';
import { cleanDirectory, existsAny, readdir } from './sync-filesystem.js';
import { createExternalFunction } from './sync-externals.js';
import { createControllerTransformPipeline } from './sync-transforms.js';
import { ensureElementPackageJson } from './sync-package-manager.js';
import { isSubdirectoryCompatible } from './sync-compatibility.js';
import { EXCLUDED_UPSTREAM_ELEMENTS } from './sync-constants.js';

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

    const packages = await readdir(upstreamElementsDir);

    for (const pkg of packages) {
      if (EXCLUDED_UPSTREAM_ELEMENTS.includes(pkg as (typeof EXCLUDED_UPSTREAM_ELEMENTS)[number])) {
        continue;
      }

      if (context.packageFilter && pkg !== context.packageFilter) {
        continue;
      }

      // Check if controller exists upstream
      const controllerPath = join(upstreamElementsDir, pkg, 'controller/src/index.js');
      if (!existsSync(controllerPath)) {
        continue;
      }

      // Check if controller subdirectory is ESM-compatible
      const controllerCompatible = isSubdirectoryCompatible(pkg, 'controller', context);
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

      // Apply all standard transformations
      const transformPipeline = createControllerTransformPipeline();
      sourceContent = transformPipeline(sourceContent);

      // Convert JS to TS
      const { code: converted } = convertJsToTs(sourceContent, {
        sourcePath: `pie-elements/packages/${pkg}/controller/src/index.js`,
        commit: upstreamCommit,
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

          // Apply all standard transformations
          relatedContent = transformPipeline(relatedContent);

          const { code: relatedConverted } = convertJsToTs(relatedContent, {
            sourcePath: `pie-elements/packages/${pkg}/controller/src/${file}`,
            commit: upstreamCommit,
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
      wrotePkgJson = await ensureElementPackageJson(pkg, elementDir, config);
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

  private async cleanTargetDir(targetDir: string, label: string, logger: any): Promise<void> {
    await cleanDirectory(targetDir, label, { dryRun: false, verbose: false }, logger);
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
