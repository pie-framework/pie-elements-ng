import { Command, Flags } from '@oclif/core';
import { Logger } from '../../utils/logger.js';
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EXCLUDED_UPSTREAM_ELEMENTS } from '../../lib/upstream/sync-constants.js';

type CheckResult = {
  element: string;
  elementDir: string;
  ok: boolean;
  errors: string[];
  warnings: string[];
};

const ELEMENTS_REACT_DIR = 'packages/elements-react';
const ELEMENTS_SVELTE_DIR = 'packages/elements-svelte';

function hasAnyControllerSource(elementDir: string): boolean {
  const base = join(elementDir, 'src', 'controller', 'index');
  return (
    existsSync(base + '.ts') ||
    existsSync(base + '.tsx') ||
    existsSync(base + '.js') ||
    existsSync(base + '.jsx')
  );
}

async function verifyControllerPackage(elementDir: string, element: string): Promise<CheckResult> {
  const pkgPath = join(elementDir, 'package.json');
  if (!existsSync(pkgPath)) {
    return {
      element,
      elementDir,
      ok: false,
      errors: ['Missing package.json'],
      warnings: [],
    };
  }

  const hasController = hasAnyControllerSource(elementDir);
  if (!hasController) {
    return { element, elementDir, ok: true, errors: [], warnings: [] };
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

    if (!dtsPath || typeof dtsPath !== 'string') {
      warnings.push('exports["./controller"].types is missing');
    } else {
      const abs = join(elementDir, dtsPath.replace(/^\.\//, ''));
      if (!existsSync(abs)) {
        warnings.push(`Controller d.ts artifact missing: ${dtsPath}`);
      }
    }
  }

  return { element, elementDir, ok: errors.length === 0, errors, warnings };
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
      description: 'Check only specified element (react or svelte package name)',
    }),
  };

  private logger = new Logger();

  public async run(): Promise<void> {
    const { flags } = await this.parse(VerifyControllers);
    this.logger = new Logger(flags.verbose);

    this.logger.section('🧩 Verifying published controller modules');

    const excludedElements = new Set<string>(EXCLUDED_UPSTREAM_ELEMENTS as readonly string[]);

    const reactItems = await readdir(ELEMENTS_REACT_DIR, { withFileTypes: true });
    const reactNames = reactItems
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((name) => !excludedElements.has(name));

    const svelteItems = await readdir(ELEMENTS_SVELTE_DIR, { withFileTypes: true });
    const svelteNames = svelteItems.filter((d) => d.isDirectory()).map((d) => d.name);

    type Job = { name: string; dir: string };
    let jobs: Job[] = [];

    if (flags.element) {
      const r = join(ELEMENTS_REACT_DIR, flags.element);
      const s = join(ELEMENTS_SVELTE_DIR, flags.element);
      if (reactNames.includes(flags.element) && existsSync(join(r, 'package.json'))) {
        jobs = [{ name: flags.element, dir: r }];
      } else if (svelteNames.includes(flags.element) && existsSync(join(s, 'package.json'))) {
        jobs = [{ name: flags.element, dir: s }];
      } else {
        this.error(
          `Element '${flags.element}' not found under ${ELEMENTS_REACT_DIR} or ${ELEMENTS_SVELTE_DIR}`
        );
      }
    } else {
      jobs = [
        ...reactNames.sort().map((name) => ({ name, dir: join(ELEMENTS_REACT_DIR, name) })),
        ...svelteNames.sort().map((name) => ({ name, dir: join(ELEMENTS_SVELTE_DIR, name) })),
      ];
    }

    const results: CheckResult[] = [];
    for (const { name, dir } of jobs) {
      results.push(await verifyControllerPackage(dir, name));
    }

    const failed = results.filter((r) => !r.ok);
    const warned = results.filter((r) => r.warnings.length > 0);
    const checked = results.filter((r) => hasAnyControllerSource(r.elementDir));

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
      this.log(`  - Or: cd ${ELEMENTS_SVELTE_DIR}/<element> && bun run build`);
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
