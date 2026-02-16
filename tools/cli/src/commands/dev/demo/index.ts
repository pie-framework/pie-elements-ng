import { Command, Flags } from '@oclif/core';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { existsSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

/**
 * Start unified demo application for all PIE elements.
 *
 * This command starts the apps/element-demo SvelteKit application which provides
 * a unified demo experience for all 27 PIE elements with multiple demo configurations.
 */
export default class DevDemo extends Command {
  static override description = 'Start unified demo app for all PIE elements (apps/element-demo)';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --port 5180',
    '<%= config.bin %> <%= command.id %> --open',
    '<%= config.bin %> <%= command.id %> --build',
  ];

  static override flags = {
    port: Flags.integer({
      char: 'p',
      description: 'Vite dev server port',
      default: 5222,
    }),
    build: Flags.boolean({
      char: 'b',
      description: 'Build all elements before starting',
      default: false,
    }),
    open: Flags.boolean({
      char: 'o',
      description: 'Open browser automatically',
      default: false,
      allowNo: true,
    }),
  };

  static override args = {};

  private viteProcess: ChildProcess | null = null;
  private lockFilePath = '';
  private bundlerInstanceDir = '';

  public async run(): Promise<void> {
    const { flags } = await this.parse(DevDemo);

    // Find monorepo root - check if we're already at root or need to traverse up
    let monorepoRoot = process.cwd();
    const rootPackageJson = path.join(monorepoRoot, 'package.json');

    // If package.json doesn't exist at current level, we're in a subdirectory (like tools/cli)
    // Traverse up to find the root
    if (!existsSync(rootPackageJson) || !existsSync(path.join(monorepoRoot, 'apps'))) {
      monorepoRoot = path.resolve(monorepoRoot, '../..');
    }

    const demoAppPath = path.join(monorepoRoot, 'apps', 'element-demo');

    this.lockFilePath = this.getLockFilePath(flags.port);
    this.acquireLock(flags.port);
    this.bundlerInstanceDir = this.createBundlerInstanceDir(flags.port);

    this.log('Starting unified demo app for all PIE elements...');
    this.log('');
    this.log('Bundler mode: local (default)');
    this.log(`Bundler workspace: ${this.bundlerInstanceDir}`);
    this.log('');

    try {
      // 1. Build all elements if requested
      if (flags.build) {
        this.log('Building all React elements...');
        await this.buildAllElements(monorepoRoot);
      }

      // 2. Install workspace dependencies (only if building)
      if (flags.build) {
        this.log('Installing workspace dependencies...');
        await this.installDependencies(monorepoRoot);
        this.log('✓ Dependencies installed\n');
      }

      // 3. Start Vite dev server
      this.log(`Starting Vite dev server on port ${flags.port}...`);
      if (!existsSync(demoAppPath)) {
        this.error(`Demo app not found at ${demoAppPath}`);
      }
      this.viteProcess = await this.startVite(demoAppPath, flags.port, {
        DEMO_BUNDLER_INSTANCE_DIR: this.bundlerInstanceDir,
      });

      // 4. Open browser
      if (flags.open) {
        await this.sleep(3000); // Wait for Vite to start
        const url = `http://localhost:${flags.port}`;
        this.log(`Opening ${url}...`);
        await this.openBrowser(url);
      }

      this.log('');
      this.log('✓ Demo app running');
      this.log(`  URL: http://localhost:${flags.port}`);
      this.log('');
      if (!flags.build) {
        this.log('ℹ️  Running without rebuild. Use --build to rebuild all elements first.');
        this.log('');
      }
      this.log('📖 The demo app showcases all 27 PIE elements with multiple demos');
      this.log('   Navigate to any element to see available demo configurations');
      this.log('');
      this.log('Press Ctrl+C to stop');

      // 7. Handle graceful shutdown
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

  private async buildAllElements(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const build = spawn(
        'bun',
        [
          'run',
          'turbo',
          'build',
          '--force',
          '--filter',
          './packages/elements-react/*',
          '--filter',
          './packages/elements-svelte/*',
        ],
        {
          stdio: 'inherit',
          cwd,
        }
      );

      build.on('close', (code) => {
        if (code === 0) {
          this.log('✓ All elements built\n');
          resolve();
        } else {
          reject(new Error(`Build failed with code ${code}`));
        }
      });

      build.on('error', reject);
    });
  }

  private async startVite(
    demoPath: string,
    port: number,
    env: Record<string, string>
  ): Promise<ChildProcess> {
    const proc = spawn('bunx', ['vite', '--port', port.toString(), '--host'], {
      cwd: demoPath,
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: port.toString(),
        ...env,
      },
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

  private async installDependencies(cwd: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const install = spawn('bun', ['install'], {
        cwd, // Run from monorepo root to resolve all workspaces
        stdio: 'inherit',
      });

      install.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Dependency installation failed with code ${code}`));
        }
      });

      install.on('error', reject);
    });
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

    if (this.bundlerInstanceDir) {
      try {
        rmSync(this.bundlerInstanceDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors.
      }
      this.bundlerInstanceDir = '';
    }

    this.releaseLock();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private acquireLock(port: number): void {
    if (existsSync(this.lockFilePath)) {
      try {
        const raw = readFileSync(this.lockFilePath, 'utf-8');
        const lock = JSON.parse(raw);
        if (lock?.pid && this.isProcessRunning(lock.pid)) {
          this.error(
            `A demo server is already running (port: ${lock.port ?? 'unknown'}, pid: ${
              lock.pid
            }). Stop it or use --port to run on a different port.`
          );
        }
      } catch (error) {
        // If the lock is unreadable, remove it and continue.
      }

      try {
        unlinkSync(this.lockFilePath);
      } catch {
        // Ignore cleanup errors.
      }
    }

    const lockInfo = {
      pid: process.pid,
      port,
      startedAt: new Date().toISOString(),
    };
    writeFileSync(this.lockFilePath, `${JSON.stringify(lockInfo, null, 2)}\n`);
  }

  private getLockFilePath(port: number): string {
    return path.join(process.cwd(), `.demo-server.${port}.lock`);
  }

  private createBundlerInstanceDir(port: number): string {
    // New run => new temp dir, so local cache is fresh after every restart.
    const instanceId = `demo-${port}-${process.pid}-${Date.now()}`;
    return path.join(tmpdir(), 'pie-element-demo-bundler', instanceId);
  }

  private releaseLock(): void {
    if (!existsSync(this.lockFilePath)) return;
    try {
      const raw = readFileSync(this.lockFilePath, 'utf-8');
      const lock = JSON.parse(raw);
      if (lock?.pid !== process.pid) return;
    } catch {
      // If parsing fails, still attempt to remove stale lock.
    }

    try {
      unlinkSync(this.lockFilePath);
    } catch {
      // Ignore cleanup errors.
    }
  }

  private isProcessRunning(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
