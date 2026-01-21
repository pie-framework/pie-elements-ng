import { Command, Flags } from '@oclif/core';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Setup demo structure for React elements by copying from pie-elements
 * and generating the necessary files for local-esm-cdn testing.
 */
export default class SetupReactDemos extends Command {
  static override description = 'Setup demo structure for React elements from pie-elements';

  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --element multiple-choice',
    '<%= config.bin %> <%= command.id %> --dry-run',
  ];

  static override flags = {
    element: Flags.string({
      char: 'e',
      description: 'Setup demo for specific element only',
    }),
    'dry-run': Flags.boolean({
      description: 'Show what would be done without making changes',
      default: false,
    }),
    force: Flags.boolean({
      description: 'Overwrite existing demo files',
      default: false,
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(SetupReactDemos);

    const pieElementsPath = join(process.cwd(), '../pie-elements/packages');
    const reactElementsPath = join(process.cwd(), 'packages/elements-react');

    if (!existsSync(pieElementsPath)) {
      this.error('pie-elements repository not found at ../pie-elements');
    }

    if (!existsSync(reactElementsPath)) {
      this.error('React elements directory not found at packages/elements-react');
    }

    this.log('');
    this.log('🔧 Setting up React element demos...');
    this.log('');

    // Get list of React elements
    const elements = flags.element ? [flags.element] : this.getReactElements(reactElementsPath);

    let setupCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const element of elements) {
      const sourceDemo = join(pieElementsPath, element, 'docs/demo');
      const targetDemo = join(reactElementsPath, element, 'docs/demo');

      if (!existsSync(sourceDemo)) {
        this.warn(`  ⚠️  ${element}: No demo in pie-elements, skipping`);
        skippedCount++;
        continue;
      }

      if (existsSync(targetDemo) && !flags.force) {
        this.log(`  ⏭️  ${element}: Demo already exists (use --force to overwrite)`);
        skippedCount++;
        continue;
      }

      try {
        if (flags['dry-run']) {
          this.log(`  [DRY RUN] Would setup demo for ${element}`);
        } else {
          this.setupDemo(element, sourceDemo, targetDemo);
          this.log(`  ✅ ${element}: Demo setup complete`);
        }
        setupCount++;
      } catch (error) {
        this.error(`  ❌ ${element}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.log('');
    this.log('Summary:');
    this.log(`  ✅ Setup: ${setupCount}`);
    this.log(`  ⏭️  Skipped: ${skippedCount}`);
    if (errorCount > 0) {
      this.log(`  ❌ Errors: ${errorCount}`);
    }
    this.log('');

    if (setupCount > 0 && !flags['dry-run']) {
      this.log('Next steps:');
      this.log('  1. Build elements: bun run turbo build --filter @pie-element/*');
      this.log(
        '  2. Build element-player: bun run turbo build --filter @pie-elements-ng/element-player'
      );
      this.log('  3. Run demo: bun cli dev:demo <element-name>');
      this.log('');
    }
  }

  private getReactElements(reactElementsPath: string): string[] {
    return readdirSync(reactElementsPath).filter((name: string) => {
      const path = join(reactElementsPath, name);
      return statSync(path).isDirectory() && name !== 'node_modules';
    });
  }

  private setupDemo(element: string, sourceDemo: string, targetDemo: string): void {
    // Create demo directory
    if (!existsSync(targetDemo)) {
      mkdirSync(targetDemo, { recursive: true });
    }

    // Copy and convert generate.js (model data) from CommonJS to ESM
    const generateJs = join(sourceDemo, 'generate.js');
    if (existsSync(generateJs)) {
      const content = readFileSync(generateJs, 'utf-8');
      // Convert CommonJS exports to ESM
      const esmContent = content.replace(/^exports\.model\s*=/m, 'export const model =');
      writeFileSync(join(targetDemo, 'generate.js'), esmContent);
    }

    // Generate index.html (entry point)
    const indexHtml = this.generateIndexHtml(element);
    writeFileSync(join(targetDemo, 'index.html'), indexHtml);

    // Generate App.svelte (demo component)
    const appSvelte = this.generateAppSvelte(element);
    writeFileSync(join(targetDemo, 'App.svelte'), appSvelte);

    // Generate main.ts (Svelte app entry)
    const mainTs = this.generateMainTs();
    writeFileSync(join(targetDemo, 'main.ts'), mainTs);

    // Generate vite.config.ts
    const viteConfig = this.generateViteConfig();
    writeFileSync(join(targetDemo, 'vite.config.ts'), viteConfig);

    // Update package.json to add local-esm-cdn as devDependency
    this.addLocalEsmCdnDependency(element);
  }

  private generateIndexHtml(element: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${element} - Demo</title>
  <!-- Basic CSS normalization -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">
  <style>
    * {
      box-sizing: border-box;
    }
    html {
      font-size: 16px;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      font-size: 16px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    /* Material-UI icon sizing fix */
    .MuiSvgIcon-root {
      font-size: 1.5rem !important;
    }
    /* Material-UI checkbox/radio sizing */
    .MuiCheckbox-root, .MuiRadio-root {
      padding: 9px !important;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./main.ts"></script>
</body>
</html>
`;
  }

  private generateAppSvelte(element: string): string {
    return `<script lang="ts">
import { onMount } from 'svelte';
import '@pie-elements-ng/element-player';

let player: any;
let session = $state({
  id: '1',
  element: '${element}',
  value: undefined,
});

onMount(async () => {
  // Load model data from generate.js
  const { model } = await import('./generate.js');

  if (player) {
    // Set model
    player.model = model('1', '${element}');

    // Set initial session
    player.session = session;

    // Listen for session changes
    player.addEventListener('session-changed', (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('Session updated:', customEvent.detail);
      session = customEvent.detail;
    });

    console.log('Demo initialized for ${element}');
  }
});
</script>

<div class="demo">
  <h1>${element} Demo</h1>

  <div class="demo-container">
    <pie-esm-element-player
      bind:this={player}
      element-name="${element}"
    ></pie-esm-element-player>
  </div>
</div>

<style>
  :global(body) {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 900px;
    margin: 2rem auto;
    padding: 0 1rem;
  }

  h1 {
    color: #333;
    margin-bottom: 2rem;
  }

  .demo-container {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 2rem;
    margin-bottom: 2rem;
  }
</style>
`;
  }

  private generateViteConfig(): string {
    return `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { createVitePlugin } from '@pie-elements-ng/local-esm-cdn/adapters/vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find workspace root by looking for turbo.json
function findWorkspaceRoot(startDir: string): string {
  let currentDir = startDir;
  while (currentDir !== path.dirname(currentDir)) {
    if (existsSync(path.join(currentDir, 'turbo.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  throw new Error('Could not find workspace root (turbo.json not found)');
}

const repoRoot = findWorkspaceRoot(__dirname);

export default defineConfig({
  plugins: [
    svelte(),
    createVitePlugin({
      repoRoot,
      esmShBaseUrl: 'https://esm.sh',
    }),
  ],
  optimizeDeps: {
    exclude: ['@pie-element/*', '@pie-lib/*', '@pie-elements-ng/*', '@pie-framework/*'],
  },
  server: {
    port: 5174,
    fs: {
      // Allow serving files from the monorepo root
      allow: [repoRoot],
    },
  },
});
`;
  }

  private addLocalEsmCdnDependency(element: string): void {
    const reactElementsPath = join(process.cwd(), 'packages/elements-react');
    const packageJsonPath = join(reactElementsPath, element, 'package.json');

    if (!existsSync(packageJsonPath)) {
      return;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    // Add to devDependencies
    if (!packageJson.devDependencies) {
      packageJson.devDependencies = {};
    }

    let updated = false;

    if (!packageJson.devDependencies['@pie-elements-ng/local-esm-cdn']) {
      packageJson.devDependencies['@pie-elements-ng/local-esm-cdn'] = 'workspace:*';
      updated = true;
    }

    if (!packageJson.devDependencies['@pie-elements-ng/element-player']) {
      packageJson.devDependencies['@pie-elements-ng/element-player'] = 'workspace:*';
      updated = true;
    }

    if (!packageJson.devDependencies['@sveltejs/vite-plugin-svelte']) {
      packageJson.devDependencies['@sveltejs/vite-plugin-svelte'] = '^5.0.0';
      updated = true;
    }

    if (!packageJson.devDependencies.svelte) {
      packageJson.devDependencies.svelte = '^5.0.0';
      updated = true;
    }

    if (updated) {
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    }
  }

  private generateMainTs(): string {
    return `import { mount } from 'svelte';
import App from './App.svelte';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
`;
  }
}
