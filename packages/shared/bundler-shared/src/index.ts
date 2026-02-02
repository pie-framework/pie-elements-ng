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
import type { BuildRequest, BuildResult } from './types.js';
import { createWebpackConfig } from './webpack-config.js';
import { installPackages } from './installer.js';
import { generateEntries } from './entry-generator.js';
import { mkDependencyHash } from './dependency-hash.js';

export class Bundler {
  private outputDir: string;
  private cacheDir: string;
  private registry?: string;

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

  async build(request: BuildRequest): Promise<BuildResult> {
    const startTime = Date.now();
    const hash = mkDependencyHash(request.dependencies);

    console.log(`[bundler] Building bundle ${hash} with ${request.dependencies.length} dependencies`);

    try {
      // Check if bundle already exists
      const outputPath = join(this.outputDir, hash);
      if (existsSync(join(outputPath, 'player.js'))) {
        console.log(`[bundler] Bundle ${hash} already exists, returning cached result`);
        return {
          success: true,
          hash,
          bundles: {
            player: `/bundles/${hash}/player.js`,
            clientPlayer: `/bundles/${hash}/client-player.js`,
            editor: `/bundles/${hash}/editor.js`,
          },
          duration: Date.now() - startTime,
          cached: true,
        };
      }

      // 1. Install packages to temp directory
      const workspaceDir = join(this.cacheDir, hash);
      console.log(`[bundler] Installing packages to ${workspaceDir}`);
      await installPackages(request.dependencies, workspaceDir, this.registry);

      // 2. Generate entry files
      const entryDir = join(workspaceDir, 'entries');
      mkdirSync(entryDir, { recursive: true });

      console.log('[bundler] Generating entry files');
      const entries = generateEntries(request.dependencies, workspaceDir);

      // Write entry files
      writeFileSync(join(entryDir, 'player.js'), entries.player);
      writeFileSync(join(entryDir, 'client-player.js'), entries['client-player']);
      writeFileSync(join(entryDir, 'editor.js'), entries.editor);

      // 3. Create webpack config
      mkdirSync(outputPath, { recursive: true });

      const elements = request.dependencies.map(d => d.name.replace('@pie-element/', ''));

      const webpackConfig = createWebpackConfig({
        context: entryDir,
        entry: {
          player: './player.js',
          'client-player': './client-player.js',
          editor: './editor.js',
        },
        outputPath,
        workspaceDir,
        elements,
      });

      // 4. Run webpack
      console.log('[bundler] Running webpack build');
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

      return {
        success: true,
        hash,
        bundles: {
          player: `/bundles/${hash}/player.js`,
          clientPlayer: `/bundles/${hash}/client-player.js`,
          editor: `/bundles/${hash}/editor.js`,
        },
        warnings: warnings?.map(w => w.message || String(w)),
        duration: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('[bundler] Build failed:', error);
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
    return existsSync(join(outputPath, 'player.js'));
  }

  /**
   * Get bundle URLs for a hash
   */
  getBundleUrls(hash: string) {
    return {
      player: `/bundles/${hash}/player.js`,
      clientPlayer: `/bundles/${hash}/client-player.js`,
      editor: `/bundles/${hash}/editor.js`,
    };
  }
}

// Export utilities
export { mkDependencyHash } from './dependency-hash.js';
export { generateEntries } from './entry-generator.js';
export { createWebpackConfig } from './webpack-config.js';

// Export types
export type { BuildRequest, BuildResult, BuildDependency } from './types.js';
