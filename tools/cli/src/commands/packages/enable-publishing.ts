import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { loadPackageJson, writePackageJson } from '../../utils/package-json.js';
import { glob } from 'glob';
import { readFile } from 'node:fs/promises';

interface ChangesetConfig {
  $schema?: string;
  changelog: string;
  commit: boolean;
  fixed: string[];
  linked: string[];
  access: string;
  baseBranch: string;
  updateInternalDependencies: string;
  ignore: string[];
}

const PACKAGE_MANIFEST_PATTERN = 'packages/**/package.json';

const CHANGESET_CONFIG_PATH = '.changeset/config.json';

export default class EnablePublishing extends Command {
  static override description =
    'Enable @pie-element/* and @pie-lib/* package publishing by removing private flags';

  static override examples = [
    '<%= config.bin %> <%= command.id %> --dry-run',
    '<%= config.bin %> <%= command.id %>',
  ];

  static override flags = {
    'dry-run': Flags.boolean({
      description: 'Show what would be changed without making any changes',
      default: false,
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(EnablePublishing);

    this.logger.section('🔄 Element/Lib Package Publishing Migration');

    if (flags['dry-run']) {
      this.logger.info('🔍 DRY RUN MODE - No changes will be made\n');
    }

    const changes: string[] = [];
    let totalPackages = 0;

    // Step 1: Find all element/lib packages
    this.logger.info('📦 Finding @pie-element/* and @pie-lib/* packages...');
    const allPackagePaths = await glob(PACKAGE_MANIFEST_PATTERN, { ignore: ['**/node_modules/**'] });
    const packagePaths: string[] = [];
    const packageNames: string[] = [];

    for (const pkgPath of allPackagePaths) {
      const pkg = await loadPackageJson(pkgPath);
      if (
        typeof pkg.name === 'string' &&
        (pkg.name.startsWith('@pie-element/') || pkg.name.startsWith('@pie-lib/'))
      ) {
        packagePaths.push(pkgPath);
        packageNames.push(pkg.name);
      }
    }

    this.logger.info(`   Found ${packagePaths.length} targeted packages\n`);

    // Step 2: Remove "private": true from package.json files
    this.logger.info('🔓 Removing private flag from targeted packages...');

    for (const pkgPath of packagePaths) {
      const pkg = await loadPackageJson(pkgPath);

      if (pkg.private === true) {
        totalPackages++;
        this.logger.info(`   ✓ ${pkg.name}`);
        changes.push(`Remove private flag from ${pkg.name}`);

        if (!flags['dry-run']) {
          // Remove the private field
          delete pkg.private;

          // Write back with proper formatting
          await writePackageJson(pkgPath, pkg);
        }
      }
    }

    this.logger.info(`   Modified ${totalPackages} package.json files\n`);

    // Step 3: Update .changeset/config.json
    this.logger.info('⚙️  Updating changeset configuration...');
    const changesetContent = await readFile(CHANGESET_CONFIG_PATH, 'utf-8');
    const changesetConfig = JSON.parse(changesetContent) as ChangesetConfig;

    // Filter out targeted packages from ignore list
    const targetPackageSet = new Set(packageNames);
    const originalIgnoreCount = changesetConfig.ignore.length;
    const newIgnore = changesetConfig.ignore.filter((name) => !targetPackageSet.has(name));

    const removedCount = originalIgnoreCount - newIgnore.length;
    this.logger.info(`   Removing ${removedCount} packages from ignore list`);
    changes.push(`Remove ${removedCount} element/lib packages from changeset ignore list`);

    if (!flags['dry-run']) {
      changesetConfig.ignore = newIgnore;
      await writePackageJson(CHANGESET_CONFIG_PATH, changesetConfig as any);
    }

    this.logger.info(`   Updated ${CHANGESET_CONFIG_PATH}\n`);

    // Summary
    this.logger.section('📋 Summary of Changes');

    for (const change of changes) {
      this.logger.info(`   • ${change}`);
    }

    this.logger.info(`\n   Total packages enabled for publishing: ${totalPackages}`);

    if (flags['dry-run']) {
      this.logger.warn('\n⚠️  This was a dry run. No files were modified.');
      this.logger.info(
        '   Run without --dry-run to apply these changes:\n   bun run cli packages:enable-publishing\n'
      );
    } else {
      this.logger.success('\n✅ Migration complete!');
      this.logger.info('\nNext steps:');
      this.logger.info('1. Review the changes with: git diff');
      this.logger.info('2. Create changesets for the packages you want to publish:');
      this.logger.info('   bun run changeset');
      this.logger.info('3. Commit and push the changes:');
      this.logger.info('   git add .');
      this.logger.info('   git commit -m "chore: enable element/lib package publishing"');
      this.logger.info('   git push');
      this.logger.info('4. Wait for the automated Version Packages PR and merge it to publish\n');
    }

    // Provide package list
    this.logger.section('\n📦 Packages that will now be published');

    const elementPackages = packageNames.filter((name) => name.startsWith('@pie-element/'));
    const libPackages = packageNames.filter((name) => name.startsWith('@pie-lib/'));

    if (elementPackages.length > 0) {
      this.logger.info('Element packages:');
      for (const name of elementPackages.sort()) {
        this.logger.info(`   • ${name}`);
      }
      this.log();
    }

    if (libPackages.length > 0) {
      this.logger.info('Lib packages:');
      for (const name of libPackages.sort()) {
        this.logger.info(`   • ${name}`);
      }
      this.log();
    }
  }
}
