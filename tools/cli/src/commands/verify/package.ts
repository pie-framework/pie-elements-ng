import { Args, Command, Flags } from '@oclif/core';
import { loadPackageJson } from '../../utils/package-json.js';
import path from 'node:path';
import { existsSync } from 'node:fs';

export default class VerifyPackage extends Command {
  static override description = 'Validate package structure and metadata';

  static override examples = [
    '<%= config.bin %> <%= command.id %> multiple-choice',
    '<%= config.bin %> <%= command.id %> math-inline --fix',
  ];

  static override flags = {
    fix: Flags.boolean({
      description: 'Auto-fix issues where possible (not yet implemented)',
      default: false,
    }),
  };

  static override args = {
    element: Args.string({
      required: true,
      description: 'Element name',
    }),
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(VerifyPackage);

    const errors: string[] = [];
    const warnings: string[] = [];

    const elementPath = this.resolveElementPath(args.element);
    if (!elementPath) {
      this.error(`Element not found: ${args.element}`);
    }

    this.log(`Validating @pie-element/${args.element}...`);
    this.log('');

    try {
      // 1. Check package.json structure
      const pkg = await this.validatePackageJSON(elementPath, errors, warnings);

      // 2. Check exports
      if (pkg) {
        await this.validateExports(elementPath, pkg, errors, warnings);
      }

      // 3. Check build outputs
      await this.validateBuildOutputs(elementPath, errors, warnings);

      // 4. Check demo structure
      await this.validateDemo(elementPath, warnings);

      // 5. Display results
      this.displayResults(errors, warnings, flags.fix);

      if (errors.length > 0) {
        this.exit(1);
      }
    } catch (error) {
      this.error(`Validation failed: ${error}`);
    }
  }

  private resolveElementPath(element: string): string | null {
    // Try React first
    let elementPath = path.join(process.cwd(), 'packages/elements-react', element);

    if (existsSync(elementPath)) return elementPath;

    // Try Svelte
    elementPath = path.join(process.cwd(), 'packages/elements-svelte', element);

    if (existsSync(elementPath)) return elementPath;

    return null;
  }

  private async validatePackageJSON(elementPath: string, errors: string[], warnings: string[]) {
    const pkgPath = path.join(elementPath, 'package.json');

    if (!existsSync(pkgPath)) {
      errors.push('package.json not found');
      return null;
    }

    const pkg = await loadPackageJson(path.join(elementPath, 'package.json'));

    // Required fields
    if (!pkg.name) errors.push('Missing "name" field');
    if (!pkg.version) errors.push('Missing "version" field');
    if (!pkg.type || pkg.type !== 'module') {
      errors.push('Missing or invalid "type" field (must be "module")');
    }

    // Recommended fields
    if (!pkg.exports) warnings.push('Missing "exports" field');
    if (!pkg.main) warnings.push('Missing "main" field');
    if (!pkg.types) warnings.push('Missing "types" field');

    // Check naming convention
    if (pkg.name && !pkg.name.startsWith('@pie-element/')) {
      errors.push(`Package name should start with "@pie-element/" (got: ${pkg.name})`);
    }

    return pkg;
  }

  private async validateExports(
    elementPath: string,
    pkg: any,
    errors: string[],
    _warnings: string[]
  ) {
    if (!pkg?.exports) return;

    // Check that exported files exist
    const exportsObj = typeof pkg.exports === 'string' ? { '.': pkg.exports } : pkg.exports;

    for (const [key, value] of Object.entries(exportsObj)) {
      const exportPath = typeof value === 'string' ? value : (value as any)?.default;
      if (!exportPath) continue;

      const filePath = path.join(elementPath, exportPath);
      if (!existsSync(filePath)) {
        errors.push(`Export "${key}" points to non-existent file: ${exportPath}`);
      }
    }
  }

  private async validateBuildOutputs(elementPath: string, errors: string[], warnings: string[]) {
    const distPath = path.join(elementPath, 'dist');

    if (!existsSync(distPath)) {
      warnings.push('dist/ folder not found - build may not have run');
      return;
    }

    // Check for expected files
    const expectedFiles = [
      { path: 'index.js', required: true },
      { path: 'controller/index.js', required: false },
      { path: 'configure/index.js', required: false },
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(distPath, file.path);
      if (!existsSync(filePath)) {
        if (file.required) {
          errors.push(`Missing required file: dist/${file.path}`);
        } else {
          warnings.push(`Missing optional file: dist/${file.path}`);
        }
      }
    }
  }

  private async validateDemo(elementPath: string, warnings: string[]) {
    const demoPath = path.join(elementPath, 'docs/demo');

    if (!existsSync(demoPath)) {
      warnings.push('No docs/demo directory found');
      return;
    }

    const demoHtmlPath = path.join(demoPath, 'demo.html');
    if (!existsSync(demoHtmlPath)) {
      warnings.push('No docs/demo/demo.html file found');
    }

    const demoMjsPath = path.join(demoPath, 'demo.mjs');
    if (!existsSync(demoMjsPath)) {
      warnings.push('No docs/demo/demo.mjs file found');
    }
  }

  private displayResults(errors: string[], warnings: string[], fixMode: boolean): void {
    if (errors.length === 0 && warnings.length === 0) {
      this.log('✓ Package validation passed');
      this.log('');
      return;
    }

    if (errors.length > 0) {
      this.log('Errors:');
      for (const error of errors) {
        this.log(`  ✗ ${error}`);
      }
      this.log('');
    }

    if (warnings.length > 0) {
      this.log('Warnings:');
      for (const warning of warnings) {
        this.log(`  ⚠️  ${warning}`);
      }
      this.log('');
    }

    if (fixMode) {
      this.warn('Auto-fix mode is not yet implemented');
      this.log('');
    }
  }
}
