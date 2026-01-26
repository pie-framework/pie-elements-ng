import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { loadCompatibilityReport, type CompatibilityReport } from '../../utils/compatibility.js';
import { getCurrentCommit } from '../../utils/git.js';
import { printSyncSummary, createEmptySummary } from '../../lib/upstream/sync-summary.js';
import { loadPackageJson, type PackageJson } from '../../utils/package-json.js';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm as fsRm } from 'node:fs/promises';
import { join } from 'node:path';
import { readdir } from '../../lib/upstream/sync-filesystem.js';
import { getAllDeps } from '../../lib/upstream/sync-package-json.js';
import { ControllersStrategy } from '../../lib/upstream/sync-controllers-strategy.js';
import { ReactComponentsStrategy } from '../../lib/upstream/sync-react-strategy.js';
import { PieLibStrategy } from '../../lib/upstream/sync-pielib-strategy.js';
import type { SyncStrategy, SyncContext } from '../../lib/upstream/sync-strategy.js';

interface SyncConfig {
  pieElements: string;
  pieLib: string;
  pieElementsNg: string;

  // What to sync
  syncControllers: boolean;
  syncReactComponents: boolean;
  syncPieLibPackages: boolean;

  // Filters
  elements?: string[];
  pieLibPackages?: string[];
  elementsSpecifiedByUser: boolean;
  pieLibPackagesSpecifiedByUser: boolean;

  // ESM compatibility
  useEsmFilter: boolean;
  compatibilityFile: string;

  // Options
  dryRun: boolean;
  verbose: boolean;
  rewritePackageJson: boolean;
  skipBuild: boolean;

  // Internal: auto-sync pie-lib deps for selected elements
  autoSyncPieLibDeps: boolean;
}

interface SyncResult {
  filesChecked: number;
  filesCopied: number;
  filesSkipped: number;
  filesUpdated: number;
  errors: string[];
  warnings: string[];
}

