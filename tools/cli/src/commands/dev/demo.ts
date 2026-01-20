import { Args, Command, Flags } from '@oclif/core';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Start development server for element demos using the new embedded local-esm-cdn architecture.
 *
 * This command:
 * 1. Builds the element player (if needed)
 * 2. Builds the specified element (if needed)
 * 3. Starts a single Vite dev server with embedded local-esm-cdn
 *
 * Unlike dev:serve, this uses the new architecture where local-esm-cdn
 * is embedded as a Vite plugin, not a separate server.
 */
export default class DevDemo extends Command {
  static override description = 'Start demo server with embedded local-esm-cdn (new architecture)';

  static override examples = [
    '<%= config.bin %> <%= command.id %> hotspot',
    '<%= config.bin %> <%= command.id %> multiple-choice --port 5180',
    '<%= config.bin %> <%= command.id %> math-inline --skip-build --no-open',
  ];

  static override flags = {
    port: Flags.integer({
      char: 'p',
      description: 'Vite dev server port',
      default: 5174,
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
      description: 'Element name (e.g., hotspot, multiple-choice, math-inline)',
    }),
  };

  private viteProcess: ChildProcess | null = null;

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DevDemo);

    // Resolve element path
    const elementPath = this.resolveElementPath(args.element);
    if (!elementPath) {
      this.error(`Element not found: ${args.element}`);
    }

    // Check if demo exists
    const demoPath = path.join(elementPath, 'docs/demo');
    if (!existsSync(demoPath)) {
      this.error(
        `No demo found at ${demoPath}. Please create a demo using the templates in docs/DEMO_SYSTEM.md`
      );
    }

    this.log(`Starting demo for ${args.element}...`);
    this.log('');

    try {
      const skipElementBuild = flags['skip-build'] || flags['skip-element-build'];
      const skipPlayerBuild = flags['skip-build'] || flags['skip-player-build'];

      // 1. Build element-player if needed
      if (!skipPlayerBuild) {
        await this.buildElementPlayer();
      }

      // 2. Build element if needed
      if (!skipElementBuild) {
        await this.buildElement(args.element);
      }

      // 3. Start Vite dev server (with embedded local-esm-cdn)
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
      this.log('✓ Demo server running');
      this.log(`  Demo: http://localhost:${flags.port}`);
      this.log('');
      this.log('📖 The demo uses embedded local-esm-cdn (Vite plugin)');
      this.log('   PIE packages are served via /@pie-* URLs');
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

  private resolveElementPath(element: string): string | null {
    // Try React first
    let elementPath = path.join(process.cwd(), 'packages/elements-react', element);

    if (existsSync(elementPath)) return elementPath;

    // Try Svelte
    elementPath = path.join(process.cwd(), 'packages/elements-svelte', element);

    if (existsSync(elementPath)) return elementPath;

    return null;
  }

  private async buildElementPlayer(): Promise<void> {
    this.log('Building element-player...');

    return new Promise((resolve, reject) => {
      const build = spawn(
        'bun',
        ['run', 'turbo', 'build', '--force', '--filter', '@pie-elements-ng/element-player'],
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
      const build = spawn('bun', ['run', 'turbo', 'build', '--force', '--filter', `@pie-element/${element}`], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

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
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
