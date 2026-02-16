/**
 * PIE Element Bundler - Creates IIFE bundles for pie-player-components
 *
 * Simplified from pie-api-aws bundler, with no Lambda/Temporal complexity.
 * Just downloads packages, generates entries, runs webpack, and outputs bundles.
 */

import { tmpdir } from 'os';
import { join } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import webpack from 'webpack';
import type {
  BuildBundleName,
  BuildProgressListener,
  BuildRequest,
  BuildResult,
} from './types.js';
import { createWebpackConfig } from './webpack-config.js';
import { installPackages } from './installer.js';
import { generateEntries } from './entry-generator.js';
import { mkDependencyHash } from './dependency-hash.js';
import { BuildManager } from './build-manager.js';

export class Bundler {
  private outputDir: string;
  private cacheDir: string;
  private registry?: string;
  private buildManager = new BuildManager<BuildResult>();

  constructor(
    outputDir: string = './bundles',
    cacheDir: string = join(tmpdir(), 'pie-bundler'),
    registry?: string
  ) {
    this.outputDir = outputDir;
    this.cacheDir = cacheDir;
    this.registry = registry;
    mkdirSync(outputDir, { recursive: true });
    mkdirSync(cacheDir, { recursive: true });
  }

  async build(request: BuildRequest, onProgress?: BuildProgressListener): Promise<BuildResult> {
    const startTime = Date.now();
    const hash = mkDependencyHash(request.dependencies);
    const requestedBundles = normalizeRequestedBundles(request.options?.requestedBundles);
    const buildKey = `${hash}:${requestedBundles.join(',')}`;
    const buildId = request.options?.buildId || hash;
    const emit = (stage: Parameters<BuildProgressListener>[0]['stage'], message?: string) => {
      onProgress?.({
        buildId,
        hash,
        stage,
        timestamp: Date.now(),
        message,
      });
    };

    emit('queued');
    console.log(`[bundler] Building bundle ${hash} with ${request.dependencies.length} dependencies`);

    return this.buildManager.run(buildKey, async () =>
      this.runBuild(request, hash, requestedBundles, startTime, emit)
    );
  }

