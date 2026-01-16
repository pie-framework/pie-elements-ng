import { Args, Command, Flags } from '@oclif/core';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { existsSync } from 'node:fs';

export default class DevServe extends Command {
  static override description = 'Start development server for element demos';

  static override examples = [
    '<%= config.bin %> <%= command.id %> multiple-choice',
    '<%= config.bin %> <%= command.id %> math-inline --port 5180',
    '<%= config.bin %> <%= command.id %> hotspot --skip-build --no-open',
  ];

  static override flags = {
    port: Flags.integer({
      char: 'p',
      description: 'ESM CDN server port',
      default: 5179,
    }),
    'vite-port': Flags.integer({
      description: 'Vite dev server port',
      default: 5173,
    }),
    'skip-build': Flags.boolean({
      description: 'Skip initial build step',
      default: false,
    }),
    open: Flags.boolean({
      char: 'o',
      description: 'Open browser automatically',
      default: true,
      allowNo: true,
    }),
  };

  static override args = {
    element: Args.string({
      required: true,
      description: 'Element name (e.g., multiple-choice, math-inline)',
    }),
  };

  private processes: ChildProcess[] = [];

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DevServe);

    // Resolve element path
    const elementPath = this.resolveElementPath(args.element);
    if (!elementPath) {
      this.error(`Element not found: ${args.element}`);
    }

    this.log(`Starting dev server for ${args.element}...`);
    this.log('');

    try {
      // 1. Build element if needed
      if (!flags['skip-build']) {
        await this.buildElement(args.element);
      }

      // 2. Start local-esm-cdn server
      this.log(`Starting ESM CDN on port ${flags.port}...`);
      const esmCdn = await this.startEsmCdn(flags.port, flags['skip-build']);
      this.processes.push(esmCdn);

      // Wait a bit for server to start
      await this.sleep(2000);

      // 3. Start Vite for demo HTML
      const demoPath = path.join(elementPath, 'docs/demo');
      if (existsSync(demoPath)) {
        this.log(`Starting Vite dev server on port ${flags['vite-port']}...`);
        const vite = await this.startVite(elementPath, flags['vite-port']);
        this.processes.push(vite);

        // 4. Open browser
        if (flags.open) {
          await this.sleep(2000); // Wait for Vite to start
          const url = `http://localhost:${flags['vite-port']}`;
          this.log(`Opening ${url}...`);
          await this.openBrowser(url);
        }
      } else {
        this.warn(`No demo directory found at ${demoPath}`);
      }

      this.log('');
      this.log('✓ Dev server running');
      this.log(`  ESM CDN: http://localhost:${flags.port}`);
      this.log(`  Demo: http://localhost:${flags['vite-port']}`);
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

  private async buildElement(element: string): Promise<void> {
    this.log(`Building ${element}...`);

    return new Promise((resolve, reject) => {
      const build = spawn('bun', ['run', 'turbo', 'build', '--filter', `@pie-element/${element}`], {
        stdio: 'inherit',
        cwd: process.cwd(),
      });

      build.on('close', (code) => {
        if (code === 0) {
          this.log('✓ Build complete\n');
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });

      build.on('error', reject);
    });
  }

  private async startEsmCdn(port: number, skipBuild: boolean): Promise<ChildProcess> {
    const env = {
      ...process.env,
      LOCAL_ESM_CDN_PORT: port.toString(),
      LOCAL_ESM_CDN_SKIP_BUILD: skipBuild ? '1' : '0',
    };

    const proc = spawn('bun', ['run', 'local-esm-cdn'], {
      env,
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    proc.on('error', (error) => {
      this.error(`Failed to start ESM CDN: ${error.message}`);
    });

    return proc;
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
    for (const proc of this.processes) {
      try {
        proc.kill('SIGTERM');
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    this.processes = [];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
