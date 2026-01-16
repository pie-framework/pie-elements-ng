import { Args, Command } from '@oclif/core';
import { loadPackageJson } from '../../utils/package-json.js';
import path from 'node:path';
import { existsSync } from 'node:fs';

export default class DevInfo extends Command {
  static override description = 'Display element information and metadata';

  static override examples = [
    '<%= config.bin %> <%= command.id %> multiple-choice',
    '<%= config.bin %> <%= command.id %> math-inline',
  ];

  static override args = {
    element: Args.string({
      required: true,
      description: 'Element name',
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(DevInfo);

    const elementPath = this.resolveElementPath(args.element);

    if (!elementPath) {
      this.error(`Element not found: ${args.element}`);
    }

    try {
      // 1. Read package.json
      const pkg = await loadPackageJson(path.join(elementPath, 'package.json'));

      // 2. Check build outputs
      const buildInfo = await this.checkBuildOutputs(elementPath);

      // 3. Display info
      this.displayInfo(args.element, pkg, buildInfo, elementPath);
    } catch (error) {
      this.error(`Failed to read element info: ${error}`);
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

  private async checkBuildOutputs(elementPath: string) {
    const distPath = path.join(elementPath, 'dist');
    const hasDistFolder = existsSync(distPath);

    const mainPath = path.join(distPath, 'index.js');
    const hasMain = existsSync(mainPath);

    const controllerPath = path.join(distPath, 'controller/index.js');
    const hasController = existsSync(controllerPath);

    const configurePath = path.join(distPath, 'configure/index.js');
    const hasConfigure = existsSync(configurePath);

    const demoPath = path.join(elementPath, 'docs/demo');
    const hasDemo = existsSync(demoPath);

    const issues: string[] = [];

    if (!hasDistFolder) {
      issues.push('No dist/ folder found - run build first');
    } else {
      if (!hasMain) issues.push('Missing dist/index.js');
      if (!hasController) issues.push('Missing dist/controller/index.js');
      if (!hasConfigure) issues.push('Missing dist/configure/index.js');
    }

    if (!hasDemo) {
      issues.push('No docs/demo directory');
    }

    return {
      hasDistFolder,
      hasMain,
      hasController,
      hasConfigure,
      hasDemo,
      issues,
    };
  }

  private displayInfo(name: string, pkg: any, buildInfo: any, elementPath: string): void {
    this.log('');
    this.log(`═══════════════════════════════════════════════`);
    this.log(`Element: @pie-element/${name}`);
    this.log(`═══════════════════════════════════════════════`);
    this.log('');

    // Basic info
    this.log('Package Information:');
    this.log(`  Version: ${pkg.version || 'unknown'}`);
    this.log(`  Type: ${pkg.type || 'unknown'}`);
    this.log(`  Framework: ${this.detectFramework(pkg)}`);
    this.log('');

    // Exports
    this.log('Exports:');
    this.log(`  Main: ${buildInfo.hasMain ? '✓' : '✗'}`);
    this.log(`  Controller: ${buildInfo.hasController ? '✓' : '✗'}`);
    this.log(`  Configure: ${buildInfo.hasConfigure ? '✓' : '✗'}`);
    this.log(`  Demo: ${buildInfo.hasDemo ? '✓' : '✗'}`);
    this.log('');

    // Issues
    if (buildInfo.issues.length > 0) {
      this.log('Issues:');
      for (const issue of buildInfo.issues) {
        this.log(`  ⚠️  ${issue}`);
      }
      this.log('');
    }

    // Dependencies
    const deps = pkg.dependencies || {};
    if (Object.keys(deps).length > 0) {
      this.log('Dependencies:');
      for (const [depName, version] of Object.entries(deps)) {
        this.log(`  ${depName}: ${version}`);
      }
      this.log('');
    }

    // Scripts
    if (pkg.scripts) {
      this.log('Available Scripts:');
      for (const [scriptName, command] of Object.entries(pkg.scripts)) {
        if (['build', 'dev', 'test', 'lint'].includes(scriptName as string)) {
          this.log(`  ${scriptName}: ${command}`);
        }
      }
      this.log('');
    }

    // Location
    this.log('Location:');
    this.log(`  ${elementPath}`);
    this.log('');
  }

  private detectFramework(pkg: any): string {
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps.react) return 'React';
    if (deps.svelte) return 'Svelte';
    if (deps['@sveltejs/kit']) return 'SvelteKit';

    return 'Unknown';
  }
}
