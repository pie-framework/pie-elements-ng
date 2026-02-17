#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = process.cwd();
const defaultTargets = ['apps', 'packages', 'dist', 'build', 'esm'];
const targets = process.argv.slice(2);
const scanTargets = (targets.length ? targets : defaultTargets)
  .map((target) => resolve(root, target))
  .filter((target) => existsSync(target));

const ignoredDirs = new Set([
  '.git',
  'node_modules',
  '.turbo',
  '.svelte-kit',
  '.next',
  'coverage',
  'test-results',
  'playwright-report',
]);

const textExtensions = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.tsx',
  '.jsx',
  '.svelte',
  '.css',
  '.scss',
  '.json',
  '.md',
  '.html',
  '.txt',
  '.map',
  '.yml',
  '.yaml',
  '.sh',
]);

const localPathPatterns = [/\/Users\/[^/\s]+/g, /[A-Za-z]:\\Users\\[^\\\s]+/g];
const violations = [];

function shouldScanFile(path) {
  const extension = extname(path).toLowerCase();
  return textExtensions.has(extension) || extension === '';
}

function scanFile(path) {
  if (!shouldScanFile(path)) {
    return;
  }

  let content = '';
  try {
    content = readFileSync(path, 'utf-8');
  } catch {
    return;
  }

  for (const pattern of localPathPatterns) {
    const match = pattern.exec(content);
    pattern.lastIndex = 0;
    if (match) {
      violations.push({
        path,
        sample: match[0],
      });
      return;
    }
  }
}

function walk(path) {
  const stats = statSync(path);
  if (stats.isDirectory()) {
    const dirName = path.split('/').pop();
    if (dirName && ignoredDirs.has(dirName)) {
      return;
    }
    for (const entry of readdirSync(path)) {
      walk(join(path, entry));
    }
    return;
  }
  scanFile(path);
}

for (const target of scanTargets) {
  walk(target);
}

if (violations.length > 0) {
  console.error('Found local filesystem paths in repository/build artifacts:');
  for (const violation of violations) {
    console.error(`- ${violation.path}: ${violation.sample}`);
  }
  process.exit(1);
}

console.log('No local filesystem path leaks found.');