export default class Sync extends Command {
  static override description = 'Synchronize code from upstream pie-elements repository';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dry-run',
    '<%= config.bin %> <%= command.id %> --element=multiple-choice',
    '<%= config.bin %> <%= command.id %>',
  ];

  static override flags = {
    'dry-run': Flags.boolean({
      description: 'Show what would be synced without making changes',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
    element: Flags.string({
      description: 'Sync only specified element (if ESM-compatible)',
    }),
  };

  private logger = new Logger();
  private touchedElementPackages = new Set<string>();
  private touchedPieLibPackages = new Set<string>();

  public async run(): Promise<void> {
    const { flags } = await this.parse(Sync);

    this.logger = new Logger(flags.verbose);

    const config: SyncConfig = {
      pieElements: '../pie-elements',
      pieLib: '../pie-lib',
      pieElementsNg: '.',
      syncControllers: true,
      syncReactComponents: true,
      syncPieLibPackages: false,
      useEsmFilter: true,
      compatibilityFile: './.compatibility/report.json',
      dryRun: flags['dry-run'],
      verbose: flags.verbose,
      rewritePackageJson: true,
      skipBuild: false,
      autoSyncPieLibDeps: true,
      elementsSpecifiedByUser: !!flags.element,
      pieLibPackagesSpecifiedByUser: false,
    };

    // Configure filters
    if (flags.element) {
      config.elements = [flags.element];
    }

    await this.syncUpstream(config);
  }

  private async syncUpstream(config: SyncConfig): Promise<void> {
    const syncSummary = createEmptySummary();

    const result: SyncResult = {
      filesChecked: 0,
      filesCopied: 0,
      filesSkipped: 0,
      filesUpdated: 0,
      errors: [],
      warnings: [],
    };

    // Reset touched packages for this run
    this.touchedElementPackages = new Set<string>();
    this.touchedPieLibPackages = new Set<string>();

    this.logger.section('🔄 Syncing from upstream');
    this.logger.info(`   Source:      ${config.pieElements}`);
    this.logger.info(`   Destination: ${config.pieElementsNg}/packages/`);
    this.logger.info(`   Mode:        ${config.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Apply ESM compatibility filter and load report for summary
    let compatibilityReport: CompatibilityReport | null = null;
    if (config.useEsmFilter) {
      try {
        compatibilityReport = await loadCompatibilityReport(config.compatibilityFile);
      } catch {
        // Report loading handled in applyEsmFilter
      }
    }
    await this.applyEsmFilter(config);

    // Auto-sync pie-lib dependencies for selected elements (unless explicit pie-lib mode)
    if (config.autoSyncPieLibDeps) {
      const elementsToSync = await this.listElementPackages(config);
      const requiredPieLib = await this.collectPieLibDepsFromElements(config, elementsToSync);
      if (requiredPieLib.length > 0) {
        config.syncPieLibPackages = true;
        config.pieLibPackages = requiredPieLib;
        if (config.verbose) {
          this.logger.info(
            `   Auto pie-lib deps: ${requiredPieLib.length} package(s) required by selected elements`
          );
        }
      }
    }

    // Merge with ESM-compatible pie-lib packages from compatibility report
    // (This ensures packages like controller-utils that are imported in controllers but not declared in package.json get synced)
    if (compatibilityReport?.pieLibPackages && compatibilityReport.pieLibPackages.length > 0) {
      config.syncPieLibPackages = true;
      const autoDeps = new Set(config.pieLibPackages || []);
      const compatiblePkgs = compatibilityReport.pieLibPackages;
      const merged = new Set([...autoDeps, ...compatiblePkgs]);
      config.pieLibPackages = Array.from(merged);

      const additionalCount = config.pieLibPackages.length - autoDeps.size;
      if (config.verbose && additionalCount > 0) {
        this.logger.info(
          `   Additional ESM-compatible pie-lib: ${additionalCount} package(s) from compatibility report`
        );
      }
    }

    // Verify repos exist
    if (!existsSync(config.pieElements)) {
      this.logger.error(`pie-elements not found at ${config.pieElements}`);
      this.error('Sync failed', { exit: 1 });
    }

    // Clean target directories first (ensures a clean slate for full syncs)
    await this.cleanTargetDirectories(config);

    // Execute sync strategies
    const strategies: SyncStrategy[] = [
      new ControllersStrategy(),
      new ReactComponentsStrategy(),
      new PieLibStrategy(),
    ];

    const context: SyncContext = {
      config: {
        pieElements: config.pieElements,
        pieLib: config.pieLib,
        pieElementsNg: config.pieElementsNg,
        syncControllers: config.syncControllers,
        syncReactComponents: config.syncReactComponents,
        syncPieLib: config.syncPieLibPackages,
        skipDemos: true,
        upstreamCommit: getCurrentCommit(config.pieElements),
      },
      logger: this.logger,
      // Only set packageFilter if user explicitly specified a single element
      packageFilter: config.elementsSpecifiedByUser ? config.elements?.[0] : undefined,
      compatibilityReport: compatibilityReport || undefined,
    };

    for (const strategy of strategies) {
      if (strategy.shouldRun(context.config)) {
        const result = await strategy.execute(context);

        // Track by strategy type
        const desc = strategy.getDescription();
        if (desc === 'controllers') {
          syncSummary.controllersSync = result.count;
        } else if (desc === 'React components') {
          syncSummary.reactComponentsSynced = result.count;
          // Track touched React element packages for build
          for (const pkgName of result.packageNames) {
            // Only add element packages (not @pie-lib packages)
            if (!pkgName.startsWith('@pie-lib/')) {
              this.touchedElementPackages.add(pkgName);
            }
          }
        } else if (desc === '@pie-lib packages') {
          syncSummary.pieLibPackagesSynced = result.count;
          // Track touched pie-lib packages for build
          for (const pkgName of result.packageNames) {
            if (pkgName.startsWith('@pie-lib/')) {
              const libName = pkgName.replace('@pie-lib/', '');
              this.touchedPieLibPackages.add(libName);
            }
          }
        }
        syncSummary.totalPackagesSynced += result.count;
        // Add unique package names (avoid duplicates from multiple strategies syncing same package)
        for (const pkgName of result.packageNames) {
          if (!syncSummary.syncedPackageNames.includes(pkgName)) {
            syncSummary.syncedPackageNames.push(pkgName);
          }
        }
      }
    }

    // Ensure external dependencies from synced packages are available at repo root.
    if (!config.dryRun) {
      await this.rewriteWorkspaceDependencies(config);
    }

    // Build by default (unless dry-run or explicitly skipped)
    if (!config.dryRun && !config.skipBuild) {
      await this.buildTouchedPackages(config, result);
    }

    // Add blocked package counts from compatibility report
    if (compatibilityReport) {
      syncSummary.blockedElements = Object.keys(compatibilityReport.blockedElements).length;
      syncSummary.blockedPieLib = Object.values(compatibilityReport.pieLibDetails).filter(
        (d) => !d.compatible
      ).length;
    }

    // Print summary and handle errors
    printSyncSummary(syncSummary, compatibilityReport, config.pieElementsNg, this.logger);

    if (result.errors.length > 0) {
      this.error('Sync completed with errors', { exit: 1 });
    }
  }

  private async applyEsmFilter(config: SyncConfig): Promise<void> {
    if (!config.useEsmFilter) {
      return;
    }

    let report: CompatibilityReport | null = null;
    try {
      report = await loadCompatibilityReport(config.compatibilityFile);
    } catch (error) {
      this.logger.warn(`⚠️  ESM compatibility file not found at ${config.compatibilityFile}`);
      this.logger.warn('   Run: bun cli upstream:analyze-esm to generate it');
      this.logger.warn('   Proceeding without ESM filter...\n');
      return;
    }

    if (!report) {
      return;
    }

    this.logger.info(`📋 Using ESM compatibility filter from ${config.compatibilityFile}`);
    this.logger.info(`   Last analyzed: ${new Date(report.lastAnalyzed).toLocaleString()}`);
    this.logger.info(`   Compatible elements: ${report.elements.length}`);
    this.logger.info(`   Compatible pie-lib packages: ${report.pieLibPackages.length}`);

    if (Object.keys(report.blockedElements).length > 0) {
      this.logger.info(`   Blocked elements: ${Object.keys(report.blockedElements).length}`);
    }
    this.log('');

    // If user hasn't specified elements, use the compatible list
    if (!config.elements) {
      config.elements = report.elements;
    } else {
      // User specified elements - filter to only compatible ones
      const incompatible = config.elements.filter((el) => !report.elements.includes(el));
      if (incompatible.length > 0) {
        this.logger.warn('⚠️  Warning: These elements are not ESM-compatible and will be skipped:');
        for (const el of incompatible) {
          const blockers = report.blockedElements[el] || [];
          this.logger.warn(`   - ${el}${blockers.length > 0 ? `: ${blockers[0]}` : ''}`);
        }
        this.log('');
        config.elements = config.elements.filter((el) => report.elements.includes(el));
      }
    }

    // If syncing pie-lib packages, use the compatible list
    if (config.syncPieLibPackages && !config.pieLibPackages) {
      config.pieLibPackages = report.pieLibPackages;
    }
  }

  private async listElementPackages(config: SyncConfig): Promise<string[]> {
    if (config.elements && config.elements.length > 0) {
      return config.elements;
    }

    const upstreamElementsDir = join(config.pieElements, 'packages');
    return await readdir(upstreamElementsDir);
  }

  private async collectPieLibDepsFromElements(
    config: SyncConfig,
    elements: string[]
  ): Promise<string[]> {
    const deps = new Set<string>();

    for (const element of elements) {
      const pkgPath = join(config.pieElements, 'packages', element, 'package.json');
      if (!existsSync(pkgPath)) {
        continue;
      }
      const pkg = (await loadPackageJson(pkgPath)) as PackageJson | null;
      const pkgDeps = getAllDeps(pkg);
      for (const name of Object.keys(pkgDeps)) {
        if (name.startsWith('@pie-lib/')) {
          deps.add(name.replace('@pie-lib/', ''));
        }
      }
    }

    return await this.expandPieLibDeps(config, Array.from(deps));
  }

  private async expandPieLibDeps(config: SyncConfig, initial: string[]): Promise<string[]> {
    const seen = new Set<string>();
    const queue = [...initial];

    while (queue.length > 0) {
      const pkg = queue.shift();
      if (!pkg || seen.has(pkg)) continue;
      seen.add(pkg);

      const pkgPath = join(config.pieLib, 'packages', pkg, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkgJson = (await loadPackageJson(pkgPath)) as PackageJson | null;
      const deps = getAllDeps(pkgJson);
      for (const name of Object.keys(deps)) {
        if (name.startsWith('@pie-lib/')) {
          const depName = name.replace('@pie-lib/', '');
          if (!seen.has(depName)) queue.push(depName);
        }
      }
    }

    return Array.from(seen).sort();
  }

  private async cleanTargetDirectories(config: SyncConfig): Promise<void> {
    if (!config.useEsmFilter || config.dryRun) return;

    // Only remove entire directories when doing a "full compatible sync" (no explicit package filters),
    // otherwise a targeted sync would unexpectedly delete unrelated packages.
    if ((config.syncControllers || config.syncReactComponents) && !config.elementsSpecifiedByUser) {
      const baseDir = join(config.pieElementsNg, 'packages/elements-react');
      if (existsSync(baseDir)) {
        await fsRm(baseDir, { recursive: true, force: true });
        this.logger.info('  🧹 Removed packages/elements-react/ for clean sync');
      }
    }

    if (config.syncPieLibPackages && !config.pieLibPackagesSpecifiedByUser) {
      const baseDir = join(config.pieElementsNg, 'packages/lib-react');
      if (existsSync(baseDir)) {
        await fsRm(baseDir, { recursive: true, force: true });
        this.logger.info('  🧹 Removed packages/lib-react/ for clean sync');
      }
    }
  }

  private async checkViteAvailable(config: SyncConfig): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const child = spawn('bun', ['x', 'vite', '--version'], {
        cwd: config.pieElementsNg,
        stdio: 'pipe',
        env: process.env,
      });
      let output = '';
      child.stdout?.on('data', (data) => {
        output += data.toString();
      });
      child.stderr?.on('data', (data) => {
        output += data.toString();
      });
      child.on('close', (code) => {
        resolve(code === 0);
      });
      child.on('error', () => {
        resolve(false);
      });
    });
  }

  private async rewriteWorkspaceDependencies(config: SyncConfig): Promise<void> {
    this.logger.section('🔧 Rewriting workspace dependencies');

    // Discover available packages in the workspace
    const libReactDir = join(config.pieElementsNg, 'packages/lib-react');
    const elementsReactDir = join(config.pieElementsNg, 'packages/elements-react');

    const availableLibPackages = new Set<string>();
    const availableElementPackages = new Set<string>();

    if (existsSync(libReactDir)) {
      const libPackages = await readdir(libReactDir);
      for (const pkg of libPackages) {
        if (existsSync(join(libReactDir, pkg, 'package.json'))) {
          availableLibPackages.add(pkg);
        }
      }
    }

    if (existsSync(elementsReactDir)) {
      const elementPackages = await readdir(elementsReactDir);
      for (const pkg of elementPackages) {
        if (existsSync(join(elementsReactDir, pkg, 'package.json'))) {
          availableElementPackages.add(pkg);
        }
      }
    }

    this.logger.info(`   Found ${availableLibPackages.size} lib-react packages`);
    this.logger.info(`   Found ${availableElementPackages.size} elements-react packages\n`);

    // Scan and rewrite package.json files
    const packagesToCheck = [
      ...Array.from(availableLibPackages).map((pkg) => join(libReactDir, pkg)),
      ...Array.from(availableElementPackages).map((pkg) => join(elementsReactDir, pkg)),
    ];

    let totalRemoved = 0;
    const removedDeps: Array<{ pkg: string; dep: string }> = [];

    for (const pkgPath of packagesToCheck) {
      const pkgJsonPath = join(pkgPath, 'package.json');
      const pkgJson = (await loadPackageJson(pkgJsonPath)) as PackageJson | null;

      if (!pkgJson || !pkgJson.dependencies) {
        continue;
      }

      const pkgName = pkgJson.name || pkgPath;
      let modified = false;
      const depsToRemove: string[] = [];

      for (const [dep, version] of Object.entries(pkgJson.dependencies)) {
        // Only check workspace dependencies
        if (!version.startsWith('workspace:')) {
          continue;
        }

        // Check @pie-lib/* dependencies
        if (dep.startsWith('@pie-lib/')) {
          const libName = dep.replace('@pie-lib/', '');
          if (!availableLibPackages.has(libName)) {
            depsToRemove.push(dep);
            removedDeps.push({ pkg: pkgName, dep });
            modified = true;
          }
        }

        // Check @pie-element/* dependencies
        if (dep.startsWith('@pie-element/')) {
          const elementName = dep.replace('@pie-element/', '');
          if (!availableElementPackages.has(elementName)) {
            depsToRemove.push(dep);
            removedDeps.push({ pkg: pkgName, dep });
            modified = true;
          }
        }
      }

      if (modified) {
        // Remove the invalid dependencies
        for (const dep of depsToRemove) {
          delete pkgJson.dependencies[dep];
          totalRemoved++;
        }

        // Write back the modified package.json
        const fs = await import('node:fs/promises');
        await fs.writeFile(pkgJsonPath, JSON.stringify(pkgJson, null, 2) + '\n', 'utf-8');
      }
    }

    if (totalRemoved > 0) {
      this.logger.info(`   Removed ${totalRemoved} invalid workspace dependencies:\n`);
      for (const { pkg, dep } of removedDeps) {
        this.logger.info(`   - ${dep} from ${pkg}`);
      }
      this.log('');
    } else {
      this.logger.info('   ✓ All workspace dependencies are valid\n');
    }

    // Run bun install to update the lockfile
    this.logger.info('   Running bun install to update lockfile...');
    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn('bun', ['install'], {
        cwd: config.pieElementsNg,
        stdio: 'inherit',
        env: process.env,
      });
      child.on('close', (code) => resolve(code ?? 1));
      child.on('error', () => resolve(1));
    });

    if (exitCode !== 0) {
      this.logger.warn('   ⚠️  bun install failed');
    } else {
      this.logger.info('   ✓ bun install completed successfully\n');
    }
  }

  private async buildTouchedPackages(config: SyncConfig, result: SyncResult): Promise<void> {
    const rootPkgPath = join(config.pieElementsNg, 'package.json');
    const rootPkg = (await loadPackageJson(rootPkgPath)) as PackageJson | null;
    const workspaces = Array.isArray(rootPkg?.workspaces) ? (rootPkg?.workspaces as string[]) : [];
    const hasElementsReactWorkspace = workspaces.some((ws) =>
      ws.startsWith('packages/elements-react')
    );
    const hasLibReactWorkspace = workspaces.some((ws) => ws.startsWith('packages/lib-react'));

    const elementFilters = Array.from(this.touchedElementPackages)
      .sort()
      .map((el) => `--filter=@pie-element/${el}`);
    const pieLibFilters = Array.from(this.touchedPieLibPackages)
      .sort()
      .map((pkg) => `--filter=@pie-lib/${pkg}`);

    const filters = [...elementFilters, ...pieLibFilters];

    if (
      (elementFilters.length > 0 && !hasElementsReactWorkspace) ||
      (pieLibFilters.length > 0 && !hasLibReactWorkspace)
    ) {
      this.logger.info(
        '🏗️  Build: Skipped (synced packages are not part of the current workspaces)'
      );
      this.logger.info('   Hint: add packages/elements-react/* and/or packages/lib-react/* to');
      this.logger.info('   root workspaces if you want turbo to build them.');
      return;
    }

    if (filters.length === 0) {
      if (config.verbose) {
        this.logger.info('🏗️  Build: Skipped (no touched packages detected)');
      }
      return;
    }

    // Check if vite is available before attempting to build
    const viteAvailable = await this.checkViteAvailable(config);
    if (!viteAvailable) {
      this.logger.warn(
        '🏗️  Build: Skipped (vite not found). Run "bun install" to install dependencies, then "bun run build" manually.'
      );
      return;
    }

    this.logger.section('🏗️  Building touched packages');
    this.logger.info(`   Filters: ${filters.join(' ')}\n`);

    // turbo filters are passed through the root build script:
    // package.json: "build": "turbo run build"
    // bun run requires `--` to forward args to the script.
    const args = ['run', 'build', '--', ...filters];

    const exitCode = await new Promise<number>((resolve) => {
      const child = spawn('bun', args, {
        cwd: config.pieElementsNg,
        stdio: 'inherit',
        env: process.env,
      });
      child.on('close', (code) => resolve(code ?? 1));
      child.on('error', () => resolve(1));
    });

    if (exitCode !== 0) {
      const errorMsg = `Build failed (exit code ${exitCode}). This may be due to missing dependencies. Run 'bun install' to install new devDependencies, then 'bun run build' manually.`;
      if (config.skipBuild) {
        this.logger.warn(`  ⚠️  ${errorMsg}`);
      } else {
        result.errors.push(errorMsg);
      }
    }
  }
}
