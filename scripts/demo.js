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

  // Always build to ensure the element is up to date
  console.log(`📦 Building element '${element}' and its dependencies...`);
  console.log('');

  const buildProcess = spawn('bun', ['run', 'build', '--filter', `@pie-element/${element}...`], {
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

  const child = spawn('bun', ['run', 'demo'], {
    cwd: elementDir,
    stdio: 'inherit',
    shell: true,
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