  private async runBuild(
    request: BuildRequest,
    hash: string,
    requestedBundles: BuildBundleName[],
    startTime: number,
    emit: (stage: Parameters<BuildProgressListener>[0]['stage'], message?: string) => void
  ): Promise<BuildResult> {
    try {
      // Check if bundle already exists
      const outputPath = join(this.outputDir, hash);
      const hasAllRequestedBundles = requestedBundles.every((bundle) =>
        existsSync(join(outputPath, `${bundle}.js`))
      );
      if (hasAllRequestedBundles) {
        console.log(
          `[bundler][cache-hit] ${hash} bundles=${requestedBundles.join(',')} outputPath=${outputPath}`
        );
        emit('completed', 'cache_hit');
        return {
          success: true,
          hash,
          bundles: this.getBundleUrls(hash, requestedBundles),
          duration: Date.now() - startTime,
          cached: true,
        };
      }
      console.log(
        `[bundler][cache-miss] ${hash} bundles=${requestedBundles.join(',')} outputPath=${outputPath}`
      );

      // 1. Install packages to temp directory
      const workspaceDir = join(this.cacheDir, hash);
      console.log(`[bundler] Installing packages to ${workspaceDir}`);
      emit('installing');
      await installPackages(request.dependencies, workspaceDir, this.registry, {
        resolutionMode: request.options?.resolutionMode || 'prod-faithful',
        workspaceRoot:
          request.options?.resolutionMode === 'workspace-fast'
            ? request.options.workspaceRoot
            : undefined,
      });

      // 2. Generate entry files
      const entryDir = join(workspaceDir, 'entries');
      mkdirSync(entryDir, { recursive: true });

      console.log('[bundler] Generating entry files');
      emit('generating_entries');
      const entries = generateEntries(request.dependencies, workspaceDir, requestedBundles);

      // Write entry files
      for (const bundle of requestedBundles) {
        const content = entries[bundle];
        if (content) {
          writeFileSync(join(entryDir, `${bundle}.js`), content);
        }
      }

      // 3. Create webpack config
      mkdirSync(outputPath, { recursive: true });

      const elements = request.dependencies.map(d => d.name.replace('@pie-element/', ''));
      const entry = Object.fromEntries(
        requestedBundles.map((bundle) => [bundle, `./${bundle}.js`])
      ) as Record<string, string>;

      const webpackConfig = createWebpackConfig({
        context: entryDir,
        entry,
        outputPath,
        workspaceDir,
        elements,
      });

      // 4. Run webpack
      console.log('[bundler] Running webpack build');
      emit('bundling');
      const stats = await this.runWebpack(webpackConfig);

      if (stats.hasErrors()) {
        const errors = stats.toJson().errors || [];
        console.error('[bundler] Webpack build failed:', errors);
        return {
          success: false,
          hash,
          errors: errors.map(e => e.message || String(e)),
          duration: Date.now() - startTime,
        };
      }

      // 5. Return success
      const warnings = stats.hasWarnings() ? stats.toJson().warnings : undefined;

      console.log(`[bundler] Build complete in ${Date.now() - startTime}ms`);
      emit('completed');

      return {
        success: true,
        hash,
        bundles: this.getBundleUrls(hash, requestedBundles),
        warnings: warnings?.map(w => w.message || String(w)),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('[bundler] Build failed:', error);
      emit('failed', error.message || String(error));
      return {
        success: false,
        hash,
        errors: [error.message || String(error)],
        duration: Date.now() - startTime,
      };
    }
  }

  private runWebpack(config: webpack.Configuration): Promise<webpack.Stats> {
    return new Promise((resolve, reject) => {
      webpack(config).run((err, stats) => {
        if (err) {
          console.error('[bundler] Webpack error:', err);
          return reject(err);
        }
        if (!stats) {
          return reject(new Error('No stats returned from webpack'));
        }
        resolve(stats);
      });
    });
  }

  /**
   * Check if a bundle exists for the given hash
   */
  exists(hash: string): boolean {
    const outputPath = join(this.outputDir, hash);
    return (
      existsSync(join(outputPath, 'player.js')) ||
      existsSync(join(outputPath, 'client-player.js')) ||
      existsSync(join(outputPath, 'editor.js'))
    );
  }

  /**
   * Get bundle URLs for a hash
   */
  getBundleUrls(hash: string, requestedBundles: BuildBundleName[] = ['player', 'client-player', 'editor']) {
    const urls: Partial<Record<'player' | 'clientPlayer' | 'editor', string>> = {};
    if (requestedBundles.includes('player')) {
      urls.player = `/bundles/${hash}/player.js`;
    }
    if (requestedBundles.includes('client-player')) {
      urls.clientPlayer = `/bundles/${hash}/client-player.js`;
    }
    if (requestedBundles.includes('editor')) {
      urls.editor = `/bundles/${hash}/editor.js`;
    }
    return urls;
  }
}

function normalizeRequestedBundles(requested?: BuildBundleName[]): BuildBundleName[] {
  const defaultBundles: BuildBundleName[] = ['player', 'client-player', 'editor'];
  if (!requested || requested.length === 0) {
    return defaultBundles;
  }
  const valid = requested.filter((bundle): bundle is BuildBundleName =>
    ['player', 'client-player', 'editor'].includes(bundle)
  );
  return valid.length > 0 ? Array.from(new Set(valid)) : defaultBundles;
}

// Export utilities
export { mkDependencyHash } from './dependency-hash.js';
export { generateEntries } from './entry-generator.js';
export { createWebpackConfig } from './webpack-config.js';

// Export types
export type {
  BuildRequest,
  BuildResult,
  BuildDependency,
  BuildStage,
  BuildProgressEvent,
  BuildProgressListener,
  BuildOptions,
  BuildResolutionMode,
  BuildBundleName,
} from './types.js';
