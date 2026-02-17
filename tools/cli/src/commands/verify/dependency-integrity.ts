import { Command, Flags } from '@oclif/core';
import {
  analyzePackageDependencyIntegrity,
  collectWorkspacePackageDirs,
  type ImportIntegrityIssue,
} from '../../utils/dependency-integrity.js';
import { Logger } from '../../utils/logger.js';

type Row = {
  packageName: string;
  issue: ImportIntegrityIssue;
};

export default class VerifyDependencyIntegrity extends Command {
  static override description =
    'Inspect package imports and classify direct, transitive, hoist-reliant, and broken dependency resolution';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --package @pie-element/ebsr',
    '<%= config.bin %> <%= command.id %> --fail-on-hoist',
  ];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed output',
      default: false,
    }),
    package: Flags.string({
      description: 'Limit analysis to one package name (eg @pie-element/ebsr)',
    }),
    'fail-on-hoist': Flags.boolean({
      description: 'Exit non-zero when hoist-reliant imports are found',
      default: false,
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyDependencyIntegrity);
    this.logger = new Logger(flags.verbose);

    this.logger.section('🔍 Verifying dependency integrity');

    const repoRoot = process.cwd();
    const pkgDirs = await collectWorkspacePackageDirs(repoRoot);
    const results = [];

    for (const pkgDir of pkgDirs) {
      const analysis = await analyzePackageDependencyIntegrity(pkgDir);
      if (!analysis) continue;
      if (flags.package && analysis.packageName !== flags.package) continue;
      results.push(analysis);
    }

    if (results.length === 0) {
      this.error(
        flags.package
          ? `Package '${flags.package}' not found under packages/elements-react or packages/lib-react`
          : 'No packages found to inspect',
        { exit: 1 }
      );
    }

    const allIssues: Row[] = [];
    for (const result of results) {
      for (const issue of result.issues) {
        allIssues.push({
          packageName: result.packageName,
          issue,
        });
      }
    }

    const byStatus = {
      transitive: allIssues.filter((r) => r.issue.status === 'transitive'),
      hoist: allIssues.filter((r) => r.issue.status === 'hoist'),
      broken: allIssues.filter((r) => r.issue.status === 'broken'),
    };

    this.log(`Packages scanned: ${results.length}`);
    this.log(`Transitive leaks: ${byStatus.transitive.length}`);
    this.log(`Hoist-reliant:    ${byStatus.hoist.length}`);
    this.log(`Broken:           ${byStatus.broken.length}\n`);

    this.printIssueGroup('❌ Broken imports', byStatus.broken);
    this.printIssueGroup('⚠️  Hoist-reliant imports', byStatus.hoist);
    this.printIssueGroup('ℹ️  Transitive imports (currently resolvable)', byStatus.transitive);

    const shouldFail = byStatus.broken.length > 0 || (flags['fail-on-hoist'] && byStatus.hoist.length > 0);
    if (shouldFail) {
      const failReason =
        byStatus.broken.length > 0
          ? 'Broken imports found'
          : 'Hoist-reliant imports found (--fail-on-hoist)';
      this.error(failReason, { exit: 1 });
    }

    this.logger.success('Dependency integrity check complete');
  }

  private printIssueGroup(title: string, rows: Row[]): void {
    if (rows.length === 0) return;

    this.log(`${title}:`);
    for (const row of rows) {
      const extra = row.issue.resolvedPath ? ` -> ${this.toRepoRelative(row.issue.resolvedPath)}` : '';
      this.log(`  - ${row.packageName}: ${row.issue.dependency}${extra}`);
    }
    this.log('');
  }

  private toRepoRelative(absolutePath: string): string {
    const repoRoot = process.cwd();
    if (absolutePath.startsWith(repoRoot)) {
      return absolutePath.slice(repoRoot.length + 1);
    }

    return absolutePath;
  }
}
