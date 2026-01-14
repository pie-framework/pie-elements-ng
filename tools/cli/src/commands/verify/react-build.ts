import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

interface BuildResult {
  element: string;
  success: boolean;
  error?: string;
  duration?: number;
}

const ELEMENTS_REACT_DIR = 'packages/elements-react';

export default class ReactBuild extends Command {
  static override description = 'Verify React element builds';

  static override examples = ['<%= config.bin %> <%= command.id %>'];

  static override flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show detailed build output',
      default: false,
    }),
    element: Flags.string({
      description: 'Build only specified element',
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(ReactBuild);

    this.logger = new Logger(flags.verbose);

    this.logger.section('🔨 Verifying React element builds');

    // Get all element directories
    const items = await readdir(ELEMENTS_REACT_DIR, { withFileTypes: true });
    let elements = items.filter((item) => item.isDirectory()).map((item) => item.name);

    // Filter to specific element if requested
    if (flags.element) {
      if (!elements.includes(flags.element)) {
        this.error(`Element '${flags.element}' not found in ${ELEMENTS_REACT_DIR}`);
      }
      elements = [flags.element];
    }

    if (elements.length === 0) {
      this.logger.warn(`⚠️  No React elements found in ${ELEMENTS_REACT_DIR}/`);
      return;
    }

    this.logger.info(`Found ${elements.length} element(s) to verify\n`);

    const results: BuildResult[] = [];

    // Build each element sequentially
    for (const element of elements) {
      process.stdout.write(`  Building ${element}... `);

      const result = await this.buildElement(element, flags.verbose);
      results.push(result);

      if (result.success) {
        console.log(`✅ (${result.duration}ms)`);
      } else {
        console.log('❌');
      }
    }

    // Generate report
    this.log(`\n${'='.repeat(60)}`);
    this.log('📊 BUILD VERIFICATION REPORT');
    this.log('='.repeat(60));

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    this.log(`Total:      ${results.length}`);
    this.log(`Passed:     ${successful.length} ✅`);
    this.log(`Failed:     ${failed.length} ❌`);

    if (successful.length > 0) {
      this.log('\n✅ SUCCESSFUL BUILDS:');
      successful.forEach((r) => {
        this.log(`  - ${r.element} (${r.duration}ms)`);
      });
    }

    if (failed.length > 0) {
      this.log('\n❌ FAILED BUILDS:');
      failed.forEach((r) => {
        this.log(`\n  Element: ${r.element}`);
        if (r.error) {
          // Extract first few lines of error for summary
          const errorLines = r.error.split('\n').slice(0, 10);
          errorLines.forEach((line) => {
            if (line.trim()) {
              this.log(`    ${line}`);
            }
          });
          if (r.error.split('\n').length > 10) {
            this.log('    ... (truncated)');
          }
        }
      });

      this.log('\n💡 To see full error for a specific element:');
      this.log('   cd packages/elements-react/<element-name>');
      this.log('   bun run build');
    }

    this.log(`\n${'='.repeat(60)}\n`);

    // Exit with error code if any builds failed
    if (failed.length > 0) {
      this.error('Some builds failed', { exit: 1 });
    }
  }

  private async buildElement(element: string, verbose: boolean): Promise<BuildResult> {
    const elementDir = join(ELEMENTS_REACT_DIR, element);
    const packageJsonPath = join(elementDir, 'package.json');

    // Skip if no package.json
    if (!existsSync(packageJsonPath)) {
      return {
        element,
        success: false,
        error: 'No package.json found',
      };
    }

    const startTime = Date.now();

    try {
      execSync('bun run build', {
        cwd: elementDir,
        stdio: verbose ? 'inherit' : 'pipe',
        encoding: 'utf-8',
      });

      const duration = Date.now() - startTime;

      return {
        element,
        success: true,
        duration,
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;

      // Extract error message from stderr
      const err = error as { stderr?: Buffer; message?: string };
      const stderr = err.stderr?.toString() || err.message || 'Unknown error';

      return {
        element,
        success: false,
        error: stderr,
        duration,
      };
    }
  }
}
