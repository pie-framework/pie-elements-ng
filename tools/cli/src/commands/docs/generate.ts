import { Command, Flags } from '@oclif/core';
import { resolve } from 'node:path';
import { Logger } from '../../utils/logger.js';
import { discoverElementPackages } from '../../lib/docs/discovery.js';
import { loadContract, seedContractForElement } from '../../lib/docs/contracts.js';
import { validateContracts } from '../../lib/docs/contract-validator.js';
import { generateDocsForContract, toRelativePaths } from '../../lib/docs/generator.js';
import type { PieElementFramework } from '../../lib/docs/types.js';

export default class DocsGenerate extends Command {
  static override description =
    'Generate framework-agnostic PIE HTML docs artifacts from per-element docs contracts';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --framework=svelte --element=simple-cloze',
    '<%= config.bin %> <%= command.id %> --check',
    '<%= config.bin %> <%= command.id %> --seed-contracts',
  ];

  static override flags = {
    framework: Flags.string({
      description: 'Framework filter',
      options: ['react', 'svelte', 'all'],
      default: 'all',
    }),
    element: Flags.string({
      description: 'Generate docs for one element name',
    }),
    output: Flags.string({
      description: 'Output base directory',
      default: 'apps/element-demo/static/element-docs',
    }),
    'dry-run': Flags.boolean({
      description: 'Preview generation without writing files',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Verbose logging',
      default: false,
    }),
    check: Flags.boolean({
      description: 'Verify generated output matches committed docs',
      default: false,
    }),
    'seed-contracts': Flags.boolean({
      description: 'Create missing docs.contract.json descriptors before generation',
      default: false,
    }),
    'refresh-contracts': Flags.boolean({
      description: 'Refresh existing docs.contract.json descriptors using inferred defaults',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(DocsGenerate);
    const logger = new Logger(flags.verbose);
    const rootDir = process.cwd();
    const framework = (flags.framework || 'all') as PieElementFramework | 'all';
    const outputDir = resolve(rootDir, flags.output);

    logger.section('📚 PIE docs generation');
    logger.info(`   root:      ${rootDir}`);
    logger.info(`   framework: ${framework}`);
    logger.info(`   output:    ${outputDir}`);
    logger.info(
      `   mode:      ${flags.check ? 'check' : flags['dry-run'] ? 'dry-run' : 'write'}\n`
    );

    const discovered = await discoverElementPackages({
      rootDir,
      frameworkFilter: framework,
      elementFilter: flags.element,
    });

    if (!discovered.length) {
      this.error('No element packages found for the selected filters.');
    }

    if (flags['seed-contracts'] || flags['refresh-contracts']) {
      let seeded = 0;
      for (const element of discovered) {
        if (flags['dry-run'] || flags.check) {
          const existing = await loadContract(element.packageDir);
          if (!existing || flags['refresh-contracts']) {
            seeded++;
            logger.info(
              `   would ${flags['refresh-contracts'] ? 'refresh' : 'seed'}: ${element.elementName}`
            );
          }
          continue;
        }
        const result = await seedContractForElement(element, rootDir, {
          refresh: flags['refresh-contracts'],
        });
        if (result.wrote) {
          seeded++;
          logger.info(
            `   ${flags['refresh-contracts'] ? 'refreshed' : 'seeded'}: ${result.contractPath}`
          );
        }
      }
      logger.info(
        `\n   ${flags['dry-run'] || flags.check ? 'Would update' : 'Updated'} ${seeded} contract file(s).\n`
      );
    }

    const contracts: Array<{ packageDir: string; contract: any }> = [];
    const missingContracts: string[] = [];

    for (const element of discovered) {
      const contract = await loadContract(element.packageDir);
      if (!contract) {
        missingContracts.push(element.elementName);
        continue;
      }
      contracts.push({ packageDir: element.packageDir, contract });
    }

    if (missingContracts.length > 0) {
      this.error(
        `Missing docs contracts for ${missingContracts.length} element(s): ${missingContracts.join(', ')}`
      );
    }

    const validation = validateContracts(contracts);
    if (validation.issues.length > 0) {
      for (const issue of validation.issues) {
        logger.error(`${issue.elementName}: ${issue.message}`);
      }
      this.error(`Contract validation failed with ${validation.issues.length} issue(s).`);
    }

    const allWritten: string[] = [];
    const allChecked: string[] = [];
    const allDrift: string[] = [];

    for (const { packageDir, contract } of contracts) {
      const result = await generateDocsForContract(packageDir, contract, {
        outputDir,
        dryRun: flags['dry-run'],
        check: flags.check,
      });
      allWritten.push(...result.filesWritten);
      allChecked.push(...result.filesChecked);
      allDrift.push(...result.driftFiles);
      if (logger.isVerbose()) {
        logger.info(`   generated: ${contract.elementName} (${contract.views.length} view(s))`);
      }
    }

    if (flags.check) {
      if (allDrift.length > 0) {
        logger.error(`Detected docs drift in ${allDrift.length} file(s):`);
        for (const file of toRelativePaths(rootDir, allDrift)) {
          logger.error(`  - ${file}`);
        }
        this.error('Docs verification failed due to drift.');
      }
      logger.success(`Checked ${allChecked.length} file(s); no drift detected.`);
      return;
    }

    if (flags['dry-run']) {
      logger.success(`Dry run complete. Would write ${allWritten.length} file(s).`);
      return;
    }

    logger.success(`Wrote ${allWritten.length} file(s).`);
    if (logger.isVerbose()) {
      for (const file of toRelativePaths(rootDir, allWritten)) {
        logger.info(`  - ${file}`);
      }
    }
  }
}
