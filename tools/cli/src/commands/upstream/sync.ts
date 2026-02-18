import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { loadCompatibilityReport, type CompatibilityReport } from '../../utils/compatibility.js';
import { getCurrentCommit } from '../../utils/git.js';
import { printSyncSummary, createEmptySummary } from '../../lib/upstream/sync-summary.js';
import { loadPackageJson, writePackageJson, type PackageJson } from '../../utils/package-json.js';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, stat as fsStat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { readdir } from '../../lib/upstream/sync-filesystem.js';
import { getAllDeps } from '../../lib/upstream/sync-package-json.js';
import { ControllersStrategy } from '../../lib/upstream/sync-controllers-strategy.js';
import { ReactComponentsStrategy } from '../../lib/upstream/sync-react-strategy.js';
import { PieLibStrategy } from '../../lib/upstream/sync-pielib-strategy.js';
import type { SyncStrategy, SyncContext } from '../../lib/upstream/sync-strategy.js';
import { DEFAULT_PATHS, COMPATIBILITY_FILE, WORKSPACE } from '../../lib/upstream/sync-constants.js';
import { assertReposExist } from '../../lib/upstream/repo-utils.js';
import { addDevelopmentExports } from '../../lib/upstream/sync-dev-exports.js';
import { rewriteRelativeSpecifiersForNodeEsm } from '../../lib/upstream/sync-imports.js';
import {
  analyzePackageDependencyIntegrity,
  collectWorkspacePackageDirs,
  type ImportIntegrityStatus,
} from '../../utils/dependency-integrity.js';

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

interface DependencyIntegrityRegression {
  packageName: string;
  packagePath: string;
  dependency: string;
  status: Exclude<ImportIntegrityStatus, 'direct' | 'transitive'>;
}

interface DependencyAutoFixResult {
  packagesUpdated: number;
  dependenciesAdded: number;
  unresolved: Array<{ packageName: string; dependency: string }>;
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
  private preSyncProblemIntegrityByImport = new Map<string, ImportIntegrityStatus>();

