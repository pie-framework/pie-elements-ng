#!/usr/bin/env bun
/**
 * Adds version field to package.json files that are missing it
 */

import { $ } from 'bun';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DEFAULT_VERSION = '0.0.0';

function findPackageJsonFiles(dir: string): string[] {
  const results: string[] = [];

  try {
    const items = readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      // Skip node_modules and hidden directories
      if (item.name === 'node_modules' || item.name.startsWith('.')) {
        continue;
      }

      const fullPath = join(dir, item.name);

      if (item.isDirectory()) {
        results.push(...findPackageJsonFiles(fullPath));
      } else if (item.name === 'package.json') {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors (permission denied, etc.)
  }

  return results;
}

async function addVersionsToPackageJsons() {
  const dirs = ['packages', 'apps', 'tools'];
  let fixed = 0;

  for (const dir of dirs) {
    const packageJsonFiles = findPackageJsonFiles(dir);

    for (const file of packageJsonFiles) {
      try {
        const content = readFileSync(file, 'utf-8');
        const pkg = JSON.parse(content);

        // Skip if version already exists
        if (pkg.version) {
          continue;
        }

        // Add version field
        pkg.version = DEFAULT_VERSION;

        // Write back with proper formatting
        const updated = JSON.stringify(pkg, null, 2) + '\n';
        writeFileSync(file, updated, 'utf-8');

        console.log(`✅ Added version to ${file}`);
        fixed++;
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error);
      }
    }
  }

  console.log(`\n✨ Fixed ${fixed} package.json files`);
}

await addVersionsToPackageJsons();
