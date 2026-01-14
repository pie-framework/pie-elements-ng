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

const REACT_PACKAGE_PATTERNS = [
  'packages/elements-react/*/package.json',
  'packages/lib-react/*/package.json',
];

const CHANGESET_CONFIG_PATH = '.changeset/config.json';

export default class EnablePublishing extends Command {
  static override description = 'Enable React package publishing by removing private flags';

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

    this.logger.section('🔄 React Package Publishing Migration');

    if (flags['dry-run']) {
      this.logger.info('🔍 DRY RUN MODE - No changes will be made\n');
    }

    const changes: string[] = [];
    let totalPackages = 0;

    // Step 1: Find all React packages
    this.logger.info('📦 Finding React packages...');
    const packagePaths: string[] = [];
    for (const pattern of REACT_PACKAGE_PATTERNS) {
      const matches = await glob(pattern);
      packagePaths.push(...matches);
    }

    this.logger.info(`   Found ${packagePaths.length} React packages\n`);

    // Step 2: Remove "private": true from package.json files
    this.logger.info('🔓 Removing private flag from React packages...');
    const packageNames: string[] = [];

    for (const pkgPath of packagePaths) {
      const pkg = await loadPackageJson(pkgPath);

      packageNames.push(pkg.name);

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

    // Filter out React packages from ignore list
    const reactPackageSet = new Set(packageNames);
    const originalIgnoreCount = changesetConfig.ignore.length;
    const newIgnore = changesetConfig.ignore.filter((name) => !reactPackageSet.has(name));

    const removedCount = originalIgnoreCount - newIgnore.length;
    this.logger.info(`   Removing ${removedCount} packages from ignore list`);
    changes.push(`Remove ${removedCount} React packages from changeset ignore list`);

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
      this.logger.info('2. Create changesets for the React packages you want to publish:');
      this.logger.info('   bun run changeset');
      this.logger.info('3. Commit and push the changes:');
      this.logger.info('   git add .');
      this.logger.info('   git commit -m "chore: enable React package publishing"');
      this.logger.info('   git push');
      this.logger.info('4. Wait for the automated Version Packages PR and merge it to publish\n');
    }

    // Provide package list
    this.logger.section('\n📦 Packages that will now be published');

    const elementPackages = packageNames.filter((name) => name.startsWith('@pie-element/'));
    const libPackages = packageNames.filter((name) => name.startsWith('@pie-lib/'));

    if (elementPackages.length > 0) {
      this.logger.info('React Elements:');
      for (const name of elementPackages.sort()) {
        this.logger.info(`   • ${name}`);
      }
      this.log();
    }

    if (libPackages.length > 0) {
      this.logger.info('React Libraries:');
      for (const name of libPackages.sort()) {
        this.logger.info(`   • ${name}`);
      }
      this.log();
    }
  }
}
