import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import {
  mkDependencyHash,
  generateEntries,
  createWebpackConfig,
  type BuildDependency,
} from '@pie-element/bundler-shared';
import webpack from 'webpack';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, symlinkSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export default class TestBundler extends Command {
  static override description = 'Test the PIE bundler service with local workspace packages';

  static override examples = [
    'bun run cli <%= command.id %>',
    'bun cli <%= command.id %>',
    '<%= config.bin %> <%= command.id %>',
    'bun cli <%= command.id %> --element multiple-choice',
    'bun cli <%= command.id %> --clean',
  ];

  static override flags = {
    element: Flags.string({
      char: 'e',
      description: 'Test with specific element (default: multiple-choice)',
      default: 'multiple-choice',
    }),
    clean: Flags.boolean({
      description: 'Clean test workspace before running',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output including webpack logs',
      default: false,
    }),
    'keep-workspace': Flags.boolean({
      description: 'Keep workspace directory after test (for debugging)',
      default: false,
    }),
  };

  private logger!: Logger;

  public async run(): Promise<void> {
    const { flags } = await this.parse(TestBundler);
    this.logger = new Logger(flags.verbose);

    this.logger.section('🚀 Testing PIE Bundler with Workspace Packages');

    // Setup paths
    const workspaceRoot = join(tmpdir(), 'pie-bundler-workspace-test');
    const cacheDir = join(workspaceRoot, 'cache');
    const outputDir = join(workspaceRoot, 'output');

    if (flags.clean && existsSync(workspaceRoot)) {
      this.logger.info('Cleaning old workspace...');
      rmSync(workspaceRoot, { recursive: true, force: true });
    }

    mkdirSync(outputDir, { recursive: true });
    mkdirSync(cacheDir, { recursive: true });

    // Build local packages first
    this.log('\n📦 Building local packages');
    await this.buildLocalPackages(flags.element);

    // Create workspace with local packages
    this.log('\n🔗 Setting up test workspace');
    const workspaceDir = await this.setupWorkspace(workspaceRoot, flags.element);

    // Test the bundler - use workspaceDir instead of installing from NPM
    this.log('\n⚙️  Running bundler test');

    try {
      this.logger.info(`Building bundle for @pie-element/${flags.element}...`);

      // Call bundler directly without download step - workspace already has packages
      const result = await this.buildFromWorkspace(workspaceDir, outputDir, flags.element);

      if (flags.verbose) {
        this.log('\nBuild Result:');
        this.log(JSON.stringify(result, null, 2));
      }

      if (!result.success) {
        this.logger.error('Build failed');
        if (result.errors) {
          this.log('\nErrors:');
          for (const err of result.errors) {
            this.log(`  - ${err}`);
          }
        }
        this.error('Bundler test failed', { exit: 1 });
      }

      // Verify results
      this.log('\n✓ Verifying bundles');
      await this.verifyBundles(outputDir, result.hash);

      // Summary
      this.log(`\n${'='.repeat(60)}`);
      this.log('✅ BUNDLER TEST PASSED');
      this.log('='.repeat(60));
      this.log(`Element:        @pie-element/${flags.element}`);
      this.log(`Hash:           ${result.hash}`);
      this.log(`Duration:       ${result.duration}ms`);
      this.log(`Cached:         ${result.cached ? 'Yes' : 'No'}`);
      this.log(`Bundle dir:     ${join(outputDir, result.hash)}`);

      if (!flags['keep-workspace']) {
        this.logger.info('\nCleaning up workspace...');
        rmSync(workspaceRoot, { recursive: true, force: true });
      } else {
        this.log(`Workspace:      ${workspaceRoot}`);
      }

      this.log('='.repeat(60));
      this.log('');
    } catch (error: any) {
      this.logger.error(`Test failed: ${error.message}`);
      if (flags.verbose) {
        this.log(error.stack);
      }
      this.error('Bundler test failed', { exit: 1 });
    }
  }

  private async buildLocalPackages(element: string): Promise<void> {
    const packages = ['packages/shared/mathquill', `packages/elements-react/${element}`];

    for (const pkg of packages) {
      if (!existsSync(pkg)) {
        this.logger.warn(`Package not found: ${pkg}`);
        continue;
      }

      this.logger.info(`Building ${pkg}...`);
      try {
        execSync('bun run build', {
          cwd: pkg,
          stdio: this.logger.isVerbose() ? 'inherit' : 'pipe',
        });
      } catch (error: any) {
        this.logger.warn(`Build failed for ${pkg}: ${error.message}`);
      }
    }
  }

  private async setupWorkspace(workspaceRoot: string, element: string): Promise<string> {
    const workspaceDir = join(workspaceRoot, 'workspace');
    const packagesDir = join(workspaceDir, 'packages');

    mkdirSync(packagesDir, { recursive: true });

    // Create workspace package.json with bundler dependencies
    writeFileSync(
      join(workspaceDir, 'package.json'),
      JSON.stringify(
        {
          name: 'pie-bundler-test-workspace',
          private: true,
          workspaces: [
            'packages/*',
            'packages/*/controller',
            'packages/*/configure',
            'packages/*/author',
          ],
          dependencies: {
            'esbuild-loader': '^4.4.2',
            'css-loader': '^7.1.2',
            'style-loader': '^4.0.0',
            'url-loader': '^4.1.1',
          },
        },
        null,
        2
      )
    );

    // Symlink local packages
    const localPackages = {
      'shared-mathquill': 'packages/shared/mathquill',
      [element]: `packages/elements-react/${element}`,
    };

    for (const [name, path] of Object.entries(localPackages)) {
      if (!existsSync(path)) {
        this.logger.warn(`Package not found: ${path}`);
        continue;
      }

      const linkPath = join(packagesDir, name);
      if (existsSync(linkPath)) {
        rmSync(linkPath, { recursive: true, force: true });
      }

      this.logger.info(`Linking ${name} → ${path}`);
      symlinkSync(join(process.cwd(), path), linkPath, 'dir');
    }

    // Install dependencies
    this.logger.info('Installing workspace dependencies...');
    try {
      execSync('bun install', {
        cwd: workspaceDir,
        stdio: this.logger.isVerbose() ? 'inherit' : 'pipe',
      });
    } catch (error: any) {
      this.logger.warn(`Workspace install had issues: ${error.message}`);
    }

    // Create symlinks in node_modules for @pie-element packages
    const nodeModulesDir = join(workspaceDir, 'node_modules');
    const pieElementDir = join(nodeModulesDir, '@pie-element');
    mkdirSync(pieElementDir, { recursive: true });

    // Link shared-mathquill
    const mathquillLink = join(pieElementDir, 'shared-mathquill');
    if (existsSync(mathquillLink)) {
      rmSync(mathquillLink, { recursive: true, force: true });
    }
    symlinkSync(join(packagesDir, 'shared-mathquill'), mathquillLink, 'dir');
    this.logger.info('Linked @pie-element/shared-mathquill in node_modules');

    // Link element package
    const elementLink = join(pieElementDir, element);
    if (existsSync(elementLink)) {
      rmSync(elementLink, { recursive: true, force: true });
    }
    symlinkSync(join(packagesDir, element), elementLink, 'dir');
    this.logger.info(`Linked @pie-element/${element} in node_modules`);

    return workspaceDir;
  }

  private async buildFromWorkspace(
    workspaceDir: string,
    outputDir: string,
    element: string
  ): Promise<any> {
    const dependencies: BuildDependency[] = [{ name: `@pie-element/${element}`, version: '0.1.0' }];
    const hash = mkDependencyHash(dependencies);
    const startTime = Date.now();

    this.logger.info(`Bundle hash: ${hash}`);

    // Generate entry files
    const entryDir = join(workspaceDir, 'entries');
    mkdirSync(entryDir, { recursive: true });

    const requestedBundles: Array<'player' | 'client-player' | 'editor'> = [
      'player',
      'client-player',
      'editor',
    ];
    const entries = generateEntries(dependencies, workspaceDir, requestedBundles);

    writeFileSync(join(entryDir, 'player.js'), entries.player || '');
    writeFileSync(join(entryDir, 'client-player.js'), entries['client-player'] || '');
    writeFileSync(join(entryDir, 'editor.js'), entries.editor || '');

    // Create webpack config
    const bundleOutputPath = join(outputDir, hash);
    mkdirSync(bundleOutputPath, { recursive: true });

    const webpackConfig = createWebpackConfig({
      context: entryDir,
      entry: {
        player: join(entryDir, 'player.js'),
        'client-player': join(entryDir, 'client-player.js'),
        editor: join(entryDir, 'editor.js'),
      },
      outputPath: bundleOutputPath,
      workspaceDir,
      elements: dependencies.map((d) => d.name.split('/')[1]),
    });

    // Add repo's node_modules to webpack resolve paths for workspace testing
    if (!webpackConfig.resolve) webpackConfig.resolve = {};
    if (!webpackConfig.resolve.modules) webpackConfig.resolve.modules = [];
    webpackConfig.resolve.modules.push(join(process.cwd(), 'node_modules'));

    // Run webpack
    return new Promise((resolve, reject) => {
      webpack(webpackConfig, (err: any, stats: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (stats?.hasErrors()) {
          const errors = stats.toString({ colors: false, errorDetails: true });
          reject(new Error(errors));
          return;
        }

        resolve({
          success: true,
          hash,
          bundles: {
            player: `/bundles/${hash}/player.js`,
            clientPlayer: `/bundles/${hash}/client-player.js`,
            editor: `/bundles/${hash}/editor.js`,
          },
          duration: Date.now() - startTime,
          cached: false,
        });
      });
    });
  }

  private async verifyBundles(outputDir: string, hash: string): Promise<void> {
    const bundleDir = join(outputDir, hash);
    const files = ['player.js', 'client-player.js', 'editor.js'];

    let allOk = true;

    for (const file of files) {
      const filePath = join(bundleDir, file);
      if (!existsSync(filePath)) {
        this.logger.error(`❌ ${file} not found`);
        allOk = false;
        continue;
      }

      const content = readFileSync(filePath, 'utf-8');
      const size = (content.length / 1024).toFixed(1);
      this.logger.success(`✅ ${file} (${size} KB)`);

      // Verify IIFE format for player bundle
      if (file === 'player.js' && !content.includes('window.pie')) {
        this.logger.warn(`⚠️  ${file} doesn't contain window.pie`);
      }
    }

    if (!allOk) {
      this.error('Bundle verification failed', { exit: 1 });
    }
  }
}