  public async run(): Promise<void> {
    const { flags } = await this.parse(Sync);

    this.logger = new Logger(flags.verbose);

    const config: SyncConfig = {
      pieElements: DEFAULT_PATHS.PIE_ELEMENTS,
      pieLib: DEFAULT_PATHS.PIE_LIB,
      pieElementsNg: DEFAULT_PATHS.PIE_ELEMENTS_NG,
      syncControllers: true,
      syncReactComponents: true,
      syncPieLibPackages: false,
      useEsmFilter: true,
      compatibilityFile: COMPATIBILITY_FILE,
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
    this.preSyncProblemIntegrityByImport = new Map<string, ImportIntegrityStatus>();

    this.logger.section('🔄 Syncing from upstream');
    this.logger.info(`   Source:      ${config.pieElements}`);
    this.logger.info(`   Destination: ${config.pieElementsNg}/packages/`);
    this.logger.info(`   Mode:        ${config.dryRun ? 'DRY RUN' : 'LIVE'}\n`);

    // Apply ESM compatibility filter (also returns report for summary)
    const compatibilityReport = await this.applyEsmFilter(config);

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
    // BUT: Only merge ALL packages when doing a full sync (no specific elements specified)
    // When syncing specific elements, only sync the required deps (don't merge all 23 compat packages)
    if (compatibilityReport?.pieLibPackages && compatibilityReport.pieLibPackages.length > 0) {
      config.syncPieLibPackages = true;
      const autoDeps = new Set(config.pieLibPackages || []);

      // Only merge all compatible packages when doing a full sync
      if (!config.elementsSpecifiedByUser) {
        const compatiblePkgs = compatibilityReport.pieLibPackages;
        const merged = new Set([...autoDeps, ...compatiblePkgs]);
        config.pieLibPackages = Array.from(merged);

        const additionalCount = config.pieLibPackages.length - autoDeps.size;
        if (config.verbose && additionalCount > 0) {
          this.logger.info(
            `   Additional ESM-compatible pie-lib: ${additionalCount} package(s) from compatibility report`
          );
        }
      } else {
        // For targeted element sync, only sync required deps (don't bloat with all 23 packages)
        if (config.verbose && autoDeps.size > 0) {
          this.logger.info(
            `   Targeted sync: ${autoDeps.size} pie-lib package(s) required by ${config.elements?.[0]}`
          );
        }
      }
    }

    // Verify repos exist
    try {
      assertReposExist([{ label: 'pie-elements', path: config.pieElements }]);
    } catch (error) {
      this.logger.error(error instanceof Error ? error.message : String(error));
      this.error('Sync failed', { exit: 1 });
    }

    // Capture current dependency integrity gaps before sync so we only fail on new regressions.
    this.preSyncProblemIntegrityByImport =
      await this.captureCurrentProblemIntegrityBaseline(config);

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
        pieLibPackages: config.pieLibPackages,
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

    // Auto-fix missing direct dependency declarations in touched package manifests.
    // This makes sync resilient to upstream package.json drift.
    if (!config.dryRun) {
      const autoFix = await this.autoFixTouchedPackageDependencyDeclarations(config);
      if (autoFix.unresolved.length > 0) {
        for (const unresolved of autoFix.unresolved) {
          result.warnings.push(
            `Could not infer version for ${unresolved.dependency} in ${unresolved.packageName}`
          );
        }
      }
    }

    // Apply targeted post-sync source patches for known declaration-emit issues.
    if (!config.dryRun) {
      await this.applyPostSyncBuildStabilizers(config);
    }

    // Normalize relative ESM specifiers to explicit .js paths for NodeNext.
    if (!config.dryRun) {
      await this.applyNodeEsmSpecifierRewrites(config);
    }

    // Verify synced packages for dependency integrity regressions (broken/hoist-reliant imports).
    // This catches runtime failures like unresolved "prop-types" and newly introduced hoist reliance.
    if (!config.dryRun) {
      const integrityRegressions = await this.verifyTouchedPackageDependencyIntegrity(config);
      if (integrityRegressions.length > 0) {
        for (const issue of integrityRegressions) {
          result.errors.push(
            `${issue.packageName} (${issue.packagePath}) has new ${issue.status} dependency: ${issue.dependency}`
          );
        }
      }
    }

    // Add development export conditions for HMR support
    if (!config.dryRun && this.touchedElementPackages.size > 0) {
      await this.addDevelopmentExportsToPackages(config);
    }

    // Build by default (unless dry-run or explicitly skipped)
    if (!config.dryRun && !config.skipBuild && result.errors.length === 0) {
      await this.buildTouchedPackages(config, result);
    }

    // Add blocked package counts from compatibility report
    if (compatibilityReport) {
      syncSummary.blockedElements = Object.keys(compatibilityReport.blockedElements).length;
      syncSummary.blockedPieLib = Object.values(compatibilityReport.pieLibDetails).filter(
        (d) => !d.compatible
      ).length;
    }

    // Demo metadata generation removed - demos are now tracked in git
    // and managed directly in this repository (not synced from upstream)

    // Print summary and handle errors
    printSyncSummary(syncSummary, compatibilityReport, config.pieElementsNg, this.logger);

    if (result.warnings.length > 0) {
      this.logger.warn('Sync completed with warnings:');
      for (const warning of result.warnings) {
        this.logger.warn(`  - ${warning}`);
      }
      this.log('');
    }

    if (result.errors.length > 0) {
      this.error('Sync completed with errors', { exit: 1 });
    }
  }

  private async applyEsmFilter(config: SyncConfig): Promise<CompatibilityReport | null> {
    if (!config.useEsmFilter) {
      return null;
    }

    let report: CompatibilityReport | null = null;
    try {
      report = await loadCompatibilityReport(config.compatibilityFile);
    } catch (error) {
      this.logger.warn(`⚠️  ESM compatibility file not found at ${config.compatibilityFile}`);
      this.logger.warn('   Run: bun cli upstream:analyze-esm to generate it');
      this.logger.warn('   Proceeding without ESM filter...\n');
      return null;
    }

    if (!report) {
      return null;
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

    return report;
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
        if (name.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
          deps.add(name.replace(WORKSPACE.PIE_LIB_PREFIX, ''));
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
        if (name.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
          const depName = name.replace(WORKSPACE.PIE_LIB_PREFIX, '');
          if (!seen.has(depName)) queue.push(depName);
        }
      }
    }

    return Array.from(seen).sort();
  }

  private async cleanTargetDirectories(config: SyncConfig): Promise<void> {
    if (!config.useEsmFilter || config.dryRun) return;

    // NOTE: We intentionally do NOT delete the entire packages/elements-react/ directory
    // because that would delete locally-maintained content like docs/demo/config.mjs files.
    // Instead, each sync strategy (ReactComponentsStrategy, PieLibStrategy, etc.) handles
    // cleaning individual package directories while preserving specific subdirectories
    // (like docs/ and controller/).
    //
    // This approach ensures:
    // 1. Demo configs (docs/demo/*.mjs) are preserved across syncs
    // 2. Controllers (src/controller/) are preserved during React component sync
    // 3. Only the files that need updating are touched
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

  private async verifyTouchedPackageDependencyIntegrity(
    config: SyncConfig
  ): Promise<DependencyIntegrityRegression[]> {
    this.logger.section('🔎 Verifying dependency integrity regressions');

    const packageDirs: string[] = [];
    for (const element of this.touchedElementPackages) {
      packageDirs.push(join(config.pieElementsNg, 'packages/elements-react', element));
    }
    for (const pieLib of this.touchedPieLibPackages) {
      packageDirs.push(join(config.pieElementsNg, 'packages/lib-react', pieLib));
    }

    if (packageDirs.length === 0) {
      this.logger.info('   No touched packages to verify\n');
      return [];
    }

    const regressions: DependencyIntegrityRegression[] = [];
    let existingIssuesIgnored = 0;

    for (const packageDir of packageDirs) {
      const analysis = await analyzePackageDependencyIntegrity(packageDir);
      if (!analysis) {
        continue;
      }

      for (const issue of analysis.issues) {
        if (issue.status !== 'broken' && issue.status !== 'hoist') {
          continue;
        }

        const key = this.integrityIssueKey(analysis.packageName, issue.dependency);
        const previous = this.preSyncProblemIntegrityByImport.get(key);

        if (previous === issue.status) {
          existingIssuesIgnored++;
          continue;
        }

        regressions.push({
          packageName: analysis.packageName,
          packagePath: analysis.packagePath,
          dependency: issue.dependency,
          status: issue.status,
        });
      }
    }

    if (regressions.length === 0) {
      if (existingIssuesIgnored > 0) {
        this.logger.info(
          `   ✓ No new broken/hoist regressions (ignored ${existingIssuesIgnored} pre-existing issue(s))\n`
        );
      } else {
        this.logger.info(`   ✓ No broken/hoist dependency integrity regressions\n`);
      }
      return [];
    }

    this.logger.error(`   Found ${regressions.length} new dependency integrity regression(s):\n`);
    for (const regression of regressions) {
      this.logger.error(
        `   - ${regression.packageName}: ${regression.status} -> ${regression.dependency}`
      );
    }
    this.log('');

    return regressions;
  }

  private async captureCurrentProblemIntegrityBaseline(
    config: SyncConfig
  ): Promise<Map<string, ImportIntegrityStatus>> {
    const baseline = new Map<string, ImportIntegrityStatus>();
    const packageDirs = await collectWorkspacePackageDirs(config.pieElementsNg);

    for (const packageDir of packageDirs) {
      const analysis = await analyzePackageDependencyIntegrity(packageDir);
      if (!analysis) {
        continue;
      }

      for (const issue of analysis.issues) {
        if (issue.status === 'broken' || issue.status === 'hoist') {
          baseline.set(
            this.integrityIssueKey(analysis.packageName, issue.dependency),
            issue.status
          );
        }
      }
    }

    return baseline;
  }

  private integrityIssueKey(packageName: string, dependency: string): string {
    return `${packageName}::${dependency}`;
  }

  private async autoFixTouchedPackageDependencyDeclarations(
    config: SyncConfig
  ): Promise<DependencyAutoFixResult> {
    this.logger.section('🛠️  Auto-fixing dependency declarations');

    const packageDirs = this.getTouchedPackageDirs(config);
    if (packageDirs.length === 0) {
      this.logger.info('   No touched packages to auto-fix\n');
      return { packagesUpdated: 0, dependenciesAdded: 0, unresolved: [] };
    }

    const catalog = await this.buildDependencyVersionCatalog(config.pieElementsNg);
    let packagesUpdated = 0;
    let dependenciesAdded = 0;
    const unresolved: Array<{ packageName: string; dependency: string }> = [];

    for (const packageDir of packageDirs) {
      const analysis = await analyzePackageDependencyIntegrity(packageDir);
      if (!analysis) continue;

      const pkgJsonPath = join(packageDir, 'package.json');
      const pkgJson = (await loadPackageJson(pkgJsonPath)) as PackageJson | null;
      if (!pkgJson) continue;

      const declared = new Set<string>([
        ...Object.keys(pkgJson.dependencies || {}),
        ...Object.keys(pkgJson.devDependencies || {}),
        ...Object.keys((pkgJson.peerDependencies as Record<string, string> | undefined) || {}),
        ...Object.keys((pkgJson.optionalDependencies as Record<string, string> | undefined) || {}),
      ]);

      let modified = false;
      if (!pkgJson.dependencies) {
        pkgJson.dependencies = {};
      }

      for (const issue of analysis.issues) {
        const dep = issue.dependency;
        if (declared.has(dep)) {
          continue;
        }

        const version = this.resolveDependencyVersion(config, dep, catalog);
        if (!version) {
          unresolved.push({ packageName: analysis.packageName, dependency: dep });
          continue;
        }

        pkgJson.dependencies[dep] = version;
        declared.add(dep);
        modified = true;
        dependenciesAdded++;
      }

      if (modified) {
        await writePackageJson(pkgJsonPath, pkgJson);
        packagesUpdated++;
      }
    }

    if (dependenciesAdded === 0 && unresolved.length === 0) {
      this.logger.info('   ✓ No missing declarations detected in touched packages\n');
      return { packagesUpdated, dependenciesAdded, unresolved };
    }

    if (dependenciesAdded > 0) {
      this.logger.info(
        `   ✓ Added ${dependenciesAdded} dependency declaration(s) in ${packagesUpdated} package(s)`
      );
    }
    if (unresolved.length > 0) {
      this.logger.warn(`   Could not infer ${unresolved.length} dependency version(s)`);
    }
    this.log('');

    return { packagesUpdated, dependenciesAdded, unresolved };
  }

  private getTouchedPackageDirs(config: SyncConfig): string[] {
    const dirs: string[] = [];
    for (const element of this.touchedElementPackages) {
      dirs.push(join(config.pieElementsNg, 'packages/elements-react', element));
    }
    for (const pieLib of this.touchedPieLibPackages) {
      dirs.push(join(config.pieElementsNg, 'packages/lib-react', pieLib));
    }
    return dirs.sort();
  }

  private async buildDependencyVersionCatalog(rootDir: string): Promise<Map<string, string>> {
    const catalog = new Map<string, string>();

    const addVersions = (record?: Record<string, string>) => {
      if (!record) return;
      for (const [name, version] of Object.entries(record)) {
        if (!catalog.has(name)) {
          catalog.set(name, version);
        }
      }
    };

    // Root package.json has the canonical versions we prefer.
    const rootPkgPath = join(rootDir, 'package.json');
    if (existsSync(rootPkgPath)) {
      const rootPkg = (await loadPackageJson(rootPkgPath)) as PackageJson | null;
      if (rootPkg) {
        addVersions(rootPkg.dependencies as Record<string, string> | undefined);
        addVersions(rootPkg.devDependencies as Record<string, string> | undefined);
      }
    }

    // Add versions seen across workspace package manifests as fallback.
    const workspacePackageDirs = await collectWorkspacePackageDirs(rootDir);
    for (const packageDir of workspacePackageDirs) {
      const pkgPath = join(packageDir, 'package.json');
      if (!existsSync(pkgPath)) continue;
      const pkg = (await loadPackageJson(pkgPath)) as PackageJson | null;
      if (!pkg) continue;
      addVersions(pkg.dependencies as Record<string, string> | undefined);
      addVersions(pkg.devDependencies as Record<string, string> | undefined);
      addVersions(pkg.peerDependencies as Record<string, string> | undefined);
      addVersions(pkg.optionalDependencies as Record<string, string> | undefined);
    }

    return catalog;
  }

  private resolveDependencyVersion(
    config: SyncConfig,
    dep: string,
    catalog: Map<string, string>
  ): string | null {
    const fallbackVersions: Record<string, string> = {
      'js-combinatorics': '^2.1.2',
      '@testing-library/react': '^16.3.0',
    };

    // Internal workspace packages should stay workspace-linked.
    if (dep.startsWith('@pie-lib/')) {
      const libName = dep.replace('@pie-lib/', '');
      const localPath = join(config.pieElementsNg, 'packages/lib-react', libName, 'package.json');
      if (existsSync(localPath)) {
        return 'workspace:*';
      }
    }

    if (dep.startsWith('@pie-element/')) {
      const elementName = dep.replace('@pie-element/', '');
      const elementPath = join(
        config.pieElementsNg,
        'packages/elements-react',
        elementName,
        'package.json'
      );
      if (existsSync(elementPath)) {
        return 'workspace:*';
      }

      // Shared packages map @pie-element/shared-foo -> packages/shared/foo.
      if (elementName.startsWith('shared-')) {
        const sharedName = elementName.replace('shared-', '');
        const sharedPath = join(
          config.pieElementsNg,
          'packages/shared',
          sharedName,
          'package.json'
        );
        if (existsSync(sharedPath)) {
          return 'workspace:*';
        }
      }
    }

    return catalog.get(dep) || fallbackVersions[dep] || null;
  }

  private async applyPostSyncBuildStabilizers(config: SyncConfig): Promise<void> {
    // @pie-lib/test-utils currently syncs JS that converts to TS with untyped exported render helpers.
    // During declaration emit this can trigger TS2742 (non-portable inferred type paths).
    // We patch signatures post-sync so upstream:update remains reliable.
    const testUtilsIndex = join(
      config.pieElementsNg,
      'packages/lib-react/test-utils/src/index.tsx'
    );
    if (!existsSync(testUtilsIndex)) {
      return;
    }

    let content = await readFile(testUtilsIndex, 'utf-8');
    let changed = false;

    const oldImport = "import { render } from '@testing-library/react';";
    const newImport =
      "import { render, type RenderOptions, type RenderResult } from '@testing-library/react';";
    if (content.includes(oldImport)) {
      content = content.replace(oldImport, newImport);
      changed = true;
    }

    const oldThemeFn = 'export function renderWithTheme(ui, options = {}) {';
    const newThemeFn =
      'export function renderWithTheme(ui: React.ReactElement, options: RenderOptions & { theme?: unknown } = {}): RenderResult {';
    if (content.includes(oldThemeFn)) {
      content = content.replace(oldThemeFn, newThemeFn);
      changed = true;
    }

    const oldProvidersFn = 'export function renderWithProviders(ui, options = {}) {';
    const newProvidersFn =
      'export function renderWithProviders(ui: React.ReactElement, options: RenderOptions & { theme?: unknown; providers?: React.ComponentType<{ children?: React.ReactNode }>[] } = {}): RenderResult {';
    if (content.includes(oldProvidersFn)) {
      content = content.replace(oldProvidersFn, newProvidersFn);
      changed = true;
    }

    if (changed) {
      await writeFile(testUtilsIndex, content, 'utf-8');
      this.logger.info('   ✓ Applied post-sync declaration fix for @pie-lib/test-utils');
    }
  }

  private async applyNodeEsmSpecifierRewrites(config: SyncConfig): Promise<void> {
    this.logger.section('🔧 Rewriting relative ESM specifiers');

    const packageDirs = this.getTouchedPackageDirs(config);
    if (packageDirs.length === 0) {
      this.logger.info('   No touched packages to rewrite\n');
      return;
    }

    let checkedFiles = 0;
    let rewrittenFiles = 0;

    for (const packageDir of packageDirs) {
      const sourceDir = join(packageDir, 'src');
      const sourceFiles = await this.collectTypeScriptSourceFiles(sourceDir);
      for (const filePath of sourceFiles) {
        checkedFiles++;
        if (await rewriteRelativeSpecifiersForNodeEsm(filePath)) {
          rewrittenFiles++;
        }
      }
    }

    if (rewrittenFiles === 0) {
      this.logger.info(`   ✓ Specifiers already normalized (${checkedFiles} file(s) checked)\n`);
      return;
    }

    this.logger.info(`   ✓ Rewrote ${rewrittenFiles} file(s) out of ${checkedFiles} checked\n`);
  }

  private async collectTypeScriptSourceFiles(dir: string): Promise<string[]> {
    if (!existsSync(dir)) {
      return [];
    }

    const files: string[] = [];
    const items = await readdir(dir);
    for (const item of items) {
      const fullPath = join(dir, item);
      const stats = await fsStat(fullPath);
      if (stats.isDirectory()) {
        files.push(...(await this.collectTypeScriptSourceFiles(fullPath)));
        continue;
      }

      if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private async rewriteWorkspaceDependencies(config: SyncConfig): Promise<void> {
    this.logger.section('🔧 Rewriting workspace dependencies');

    // Discover available packages in the workspace
    const libReactDir = join(config.pieElementsNg, 'packages/lib-react');
    const elementsReactDir = join(config.pieElementsNg, 'packages/elements-react');
    const sharedDir = join(config.pieElementsNg, 'packages/shared');

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

    // Also scan shared packages - these are @pie-element/shared-* packages
    if (existsSync(sharedDir)) {
      const sharedPackages = await readdir(sharedDir);
      for (const pkg of sharedPackages) {
        if (existsSync(join(sharedDir, pkg, 'package.json'))) {
          // Shared packages use the pattern @pie-element/shared-{name}
          // But the directory is just {name}, so we need to add the "shared-" prefix
          availableElementPackages.add(`shared-${pkg}`);
        }
      }
    }

    this.logger.info(`   Found ${availableLibPackages.size} lib-react packages`);
    this.logger.info(
      `   Found ${availableElementPackages.size} elements-react packages (including shared)\n`
    );

    // Scan and rewrite package.json files
    const packagesToCheck: string[] = [];

    // Add lib-react packages
    for (const pkg of availableLibPackages) {
      packagesToCheck.push(join(libReactDir, pkg));
    }

    // Add elements-react packages (non-shared)
    if (existsSync(elementsReactDir)) {
      const elementPackages = await readdir(elementsReactDir);
      for (const pkg of elementPackages) {
        if (existsSync(join(elementsReactDir, pkg, 'package.json'))) {
          packagesToCheck.push(join(elementsReactDir, pkg));
        }
      }
    }

    // Note: We don't check shared packages because they are managed separately
    // and don't have dependencies on synced packages

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
        if (dep.startsWith(WORKSPACE.PIE_LIB_PREFIX)) {
          const libName = dep.replace(WORKSPACE.PIE_LIB_PREFIX, '');
          if (!availableLibPackages.has(libName)) {
            depsToRemove.push(dep);
            removedDeps.push({ pkg: pkgName, dep });
            modified = true;
          }
        }

        // Check @pie-element/* dependencies
        if (dep.startsWith(WORKSPACE.PIE_ELEMENT_PREFIX)) {
          const elementName = dep.replace(WORKSPACE.PIE_ELEMENT_PREFIX, '');
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

  private async addDevelopmentExportsToPackages(config: SyncConfig): Promise<void> {
    this.logger.section('🔧 Adding development export conditions');

    const elementsDir = join(config.pieElementsNg, 'packages/elements-react');
    const packageNames = Array.from(this.touchedElementPackages);

    if (packageNames.length === 0) {
      this.logger.debug('   No element packages to process');
      return;
    }

    const updated = await addDevelopmentExports(elementsDir, packageNames, this.logger);

    if (updated > 0) {
      this.logger.info(`   ✓ Added development exports to ${updated} package(s)\n`);
    } else {
      this.logger.debug('   → No changes needed\n');
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
    // Always use --force to disable Turbo cache for consistency
    const args = ['run', 'build', '--', '--force', ...filters];

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
