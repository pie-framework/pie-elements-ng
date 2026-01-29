import { Args, Command, Flags } from '@oclif/core';
import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';

/**
 * Start development server for element demos.
 *
 * This command:
 * 1. Builds the element player (if needed)
 * 2. Builds the specified element (if needed)
 * 3. Generates a demo app from the template
 * 4. Starts a single Vite dev server for the generated demo
 */
export default class DevDemo extends Command {
  static override description = 'Start demo server using apps/element-demo';

  static override examples = [
    '<%= config.bin %> <%= command.id %> hotspot',
    '<%= config.bin %> <%= command.id %> multiple-choice --port 5180',
    '<%= config.bin %> <%= command.id %> math-inline --skip-build --no-open',
  ];

  static override flags = {
    port: Flags.integer({
      char: 'p',
      description: 'Vite dev server port',
      default: 5600,
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
  private lockFilePath = path.join(process.cwd(), '.demo-server.lock');

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(DevDemo);

    // Resolve element path
    const elementPath = this.resolveElementPath(args.element);
    if (!elementPath) {
      this.error(`Element not found: ${args.element}`);
    }

    this.acquireLock(flags.port, args.element);

    // Determine element type (react or svelte)
    const elementType = elementPath.includes('elements-svelte') ? 'svelte' : 'react';
    const elementPathRelative = path.relative(process.cwd(), elementPath);

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

      // 3. Install workspace dependencies
      this.log('Installing workspace dependencies...');
      await this.installDependencies();
      this.log('✓ Dependencies installed\n');

      // 4. Start Vite dev server
      this.log(`Starting Vite dev server on port ${flags.port}...`);
      const demoAppPath = path.join(process.cwd(), 'apps', 'element-demo');
      if (!existsSync(demoAppPath)) {
        this.error(`Demo app not found at ${demoAppPath}`);
      }
      this.viteProcess = await this.startVite(demoAppPath, flags.port, {
        VITE_ELEMENT_NAME: args.element,
        VITE_ELEMENT_PATH: elementPathRelative,
        VITE_ELEMENT_TYPE: elementType,
        VITE_WORKSPACE_ROOT: process.cwd(),
      });

      // 5. Open browser
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
      this.log('📖 The demo uses workspace dependencies for module resolution');
      this.log('   All PIE packages are resolved automatically via the monorepo');
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

  private resolveElementPath(element: string): string | null {
    const targetPackageName = `@pie-element/${element}`;
    const workspacePackages = this.getWorkspacePackages();
    const match = workspacePackages.find((pkg) => pkg.name === targetPackageName);
    return match?.path ?? null;
  }

  private getWorkspacePackages(): Array<{ name: string; path: string }> {
    const rootPkgPath = path.join(process.cwd(), 'package.json');
    if (!existsSync(rootPkgPath)) {
      return [];
    }

    const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
    const workspaces = Array.isArray(rootPkg.workspaces)
      ? rootPkg.workspaces
      : (rootPkg.workspaces?.packages ?? []);

    const packages: Array<{ name: string; path: string }> = [];

    for (const pattern of workspaces) {
      if (typeof pattern !== 'string') continue;
      if (pattern.includes('*')) {
        const baseDir = pattern.replace('/*', '');
        const basePath = path.join(process.cwd(), baseDir);
        if (!existsSync(basePath)) continue;

        const dirs = readdirSync(basePath, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name);

        for (const dir of dirs) {
          const pkgPath = path.join(basePath, dir);
          const pkgJsonPath = path.join(pkgPath, 'package.json');
          if (!existsSync(pkgJsonPath)) continue;
          const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
          packages.push({ name: pkgJson.name, path: pkgPath });
        }
      } else {
        const pkgPath = path.join(process.cwd(), pattern);
        const pkgJsonPath = path.join(pkgPath, 'package.json');
        if (!existsSync(pkgJsonPath)) continue;
        const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
        packages.push({ name: pkgJson.name, path: pkgPath });
      }
    }

    return packages;
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
        ['run', 'turbo', 'build', '--force', '--filter', `@pie-element/${element}`],
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

  private async installDependencies(): Promise<void> {
    return new Promise((resolve, reject) => {
      const install = spawn('bun', ['install'], {
        cwd: process.cwd(), // Run from monorepo root to resolve all workspaces
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

    this.releaseLock();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private acquireLock(port: number, element: string): void {
    if (existsSync(this.lockFilePath)) {
      try {
        const raw = readFileSync(this.lockFilePath, 'utf-8');
        const lock = JSON.parse(raw);
        if (lock?.pid && this.isProcessRunning(lock.pid)) {
          this.error(
            `A demo server is already running (element: ${lock.element ?? 'unknown'}, port: ${
              lock.port ?? 'unknown'
            }, pid: ${lock.pid}). Stop it or use --port to run another demo.`
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
      element,
      startedAt: new Date().toISOString(),
    };
    writeFileSync(this.lockFilePath, `${JSON.stringify(lockInfo, null, 2)}\n`);
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
