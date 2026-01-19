#!/usr/bin/env node
/**
 * React demo runner script - starts a demo server for a specific React element
 * Usage: bun react-demo --element categorize
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

async function main() {
  const args = process.argv.slice(2);
  const elementIndex = args.indexOf('--element');

  if (elementIndex === -1 || !args[elementIndex + 1]) {
    console.error('❌ Error: --element parameter is required');
    console.error('');
    console.error('Usage: bun react-demo --element <element-name>');
    console.error('');
    console.error('Examples:');
    console.error('  bun react-demo --element categorize');
    console.error('  bun react-demo --element multiple-choice');
    console.error('');
    process.exit(1);
  }

  const element = args[elementIndex + 1];
  const elementDir = resolve(process.cwd(), `packages/elements-react/${element}`);

  if (!existsSync(elementDir)) {
    console.error(`❌ Error: Element '${element}' not found at ${elementDir}`);
    console.error('');
    console.error('Available elements are in: packages/elements-react/');
    console.error('');
    process.exit(1);
  }

  const packageJsonPath = resolve(elementDir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.error(`❌ Error: No package.json found for element '${element}'`);
    process.exit(1);
  }

  // Always build to ensure the element and element-player are up to date
  console.log(
    `📦 Building element '${element}' and its dependencies (including element-player)...`
  );
  console.log('');

  // Build the element; Turbo's `dependsOn: ["^build"]` will also build its deps.
  // NOTE: In Turborepo filter syntax, `pkg...` means "dependents of pkg" (not dependencies),
  // which can accidentally skip building the element itself.
  const buildProcess = spawn('bun', ['run', 'build', '--filter', `@pie-element/${element}`], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  });

  await new Promise((resolve, reject) => {
    buildProcess.on('error', (error) => {
      console.error(`❌ Build failed: ${error.message}`);
      reject(error);
    });

    buildProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`❌ Build exited with code ${code}`);
        reject(new Error(`Build failed with code ${code}`));
      } else {
        console.log('');
        console.log('✅ Build completed successfully');
        console.log('');
        resolve();
      }
    });
  });

  console.log(`🚀 Starting demo for '${element}'...`);
  console.log(`📁 Directory: ${elementDir}`);
  console.log(`🌐 Server: http://localhost:5174`);
  console.log('');

  // Start demo with static server (serves pre-built bundles like pie-players)
  const demoDir = resolve(elementDir, 'docs/demo');
  const child = spawn('node', [resolve(process.cwd(), 'scripts/static-demo-server.js'), demoDir], {
    stdio: 'inherit',
    shell: false,
  });

  child.on('error', (error) => {
    console.error(`❌ Failed to start demo: ${error.message}`);
    process.exit(1);
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Demo exited with code ${code}`);
      process.exit(code);
    }
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log('\n👋 Stopping demo server...');
    child.kill('SIGINT');
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error.message);
  process.exit(1);
});
