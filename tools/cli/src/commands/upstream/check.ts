import { Command, Flags } from '@oclif/core';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getCurrentCommit, getFileModifiedDate } from '../../utils/git.js';
import { Logger } from '../../utils/logger.js';

interface CheckConfig {
  pieElements: string;
  pieLib: string;
  pieElementsNg: string;
  elements?: string[];
  verbose: boolean;
}

interface FileChange {
  element: string;
  file: string;
  upstreamPath: string;
  localPath: string;
  upstreamModified: Date;
  localModified: Date;
  upstreamSize: number;
  localSize: number;
}

interface CheckResult {
  elementsChecked: number;
  filesChecked: number;
  potentialChanges: FileChange[];
  errors: string[];
  warnings: string[];
}

export default class Check extends Command {
  static override description = 'Check for changes in upstream pie-elements repository';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --verbose',
    '<%= config.bin %> <%= command.id %> --element multiple-choice',
  ];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
    element: Flags.string({
      description: 'Check only specified element',
    }),
  };

  private logger!: Logger;

  public async run(): Promise<void> {
    const { flags } = await this.parse(Check);

    this.logger = new Logger(flags.verbose);

    const config: CheckConfig = {
      pieElements: '../pie-elements',
      pieLib: '../pie-lib',
      pieElementsNg: '.',
      elements: flags.element ? [flags.element] : undefined,
      verbose: flags.verbose,
    };

    const result = await this.checkUpstream(config);

    // Display results
    this.displayResults(result);

    if (result.errors.length > 0) {
      this.error('Check completed with errors');
    }
  }

  private async checkUpstream(config: CheckConfig): Promise<CheckResult> {
    const result: CheckResult = {
      elementsChecked: 0,
      filesChecked: 0,
      potentialChanges: [],
      errors: [],
      warnings: [],
    };

    this.logger.info('🔍 Checking upstream changes...');
    this.logger.info(`   pie-elements: ${config.pieElements}`);
    this.logger.info(`   pie-lib: ${config.pieLib}`);
    this.logger.info(`   pie-elements-ng: ${config.pieElementsNg}\n`);

    // Verify upstream repos exist
    if (!existsSync(config.pieElements)) {
      result.errors.push(`pie-elements not found at ${config.pieElements}`);
      return result;
    }
    if (!existsSync(config.pieLib)) {
      result.errors.push(`pie-lib not found at ${config.pieLib}`);
      return result;
    }

    // Get commit info
    const pieElementsCommit = getCurrentCommit(config.pieElements);
    const pieLibCommit = getCurrentCommit(config.pieLib);
    const pieElementsNgCommit = getCurrentCommit(config.pieElementsNg);

    this.logger.info('📊 Repository Commits:');
    this.logger.info(`   pie-elements: ${pieElementsCommit.substring(0, 8)}`);
    this.logger.info(`   pie-lib: ${pieLibCommit.substring(0, 8)}`);
    this.logger.info(`   pie-elements-ng: ${pieElementsNgCommit.substring(0, 8)}\n`);

    // Check controllers
    await this.checkControllers(config, result);

    return result;
  }

  private async checkControllers(config: CheckConfig, result: CheckResult): Promise<void> {
    this.logger.info('📦 Checking controllers...\n');

    const upstreamElementsDir = join(config.pieElements, 'packages');
    const localElementsDir = join(config.pieElementsNg, 'packages/elements-svelte');

    // Get list of elements that exist in both repos
    const upstreamPackages = await readdir(upstreamElementsDir);
    const localPackages = existsSync(localElementsDir) ? await readdir(localElementsDir) : [];

    for (const pkg of upstreamPackages) {
      // Skip if filtering by element
      if (config.elements && !config.elements.includes(pkg)) {
        continue;
      }

      // Skip if not in local repo
      if (!localPackages.includes(pkg)) {
        this.logger.debug(`   Skipping ${pkg} (not in local repo)`);
        continue;
      }

      result.elementsChecked++;

      // Check controller file
      const upstreamController = join(upstreamElementsDir, pkg, 'controller/src/index.js');
      const localController = join(localElementsDir, pkg, 'src/controller/index.ts');

      if (!existsSync(upstreamController)) {
        this.logger.debug(`   No controller found for ${pkg}`);
        continue;
      }

      if (!existsSync(localController)) {
        result.warnings.push(`Local controller missing for ${pkg}`);
        continue;
      }

      result.filesChecked++;

      // Compare modification dates
      const upstreamDate = getFileModifiedDate(upstreamController, config.pieElements);
      const localDate = getFileModifiedDate(localController, config.pieElementsNg);

      if (upstreamDate > localDate) {
        const stat = await import('node:fs/promises').then((m) => m.stat);
        const upstreamStat = await stat(upstreamController);
        const localStat = await stat(localController);

        result.potentialChanges.push({
          element: pkg,
          file: 'controller',
          upstreamPath: upstreamController,
          localPath: localController,
          upstreamModified: upstreamDate,
          localModified: localDate,
          upstreamSize: upstreamStat.size,
          localSize: localStat.size,
        });
      }
    }
  }

  private displayResults(result: CheckResult): void {
    this.logger.section('\n📋 Check Results');

    this.logger.info(`   Elements checked: ${result.elementsChecked}`);
    this.logger.info(`   Files checked: ${result.filesChecked}`);
    this.logger.info(`   Potential changes: ${result.potentialChanges.length}`);

    if (result.potentialChanges.length > 0) {
      this.logger.section('\n⚠️  Potential Changes');
      for (const change of result.potentialChanges) {
        this.logger.info(`\n   ${change.element} - ${change.file}`);
        this.logger.info(`      Upstream: ${change.upstreamModified.toISOString()}`);
        this.logger.info(`      Local:    ${change.localModified.toISOString()}`);
        this.logger.info(`      Size diff: ${change.upstreamSize - change.localSize} bytes`);
      }

      this.logger.section('\n💡 Next Steps');
      this.logger.info('   Review the changes with:');
      for (const change of result.potentialChanges.slice(0, 3)) {
        this.logger.info(
          `   git log --oneline --since="${change.localModified.toISOString()}" -- packages/${change.element}/controller/src/index.js`
        );
      }
      this.logger.info('\n   Then sync with:');
      this.logger.info(`   bun run cli upstream:sync --element <element-name>\n`);
    } else {
      this.logger.success('\n✅ No changes detected - all elements are up to date\n');
    }

    if (result.warnings.length > 0) {
      this.logger.section('\n⚠️  Warnings');
      for (const warning of result.warnings) {
        this.logger.warn(`   ${warning}`);
      }
    }

    if (result.errors.length > 0) {
      this.logger.section('\n❌ Errors');
      for (const error of result.errors) {
        this.logger.error(`   ${error}`);
      }
    }
  }
}
