import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { loadCompatibilityReport } from '../../utils/compatibility.js';
import { convertJsToTs, convertJsxToTsx } from '../../utils/conversion.js';
import { getCurrentCommit } from '../../utils/git.js';
import { loadPackageJson, writePackageJson, type PackageJson } from '../../utils/package-json.js';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  cp,
  mkdir,
  readFile,
  readdir as fsReaddir,
  rm as fsRm,
  writeFile,
  stat as fsStat,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

interface SyncConfig {
  pieElements: string;
  pieLib: string;
  pieElementsNg: string;

  // What to sync
  syncControllers: boolean;
  syncReactComponents: boolean;
  syncPieLibPackages: boolean;
  syncDemos: boolean;

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
    '<%= config.bin %> <%= command.id %> --element=multiple-choice --react',
    '<%= config.bin %> <%= command.id %> --react',
    '<%= config.bin %> <%= command.id %> --pie-lib',
    '<%= config.bin %> <%= command.id %> --pie-lib-package=render-ui',
    '<%= config.bin %> <%= command.id %> --all',
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
      description: 'Sync only specified element',
    }),
    react: Flags.boolean({
      description: 'Sync React components instead of controllers',
      default: false,
    }),
    'pie-lib': Flags.boolean({
      description: 'Sync @pie-lib packages',
      default: false,
    }),
    'pie-lib-package': Flags.string({
      description: 'Sync only specified @pie-lib package',
    }),
    'no-esm-filter': Flags.boolean({
      description: 'Disable ESM compatibility filtering',
      default: false,
    }),
    all: Flags.boolean({
      description: 'Sync all elements (ignores ESM filter)',
      default: false,
    }),
    'no-package-json-rewrite': Flags.boolean({
      description: 'Do not create/update package.json files to ensure ESM module support',
      default: false,
    }),
    'skip-build': Flags.boolean({
      description: 'Skip running a build after syncing (sync runs build by default)',
      default: false,
    }),
    'no-demo': Flags.boolean({
      description: 'Do not sync upstream docs/demo folders for touched elements',
      default: false,
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
      syncReactComponents: false,
      syncPieLibPackages: false,
      syncDemos: !flags['no-demo'],
      useEsmFilter: !flags['no-esm-filter'] && !flags.all,
      compatibilityFile: './esm-compatible-elements.json',
      dryRun: flags['dry-run'],
      verbose: flags.verbose,
      rewritePackageJson: !flags['no-package-json-rewrite'],
      skipBuild: flags['skip-build'],
      elementsSpecifiedByUser: !!flags.element,
      pieLibPackagesSpecifiedByUser: !!flags['pie-lib-package'],
    };

    // Configure what to sync
    if (flags.react) {
      config.syncReactComponents = true;
      config.syncControllers = false;
    }

    if (flags['pie-lib'] || flags['pie-lib-package']) {
      config.syncPieLibPackages = true;
      config.syncControllers = false;
      config.syncReactComponents = false;
      config.syncDemos = false;
    }

    // Configure filters
    if (flags.element) {
      config.elements = [flags.element];
    }

    if (flags['pie-lib-package']) {
      config.pieLibPackages = [flags['pie-lib-package']];
    }

    const result = await this.syncUpstream(config);
    this.generateReport(result);

    if (result.errors.length > 0) {
      this.error('Sync completed with errors', { exit: 1 });
    }
  }

  private async syncUpstream(config: SyncConfig): Promise<SyncResult> {
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

    // Apply ESM compatibility filter
    await this.applyEsmFilter(config);

    // Verify repos exist
    if (!existsSync(config.pieElements)) {
      result.errors.push(`pie-elements not found at ${config.pieElements}`);
      return result;
    }

    // Clean stale targets first (prevents leftover packages/files from older sync runs)
    await this.cleanStaleTargets(config);

    if (config.syncControllers) {
      await this.syncControllers(config, result);
    }

    if (config.syncReactComponents) {
      await this.syncReactComponents(config, result);
    }

    if (config.syncDemos) {
      await this.syncDemos(config, result);
    }

    if (config.syncPieLibPackages) {
      await this.syncPieLibPackages(config, result);
    }

    // Build by default (unless dry-run or explicitly skipped)
    if (!config.dryRun && !config.skipBuild) {
      await this.buildTouchedPackages(config, result);
    }

    return result;
  }

  private async syncDemos(config: SyncConfig, result: SyncResult): Promise<void> {
    this.logger.section('🧪 Syncing upstream demos (docs/demo)');

    if (this.touchedElementPackages.size === 0) {
      if (config.verbose) {
        this.logger.info('  ⏭️  No touched elements; skipping demo sync');
      }
      return;
    }

    for (const pkg of this.touchedElementPackages) {
      const upstreamDemoDir = join(config.pieElements, 'packages', pkg, 'docs/demo');
      if (!existsSync(upstreamDemoDir)) {
        result.warnings.push(`${pkg}: no docs/demo found upstream (skipped)`);
        if (config.verbose) {
          this.logger.info(`  ⏭️  ${pkg}: no docs/demo found`);
        }
        continue;
      }

      // Best-effort extraction of tagName from config.js (used for log output only).
      const upstreamConfigPath = join(upstreamDemoDir, 'config.js');
      let tagName = pkg;
      if (existsSync(upstreamConfigPath)) {
        const raw = await readFile(upstreamConfigPath, 'utf-8');
        const match = raw.match(/elements\\s*:\\s*\\{[\\s\\S]*?['"]([^'"]+)['"]\\s*:/m);
        if (match?.[1]) {
          tagName = match[1];
        }
      }

      // Store demos under the element package name so we can resolve local sources later.
      const baseDir = join(config.pieElementsNg, 'apps/demos-data', pkg);
      const targetRawDir = join(baseDir, 'raw');

      // Clean target first so removed upstream demo files don't linger.
      if (!config.dryRun) {
        await fsRm(baseDir, { recursive: true, force: true });
        await mkdir(dirname(targetRawDir), { recursive: true });
      }

      result.filesChecked++;
      if (config.dryRun) {
        this.logger.success(`  🔍 ${pkg}: would sync docs/demo → apps/demos-data/${tagName}/raw`);
        continue;
      }

      await mkdir(targetRawDir, { recursive: true });
      await cp(upstreamDemoDir, targetRawDir, { recursive: true });
      result.filesCopied++;
      this.logger.success(`  ✨ ${pkg}: synced docs/demo → apps/demos-data/${pkg}/raw (tag: ${tagName})`);
    }
  }

  private async applyEsmFilter(config: SyncConfig): Promise<void> {
    if (!config.useEsmFilter) {
      return;
    }

    const report = await loadCompatibilityReport(config.compatibilityFile);

    if (!report) {
      this.logger.warn(`⚠️  ESM compatibility file not found at ${config.compatibilityFile}`);
      this.logger.warn('   Run: bun run cli upstream:analyze-esm to generate it');
      this.logger.warn('   Proceeding without ESM filter...\n');
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

  private async syncControllers(config: SyncConfig, result: SyncResult): Promise<void> {
    this.logger.section('📦 Syncing controllers');

    const upstreamElementsDir = join(config.pieElements, 'packages');
    const targetBaseDir = join(config.pieElementsNg, 'packages/elements-react');

    const upstreamCommit = getCurrentCommit(config.pieElements);
    const syncDate = new Date().toISOString().split('T')[0];

    const packages = await this.readdir(upstreamElementsDir);

    for (const pkg of packages) {
      if (config.elements && !config.elements.includes(pkg)) {
        continue;
      }

      // Check if controller exists upstream
      const controllerPath = join(upstreamElementsDir, pkg, 'controller/src/index.js');
      if (!existsSync(controllerPath)) {
        if (config.verbose) {
          this.logger.info(`  ⏭️  ${pkg}: No controller found`);
        }
        continue;
      }

      result.filesChecked++;

      // Target: packages/elements-react/{element}/src/controller/index.ts
      const targetDir = join(targetBaseDir, pkg, 'src/controller');
      const targetPath = join(targetDir, 'index.ts');

      // Clean target controller subtree first so removed upstream files don't linger
      await this.cleanTargetDir(config, targetDir, `elements-react/${pkg}/src/controller`);

      // Read source
      const sourceContent = await readFile(controllerPath, 'utf-8');

      // Convert JS to TS
      const { code: converted } = convertJsToTs(sourceContent, {
        sourcePath: `pie-elements/packages/${pkg}/controller/src/index.js`,
        commit: upstreamCommit,
        date: syncDate,
      });

      let elementChanged = false;

      // Sync index.ts
      const isNew = !existsSync(targetPath);
      if (!isNew) {
        const currentContent = await readFile(targetPath, 'utf-8');
        if (currentContent === converted) {
          result.filesSkipped++;
          if (config.verbose) {
            this.logger.info(`  ⏭️  ${pkg}: index.ts unchanged`);
          }
        } else {
          result.filesUpdated++;
          elementChanged = true;
          if (!config.dryRun) {
            await mkdir(dirname(targetPath), { recursive: true });
            await writeFile(targetPath, converted, 'utf-8');
          }
        }
      } else {
        result.filesCopied++;
        elementChanged = true;
        if (!config.dryRun) {
          await mkdir(dirname(targetPath), { recursive: true });
          await writeFile(targetPath, converted, 'utf-8');
        }
      }

      // Also sync related files (defaults.js, utils.js)
      const relatedFiles = ['defaults.js', 'utils.js'];
      for (const file of relatedFiles) {
        const relatedPath = join(upstreamElementsDir, pkg, 'controller/src', file);
        if (existsSync(relatedPath)) {
          const relatedTarget = join(targetDir, file.replace('.js', '.ts'));
          const relatedContent = await readFile(relatedPath, 'utf-8');
          const { code: relatedConverted } = convertJsToTs(relatedContent, {
            sourcePath: `pie-elements/packages/${pkg}/controller/src/${file}`,
            commit: upstreamCommit,
            date: syncDate,
          });

          const relatedIsNew = !existsSync(relatedTarget);
          if (!relatedIsNew) {
            const currentRelated = await readFile(relatedTarget, 'utf-8');
            if (currentRelated === relatedConverted) {
              result.filesSkipped++;
              continue;
            }
            result.filesUpdated++;
            elementChanged = true;
          } else {
            result.filesCopied++;
            elementChanged = true;
          }

          if (!config.dryRun) {
            await mkdir(dirname(relatedTarget), { recursive: true });
            await writeFile(relatedTarget, relatedConverted, 'utf-8');
          }
        }
      }

      // Ensure package.json has ESM module support (even in controller-only sync)
      let wrotePkgJson = false;
      if (config.rewritePackageJson) {
        const elementDir = join(targetBaseDir, pkg);
        wrotePkgJson = await this.ensureElementPackageJson(config, pkg, elementDir);
      }

      if (elementChanged || wrotePkgJson) {
        if (!config.dryRun) {
          this.logger.success(`  🔄 ${pkg}: controller package updated`);
        }
        this.touchedElementPackages.add(pkg);
      }
    }
  }

  private async syncReactComponents(config: SyncConfig, result: SyncResult): Promise<void> {
    this.logger.section('⚛️  Syncing React components');

    const upstreamElementsDir = join(config.pieElements, 'packages');
    const targetBaseDir = join(config.pieElementsNg, 'packages/elements-react');

    const upstreamCommit = getCurrentCommit(config.pieElements);
    const syncDate = new Date().toISOString().split('T')[0];

    const packages = await this.readdir(upstreamElementsDir);

    for (const pkg of packages) {
      if (config.elements && !config.elements.includes(pkg)) {
        continue;
      }

      // Check if React component exists upstream (src/ directory)
      const componentSrcDir = join(upstreamElementsDir, pkg, 'src');
      if (!existsSync(componentSrcDir)) {
        if (config.verbose) {
          this.logger.info(`  ⏭️  ${pkg}: No src/ directory found`);
        }
        continue;
      }

      // Target: packages/elements-react/{element}/src/
      const targetDir = join(targetBaseDir, pkg);
      const targetSrcDir = join(targetDir, 'src');

      // Clean target src subtree first so removed upstream files don't linger
      await this.cleanTargetDir(config, targetSrcDir, `elements-react/${pkg}/src`);

      // Recursively sync all files from src/ directory
      const beforeChanges = result.filesCopied + result.filesUpdated;
      let elementFilesProcessed = await this.syncDirectory(
        componentSrcDir,
        targetSrcDir,
        'src',
        pkg,
        config,
        result,
        upstreamCommit,
        syncDate
      );

      // Also sync configure/src/ if it exists
      const configureSrcDir = join(upstreamElementsDir, pkg, 'configure/src');
      if (existsSync(configureSrcDir)) {
        const targetConfigureDir = join(targetDir, 'src/configure');
        const configureFilesProcessed = await this.syncDirectory(
          configureSrcDir,
          targetConfigureDir,
          'configure/src',
          pkg,
          config,
          result,
          upstreamCommit,
          syncDate
        );
        elementFilesProcessed += configureFilesProcessed;
      }
      const afterChanges = result.filesCopied + result.filesUpdated;
      const elementChanged = afterChanges > beforeChanges;

      if (elementFilesProcessed > 0) {
        const statusEmoji = config.dryRun ? '🔍' : '✨';
        this.logger.success(
          `  ${statusEmoji} ${pkg}: ${elementFilesProcessed} file(s) ${config.dryRun ? 'would be synced' : 'synced'}`
        );
      }

      // Ensure package.json has ESM module support and expected exports
      let wrotePkgJson = false;
      if (config.rewritePackageJson) {
        const elementDir = join(targetBaseDir, pkg);
        wrotePkgJson = await this.ensureElementPackageJson(config, pkg, elementDir);
      }

      if (elementChanged || wrotePkgJson) {
        this.touchedElementPackages.add(pkg);
      }
    }
  }

  private async syncPieLibPackages(config: SyncConfig, result: SyncResult): Promise<void> {
    this.logger.section('📚 Syncing @pie-lib packages');

    const upstreamLibDir = join(config.pieLib, 'packages');
    const targetBaseDir = join(config.pieElementsNg, 'packages/lib-react');

    // Verify pie-lib exists
    if (!existsSync(upstreamLibDir)) {
      result.errors.push(`pie-lib packages not found at ${upstreamLibDir}`);
      return;
    }

    const upstreamCommit = getCurrentCommit(config.pieLib);
    const syncDate = new Date().toISOString().split('T')[0];

    // Get list of packages to sync
    const allPackages = await this.readdir(upstreamLibDir);
    const packagesToSync = config.pieLibPackages || allPackages;

    for (const pkg of packagesToSync) {
      // Skip if package doesn't exist
      const pkgSrcDir = join(upstreamLibDir, pkg, 'src');
      if (!existsSync(pkgSrcDir)) {
        if (config.verbose) {
          this.logger.info(`  ⏭️  ${pkg}: No src/ directory found`);
        }
        continue;
      }

      // Target: packages/lib-react/{package}/src/
      const targetDir = join(targetBaseDir, pkg);
      const targetSrcDir = join(targetDir, 'src');

      // Clean target src subtree first so removed upstream files don't linger
      await this.cleanTargetDir(config, targetSrcDir, `lib-react/${pkg}/src`);

      // Recursively sync all files from src/ directory
      const beforeChanges = result.filesCopied + result.filesUpdated;
      const filesProcessed = await this.syncDirectory(
        pkgSrcDir,
        targetSrcDir,
        'src',
        pkg,
        config,
        result,
        upstreamCommit,
        syncDate
      );
      const afterChanges = result.filesCopied + result.filesUpdated;
      const libChanged = afterChanges > beforeChanges;

      if (filesProcessed > 0) {
        const statusEmoji = config.dryRun ? '🔍' : '✨';
        this.logger.success(
          `  ${statusEmoji} ${pkg}: ${filesProcessed} file(s) ${config.dryRun ? 'would be synced' : 'synced'}`
        );
      }

      // Ensure package.json has ESM module support and expected exports
      let wrotePkgJson = false;
      if (config.rewritePackageJson) {
        wrotePkgJson = await this.ensurePieLibPackageJson(config, pkg, targetDir);
      }

      if (libChanged || wrotePkgJson) {
        this.touchedPieLibPackages.add(pkg);
      }
    }
  }

  private existsAny(paths: string[]): boolean {
    return paths.some((p) => existsSync(p));
  }

  private async cleanTargetDir(
    config: SyncConfig,
    targetDir: string,
    label: string
  ): Promise<void> {
    if (!existsSync(targetDir)) return;

    if (config.dryRun) {
      if (config.verbose) this.logger.info(`  🧹 Would clean ${label}`);
      return;
    }

    await fsRm(targetDir, { recursive: true, force: true });
    if (config.verbose) this.logger.info(`  🧹 Cleaned ${label}`);
  }

  private async cleanStaleTargets(config: SyncConfig): Promise<void> {
    if (!config.useEsmFilter || config.dryRun) return;

    // Only remove stale packages when doing a "full compatible sync" (no explicit package filters),
    // otherwise a targeted sync would unexpectedly delete unrelated packages.
    if ((config.syncControllers || config.syncReactComponents) && !config.elementsSpecifiedByUser) {
      const wanted = new Set(config.elements ?? []);
      if (wanted.size > 0) {
        const baseDir = join(config.pieElementsNg, 'packages/elements-react');
        await this.cleanStalePackageDirs(baseDir, wanted, '@pie-element/', 'elements-react');
      }
    }

    if (config.syncPieLibPackages && !config.pieLibPackagesSpecifiedByUser) {
      const wanted = new Set(config.pieLibPackages ?? []);
      if (wanted.size > 0) {
        const baseDir = join(config.pieElementsNg, 'packages/lib-react');
        await this.cleanStalePackageDirs(baseDir, wanted, '@pie-lib/', 'lib-react');
      }
    }
  }

  private async cleanStalePackageDirs(
    baseDir: string,
    wantedDirNames: Set<string>,
    expectedNamePrefix: string,
    labelPrefix: string
  ): Promise<void> {
    const entries = await this.readdir(baseDir);
    for (const entry of entries) {
      const entryPath = join(baseDir, entry);
      const stat = await fsStat(entryPath).catch(() => null);
      if (!stat?.isDirectory()) continue;

      // Keep wanted packages
      if (wantedDirNames.has(entry)) continue;

      // Safety: only delete packages that look like PIE packages via package.json name
      const pkgJsonPath = join(entryPath, 'package.json');
      if (!existsSync(pkgJsonPath)) continue;

      const pkg = await loadPackageJson(pkgJsonPath).catch(() => null);
      const pkgName = typeof pkg?.name === 'string' ? pkg.name : '';
      if (!pkgName.startsWith(expectedNamePrefix)) continue;

      await fsRm(entryPath, { recursive: true, force: true });
      this.logger.info(
        `  🧹 Removed stale package ${labelPrefix}/${entry} (no longer in current ESM-compatible set)`
      );
    }
  }

  private async ensureElementPackageJson(
    config: SyncConfig,
    elementName: string,
    elementDir: string
  ): Promise<boolean> {
    // Only operate when the element directory exists
    if (!existsSync(elementDir)) {
      return false;
    }

    const pkgPath = join(elementDir, 'package.json');
    const upstreamPkgPath = join(config.pieElements, 'packages', elementName, 'package.json');

    let pkg: PackageJson | null = null;
    if (existsSync(pkgPath)) {
      pkg = await loadPackageJson(pkgPath).catch(() => null);
    }

    const upstreamPkg = existsSync(upstreamPkgPath)
      ? await loadPackageJson(upstreamPkgPath).catch(() => null)
      : null;

    // If missing, generate a minimal package.json based on upstream deps
    if (!pkg) {
      const deps: Record<string, string> = {};
      const upstreamDeps = (upstreamPkg?.dependencies as Record<string, string> | undefined) ?? {};

      for (const [name] of Object.entries(upstreamDeps)) {
        if (name.startsWith('@pie-lib/')) {
          deps[name] = 'workspace:*';
        } else if (name !== 'react' && name !== 'react-dom') {
          deps[name] = '*';
        }
      }

      pkg = {
        name: `@pie-element/${elementName}`,
        private: true,
        version: '0.1.0',
        description:
          (upstreamPkg?.description as string | undefined) ??
          `React implementation of ${elementName} element synced from pie-elements`,
        dependencies: deps,
        peerDependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      };
    }

    // Compute expected exports based on present source entrypoints
    const exportsObj: Record<string, unknown> = {
      ...(typeof pkg.exports === 'object' && pkg.exports
        ? (pkg.exports as Record<string, unknown>)
        : {}),
    };

    exportsObj['.'] = {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    };
    exportsObj['./src/*'] = './src/*';

    const hasDelivery = this.existsAny([
      join(elementDir, 'src/delivery/index.ts'),
      join(elementDir, 'src/delivery/index.tsx'),
      join(elementDir, 'src/delivery/index.js'),
      join(elementDir, 'src/delivery/index.jsx'),
    ]);
    if (hasDelivery) {
      exportsObj['./delivery'] = {
        types: './dist/delivery/index.d.ts',
        default: './dist/delivery/index.js',
      };
    }

    const hasAuthoring = this.existsAny([
      join(elementDir, 'src/authoring/index.ts'),
      join(elementDir, 'src/authoring/index.tsx'),
      join(elementDir, 'src/authoring/index.js'),
      join(elementDir, 'src/authoring/index.jsx'),
    ]);
    if (hasAuthoring) {
      exportsObj['./authoring'] = {
        types: './dist/authoring/index.d.ts',
        default: './dist/authoring/index.js',
      };
    }

    const hasController = this.existsAny([
      join(elementDir, 'src/controller/index.ts'),
      join(elementDir, 'src/controller/index.tsx'),
      join(elementDir, 'src/controller/index.js'),
      join(elementDir, 'src/controller/index.jsx'),
    ]);
    if (hasController) {
      exportsObj['./controller'] = {
        types: './dist/controller/index.d.ts',
        default: './dist/controller/index.js',
      };
    }

    const hasConfigure = this.existsAny([
      join(elementDir, 'src/configure/index.ts'),
      join(elementDir, 'src/configure/index.tsx'),
      join(elementDir, 'src/configure/index.js'),
      join(elementDir, 'src/configure/index.jsx'),
    ]);
    if (hasConfigure) {
      exportsObj['./configure'] = {
        types: './dist/configure/index.d.ts',
        default: './dist/configure/index.js',
      };
    }

    pkg.name = `@pie-element/${elementName}`;
    pkg.type = 'module';
    pkg.main = './dist/index.js';
    pkg.types = './dist/index.d.ts';
    pkg.exports = exportsObj;

    // Ensure files includes dist/src (without removing existing entries)
    const files = Array.isArray(pkg.files) ? (pkg.files as unknown[]) : [];
    const normalizedFiles = new Set<string>(
      files.filter((v): v is string => typeof v === 'string')
    );
    normalizedFiles.add('dist');
    normalizedFiles.add('src');
    pkg.files = Array.from(normalizedFiles).sort();

    // Recommend tree-shaking by default unless explicitly set otherwise
    if (typeof pkg.sideEffects === 'undefined') {
      pkg.sideEffects = false;
    }

    if (config.dryRun) {
      this.logger.info(
        `  🔍 ${elementName}: Would ${existsSync(pkgPath) ? 'update' : 'create'} package.json (ESM)`
      );
      return false;
    }

    const nextContent = `${JSON.stringify(pkg, null, 2)}\n`;
    const currentContent = existsSync(pkgPath)
      ? await readFile(pkgPath, 'utf-8').catch(() => null)
      : null;
    if (currentContent === nextContent) {
      return false;
    }

    await writePackageJson(pkgPath, pkg);
    return true;
  }

  private async ensurePieLibPackageJson(
    config: SyncConfig,
    pkgName: string,
    pkgDir: string
  ): Promise<boolean> {
    if (!existsSync(pkgDir)) {
      return false;
    }

    const pkgPath = join(pkgDir, 'package.json');
    const upstreamPkgPath = join(config.pieLib, 'packages', pkgName, 'package.json');

    let pkg: PackageJson | null = null;
    if (existsSync(pkgPath)) {
      pkg = await loadPackageJson(pkgPath).catch(() => null);
    }

    const upstreamPkg = existsSync(upstreamPkgPath)
      ? await loadPackageJson(upstreamPkgPath).catch(() => null)
      : null;

    if (!pkg) {
      // Prefer upstream dependency versions for libs; map internal @pie-lib/* to workspace:*
      const deps: Record<string, string> = {};
      const upstreamDeps = (upstreamPkg?.dependencies as Record<string, string> | undefined) ?? {};
      for (const [name, version] of Object.entries(upstreamDeps)) {
        deps[name] = name.startsWith('@pie-lib/') ? 'workspace:*' : version;
      }

      pkg = {
        name: `@pie-lib/${pkgName}`,
        private: true,
        version: '0.1.0',
        description:
          (upstreamPkg?.description as string | undefined) ??
          `React implementation of @pie-lib/${pkgName} synced from pie-lib`,
        dependencies: deps,
      };
    }

    const exportsObj: Record<string, unknown> = {
      ...(typeof pkg.exports === 'object' && pkg.exports
        ? (pkg.exports as Record<string, unknown>)
        : {}),
    };

    exportsObj['.'] = {
      types: './dist/index.d.ts',
      default: './dist/index.js',
    };
    exportsObj['./src/*'] = './src/*';

    pkg.name = `@pie-lib/${pkgName}`;
    pkg.type = 'module';
    pkg.main = './dist/index.js';
    pkg.types = './dist/index.d.ts';
    pkg.exports = exportsObj;

    const files = Array.isArray(pkg.files) ? (pkg.files as unknown[]) : [];
    const normalizedFiles = new Set<string>(
      files.filter((v): v is string => typeof v === 'string')
    );
    normalizedFiles.add('dist');
    normalizedFiles.add('src');
    pkg.files = Array.from(normalizedFiles).sort();

    if (typeof pkg.sideEffects === 'undefined') {
      pkg.sideEffects = false;
    }

    if (config.dryRun) {
      this.logger.info(
        `  🔍 ${pkgName}: Would ${existsSync(pkgPath) ? 'update' : 'create'} package.json (ESM)`
      );
      return false;
    }

    const nextContent = `${JSON.stringify(pkg, null, 2)}\n`;
    const currentContent = existsSync(pkgPath)
      ? await readFile(pkgPath, 'utf-8').catch(() => null)
      : null;
    if (currentContent === nextContent) {
      return false;
    }

    await writePackageJson(pkgPath, pkg);
    return true;
  }

  private async buildTouchedPackages(config: SyncConfig, result: SyncResult): Promise<void> {
    const elementFilters = Array.from(this.touchedElementPackages)
      .sort()
      .map((el) => `--filter=@pie-element/${el}`);
    const pieLibFilters = Array.from(this.touchedPieLibPackages)
      .sort()
      .map((pkg) => `--filter=@pie-lib/${pkg}`);

    const filters = [...elementFilters, ...pieLibFilters];

    if (filters.length === 0) {
      if (config.verbose) {
        this.logger.info('🏗️  Build: Skipped (no touched packages detected)');
      }
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
      result.errors.push(
        `Build failed (exit code ${exitCode}). Re-run upstream:sync with --skip-build to skip.`
      );
    }
  }

  private async syncDirectory(
    sourceDir: string,
    targetDir: string,
    relativePath: string,
    pkg: string,
    config: SyncConfig,
    result: SyncResult,
    upstreamCommit: string,
    syncDate: string
  ): Promise<number> {
    let filesProcessed = 0;
    const defaultExportFiles = new Set<string>(); // Track files with default exports

    const items = await this.readdir(sourceDir);

    for (const item of items) {
      const srcPath = join(sourceDir, item);
      const stat = await fsStat(srcPath);

      if (stat.isDirectory()) {
        // Skip __tests__, __mocks__, etc.
        if (item.startsWith('__')) {
          continue;
        }
        // Recursively sync subdirectories
        const subFilesProcessed = await this.syncDirectory(
          srcPath,
          join(targetDir, item),
          join(relativePath, item),
          pkg,
          config,
          result,
          upstreamCommit,
          syncDate
        );
        filesProcessed += subFilesProcessed;
        continue;
      }

      // Only process .js and .jsx files
      if (!item.endsWith('.js') && !item.endsWith('.jsx')) {
        continue;
      }

      result.filesChecked++;
      filesProcessed++;

      // Convert .js → .ts and .jsx → .tsx
      const targetFile = item.replace(/\.jsx?$/, item.endsWith('.jsx') ? '.tsx' : '.ts');
      const targetPath = join(targetDir, targetFile);

      // Read source
      const sourceContent = await readFile(srcPath, 'utf-8');

      // Convert based on file extension
      const conversionResult = item.endsWith('.jsx')
        ? convertJsxToTsx(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
            date: syncDate,
          })
        : convertJsToTs(sourceContent, {
            sourcePath: `pie-elements/packages/${pkg}/${relativePath}/${item}`,
            commit: upstreamCommit,
            date: syncDate,
          });

      const converted = conversionResult.code;

      // Track files that export default objects (for import fixing later)
      if (conversionResult.hasDefaultObjectExport) {
        // Store the file name without extension for import matching
        const fileNameWithoutExt = targetFile.replace(/\.(ts|tsx)$/, '');
        defaultExportFiles.add(fileNameWithoutExt);
      }

      // Check if different
      const isNew = !existsSync(targetPath);
      if (!isNew) {
        const currentContent = await readFile(targetPath, 'utf-8');
        if (currentContent === converted) {
          result.filesSkipped++;
          continue;
        }
        result.filesUpdated++;
      } else {
        result.filesCopied++;
      }

      // Write
      if (!config.dryRun) {
        await mkdir(dirname(targetPath), { recursive: true });
        await writeFile(targetPath, converted, 'utf-8');
      }
    }

    // After all files are synced, fix import statements in consuming files
    if (!config.dryRun && defaultExportFiles.size > 0) {
      const targetDirItems = await this.readdir(targetDir);
      for (const item of targetDirItems) {
        const itemPath = join(targetDir, item);
        const stat = await fsStat(itemPath);
        if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
          await this.fixImportsInFile(itemPath, defaultExportFiles);
        }
      }
    }

    return filesProcessed;
  }

  private async fixImportsInFile(
    filePath: string,
    defaultExportFiles: Set<string>
  ): Promise<boolean> {
    let content = await readFile(filePath, 'utf-8');
    let modified = false;

    // Find all import statements
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"](.+?)['"]/g;
    const matches = content.matchAll(importRegex);
    const replacements: Array<{ from: string; to: string; imports: string[]; moduleName: string }> =
      [];

    for (const match of matches) {
      const imports = match[1].split(',').map((s) => s.trim());
      const importPath = match[2];

      // Check if this import is from a file that exports default object
      // Normalize the import path (remove ./ and extension if present)
      const normalizedPath = importPath.replace(/^\.\//, '').replace(/\.(ts|tsx|js|jsx)$/, '');

      if (defaultExportFiles.has(normalizedPath)) {
        // Extract module name from path (e.g., './icons' -> 'icons')
        const moduleName =
          importPath
            .split('/')
            .pop()
            ?.replace(/\.(ts|tsx|js|jsx)$/, '') || 'module';

        replacements.push({
          from: match[0],
          to: `import ${moduleName} from '${importPath}'`,
          imports,
          moduleName,
        });
      }
    }

    // Apply replacements
    if (replacements.length > 0) {
      for (const { from, to, imports, moduleName } of replacements) {
        // Replace the import statement
        content = content.replace(from, to);
        modified = true;

        // Replace usage of imported items (e.g., faCorrect -> icons.faCorrect)
        for (const importName of imports) {
          // Match word boundaries to avoid partial replacements
          // Don't replace in import statements or property definitions
          const usageRegex = new RegExp(`\\b${importName}\\b(?!:)`, 'g');
          content = content.replace(usageRegex, (match, offset) => {
            // Check if this is in an import statement (skip those)
            const beforeMatch = content.substring(0, offset);
            const lastImportIndex = beforeMatch.lastIndexOf('import');
            const lastSemicolon = beforeMatch.lastIndexOf(';');
            const lastNewline = beforeMatch.lastIndexOf('\n');

            // If we're inside an import statement, don't replace
            if (lastImportIndex > Math.max(lastSemicolon, lastNewline)) {
              return match;
            }

            return `${moduleName}.${importName}`;
          });
        }
      }

      await writeFile(filePath, content, 'utf-8');
    }

    return modified;
  }

  private async readdir(path: string): Promise<string[]> {
    try {
      return await fsReaddir(path);
    } catch {
      return [];
    }
  }

  private generateReport(result: SyncResult): void {
    this.log(`\n${'='.repeat(60)}`);
    this.log('📊 SYNC REPORT');
    this.log('='.repeat(60));
    this.log(`Files checked:  ${result.filesChecked}`);
    this.log(`Files created:  ${result.filesCopied}`);
    this.log(`Files updated:  ${result.filesUpdated}`);
    this.log(`Files skipped:  ${result.filesSkipped}`);
    this.log(`Errors:         ${result.errors.length}`);
    this.log(`Warnings:       ${result.warnings.length}`);

    if (result.errors.length > 0) {
      this.log('\n❌ ERRORS:');
      for (const err of result.errors) this.log(`  - ${err}`);
    }

    if (result.warnings.length > 0) {
      this.log('\n⚠️  WARNINGS:');
      for (const warn of result.warnings) this.log(`  - ${warn}`);
    }

    this.log(`${'='.repeat(60)}\n`);

    if (result.filesCopied > 0 || result.filesUpdated > 0) {
      this.logger.section('💡 Next steps');
      this.logger.info('  1. Review changes: git diff packages/elements-react/');
      this.logger.info('  2. Add proper TypeScript types to synced files');
      this.logger.info('  3. Run tests: bun test');
      this.logger.info('  4. Update tracking: bun run upstream:track record\n');
    }
  }
}
