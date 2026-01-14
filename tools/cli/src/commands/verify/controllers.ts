import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

type CheckResult = {
  element: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const ELEMENTS_REACT_DIR = 'packages/elements-react';

function hasAnyControllerSource(elementDir: string): boolean {
  const base = join(elementDir, 'src', 'controller', 'index');
  return (
    existsSync(base + '.ts') ||
    existsSync(base + '.tsx') ||
    existsSync(base + '.js') ||
    existsSync(base + '.jsx')
  );
}

export default class VerifyControllers extends Command {
  static override description =
    'Verify that element packages will publish controller modules correctly (exports + dist artifacts)';

  static override examples = [
    'bun run cli <%= command.id %>',
    'bun cli <%= command.id %>',
    '<%= config.bin %> <%= command.id %>',
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

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyControllers);
    this.logger = new Logger(flags.verbose);

    this.logger.section('🧩 Verifying published controller modules');

    const items = await readdir(ELEMENTS_REACT_DIR, { withFileTypes: true });
    let elements = items.filter((d) => d.isDirectory()).map((d) => d.name);

    if (flags.element) {
      if (!elements.includes(flags.element)) {
        this.error(`Element '${flags.element}' not found in ${ELEMENTS_REACT_DIR}`);
      }
      elements = [flags.element];
    }

    const results: CheckResult[] = [];
    for (const element of elements.sort()) {
      const elementDir = join(ELEMENTS_REACT_DIR, element);
      const pkgPath = join(elementDir, 'package.json');
      if (!existsSync(pkgPath)) {
        results.push({
          element,
          ok: false,
          errors: ['Missing package.json'],
          warnings: [],
        });
        continue;
      }

      const hasController = hasAnyControllerSource(elementDir);
      if (!hasController) {
        // Nothing to publish for controllers; skip.
        results.push({ element, ok: true, errors: [], warnings: [] });
        continue;
      }

      const pkgRaw = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(pkgRaw) as any;
      const exportsObj = pkg?.exports as any;
      const controllerExport = exportsObj?.['./controller'];

      const errors: string[] = [];
      const warnings: string[] = [];
      if (!controllerExport) {
        errors.push('Missing exports["./controller"] in package.json');
      } else {
        const jsPath = controllerExport?.default as string | undefined;
        const dtsPath = controllerExport?.types as string | undefined;

        if (!jsPath || typeof jsPath !== 'string') {
          errors.push('exports["./controller"].default is missing');
        } else {
          const abs = join(elementDir, jsPath.replace(/^\.\//, ''));
          if (!existsSync(abs)) {
            errors.push(`Controller JS artifact missing: ${jsPath}`);
          }
        }

        // Types are nice-to-have for TS consumers, but not required for runtime/controller loading.
        // We'll warn (not fail) if types are missing.
        if (!dtsPath || typeof dtsPath !== 'string') {
          warnings.push('exports["./controller"].types is missing');
        } else {
          const abs = join(elementDir, dtsPath.replace(/^\.\//, ''));
          if (!existsSync(abs)) {
            warnings.push(`Controller d.ts artifact missing: ${dtsPath}`);
          }
        }
      }

      results.push({ element, ok: errors.length === 0, errors, warnings });
    }

    const failed = results.filter((r) => !r.ok);
    const warned = results.filter((r) => r.warnings.length > 0);
    const checked = results.filter((r) =>
      hasAnyControllerSource(join(ELEMENTS_REACT_DIR, r.element))
    );

    this.log(`\n${'='.repeat(60)}`);
    this.log('📊 CONTROLLER PUBLISH VERIFICATION REPORT');
    this.log('='.repeat(60));
    this.log(`Elements scanned:           ${results.length}`);
    this.log(`Elements with controllers:  ${checked.length}`);
    this.log(`Passed:                    ${results.length - failed.length} ✅`);
    this.log(`Failed:                    ${failed.length} ❌`);
    this.log(`Warnings:                  ${warned.length} ⚠️`);

    if (failed.length > 0) {
      this.log('\n❌ FAILURES:');
      for (const f of failed) {
        this.log(`  - ${f.element}`);
        for (const e of f.errors) this.log(`    • ${e}`);
      }
      this.log('\n💡 Fixes:');
      this.log('  - Ensure package.json exports include "./controller"');
      this.log('  - Ensure build outputs exist under dist/controller/');
      this.log(`  - Rebuild: cd ${ELEMENTS_REACT_DIR}/<element> && bun run build`);
      this.error('Some controller publish checks failed', { exit: 1 });
    }

    if (warned.length > 0) {
      this.log('\n⚠️  WARNINGS (non-blocking):');
      for (const w of warned) {
        this.log(`  - ${w.element}`);
        for (const msg of w.warnings) this.log(`    • ${msg}`);
      }
    }

    this.log(`\n${'='.repeat(60)}\n`);
  }
}
