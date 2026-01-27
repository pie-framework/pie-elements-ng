import { Args, Command, Flags } from '@oclif/core';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Start development server for Svelte element demos.
 *
 * This command:
 * 1. Optionally validates packages via Verdaccio (--validate flag)
 * 2. Builds the element player (if needed)
 * 3. Builds the specified Svelte element (if needed)
 * 4. Starts the package server (serves built dist/ files)
 * 5. Starts a Vite dev server for the demo
 *
 * The demo uses import maps pointing to the local package server,
 * which serves files directly from workspace packages.
 *
 * By default, Verdaccio validation is skipped for faster startup.
 * Use --validate to ensure packages are production-ready.
 */
export default class DevDemoSvelte extends Command {
  static override description = 'Start demo server for Svelte elements';

  static override examples = [
    '<%= config.bin %> <%= command.id %> slider',
    '<%= config.bin %> <%= command.id %> media --port 5180',
    '<%= config.bin %> <%= command.id %> upload --skip-build --no-open',
    '<%= config.bin %> <%= command.id %> number-line --validate  # Validate packages before CI/release',
  ];

  static override flags = {
    port: Flags.integer({
      char: 'p',
      description: 'Vite dev server port',
      default: 5300,
    }),
    'skip-build': Flags.boolean({
      description: 'Skip building element and element-player',
      default: false,
    }),
    'skip-element-build': Flags.boolean({
      description: 'Skip building the element only',
      default: false,
    }),
    'skip-player-build': Flags.boolean({
      description: 'Skip building the element-player only',
      default: false,
    }),
    validate: Flags.boolean({
      char: 'v',
      description: 'Validate packages via Verdaccio (publish for validation)',
      default: false,
    }),
    open: Flags.boolean({
      char: 'o',
      description: 'Open browser automatically',
      default: false,
      allowNo: true,
    }),
  };

  static override args = {
    element: Args.string({
      required: true,
      description: 'Element name (e.g., slider, media, upload)',
    }),
  };

  private viteProcess: ChildProcess | null = null;
  private packageServerProcess: ChildProcess | null = null;

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DevDemoSvelte);

    // Resolve element path in Svelte elements
    const elementPath = path.join(process.cwd(), 'packages', 'elements-svelte', args.element);

    if (!existsSync(elementPath)) {
      this.error(
        `Svelte element not found: ${args.element}\nLooked in: ${elementPath}\n\nDid you mean to use dev:demo:react?`
      );
    }

    // Check if demo exists
    const demoPath = path.join(elementPath, 'docs/demo');
    if (!existsSync(demoPath)) {
      this.error(
        `No demo found at ${demoPath}. Please create a demo using the templates in docs/DEMO_SYSTEM.md`
      );
    }

    this.log(`Starting Svelte demo for ${args.element}...`);
    this.log('');

    try {
      const skipElementBuild = flags['skip-build'] || flags['skip-element-build'];
      const skipPlayerBuild = flags['skip-build'] || flags['skip-player-build'];

      // 1. Optionally validate packages via Verdaccio
      if (flags.validate) {
        this.log('Validating packages via Verdaccio...');
        await this.ensureVerdaccioAndPublish();
      } else {
        this.log('Skipping Verdaccio validation (use --validate to enable)');
      }

      // 2. Build element-player if needed
      if (!skipPlayerBuild) {
        await this.buildElementPlayer();
      }

      // 3. Build element if needed
      if (!skipElementBuild) {
        await this.buildElement(args.element);
      }

      // 4. Start package server (serves built dist files)
      this.log('Starting package server on port 4874...');
      this.packageServerProcess = await this.startPackageServer();

      // 5. Start Vite dev server
      this.log(`Starting Vite dev server on port ${flags.port}...`);
      this.viteProcess = await this.startVite(elementPath, flags.port);

      // 4. Open browser
      if (flags.open) {
        await this.sleep(2000); // Wait for Vite to start
        const url = `http://localhost:${flags.port}`;
        this.log(`Opening ${url}...`);
        await this.openBrowser(url);
      }

      this.log('');
      this.log('✓ Svelte demo server running');
      this.log(`  Demo: http://localhost:${flags.port}`);
      this.log('');
      this.log('📦 The demo uses local package server (http://localhost:4874)');
      this.log('   PIE packages are served from built dist/ directories');
      this.log('   Packages validated via Verdaccio: http://localhost:4873');
      this.log('');
      this.log('Press Ctrl+C to stop');

      // 5. Handle graceful shutdown
      process.on('SIGINT', () => {
        this.log('\nShutting down...');
        this.cleanup();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        this.cleanup();
        process.exit(0);
      });

      // Keep process alive
      await new Promise(() => {});
    } catch (error) {
      this.cleanup();
      throw error;
    }
  }

  private async buildElementPlayer(): Promise<void> {
    this.log('Building element-player...');

    return new Promise((resolve, reject) => {
      const build = spawn(
        'bun',
        ['run', 'turbo', 'build', '--force', '--filter', '@pie-element/element-player'],
        {
          stdio: 'inherit',
          cwd: process.cwd(),
        }
      );

      build.on('close', (code) => {
        if (code === 0) {
          this.log('✓ Element player built\n');
          resolve();
        } else {
          reject(new Error(`Element player build failed with code ${code}`));
        }
      });

      build.on('error', reject);
    });
  }

  private async buildElement(element: string): Promise<void> {
    this.log(`Building ${element}...`);

    return new Promise((resolve, reject) => {
      const build = spawn(
        'bun',
        ['run', 'turbo', 'build', '--force', '--filter', `@pie-element/${element}-svelte`],
        {
          stdio: 'inherit',
          cwd: process.cwd(),
        }
      );

      build.on('close', (code) => {
        if (code === 0) {
          this.log('✓ Element built\n');
          resolve();
        } else {
          reject(new Error(`Element build failed with code ${code}`));
        }
      });

      build.on('error', reject);
    });
  }

  private async startVite(elementPath: string, port: number): Promise<ChildProcess> {
    const proc = spawn('bunx', ['vite', 'docs/demo', '--port', port.toString(), '--host'], {
      cwd: elementPath,
      stdio: 'inherit',
    });

    proc.on('error', (error) => {
      this.error(`Failed to start Vite: ${error.message}`);
    });

    return proc;
  }

  private async openBrowser(url: string): Promise<void> {
    try {
      const open = await import('open');
      await open.default(url);
    } catch (error) {
      this.warn(`Could not open browser: ${error}`);
      this.log(`Please open ${url} manually`);
    }
  }

  private cleanup(): void {
    if (this.viteProcess) {
      try {
        this.viteProcess.kill('SIGTERM');
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.viteProcess = null;

      if (this.packageServerProcess) {
        try {
          this.packageServerProcess.kill('SIGTERM');
        } catch (error) {
          // Ignore errors during cleanup
        }
        this.packageServerProcess = null;
      }
    }
  }

  private async startPackageServer(): Promise<ChildProcess> {
    const proc = spawn('bun', ['scripts/serve-packages.ts'], {
      cwd: process.cwd(),
      stdio: 'inherit',
    });

    proc.on('error', (error) => {
      this.error(`Failed to start package server: ${error.message}`);
    });

    // Wait a bit for server to start
    await this.sleep(1000);

    return proc;
  }

  private async ensureVerdaccioAndPublish(): Promise<void> {
    return new Promise((resolve, reject) => {
      const publish = spawn('bun', ['run', 'registry:publish'], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      publish.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to publish to Verdaccio (code ${code})`));
        }
      });

      publish.on('error', reject);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
