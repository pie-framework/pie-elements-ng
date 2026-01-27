#!/usr/bin/env bun
/**
 * Remove "private": true from all React element package.json files
 * so they can be published to Verdaccio for testing
 */

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const reactElementsDir = 'packages/elements-react';

const elements = readdirSync(reactElementsDir).filter((name) => {
  const path = join(reactElementsDir, name);
  return statSync(path).isDirectory() && name !== 'node_modules';
});

let updated = 0;

for (const element of elements) {
  const pkgPath = join(reactElementsDir, element, 'package.json');

  try {
    const content = readFileSync(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);

    if (pkg.private === true) {
      delete pkg.private;
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`✅ ${element}: Removed private flag`);
      updated++;
    } else {
      console.log(`⏭️  ${element}: Already publishable`);
    }
  } catch (error) {
    console.error(`❌ ${element}: ${error}`);
  }
}

console.log(`\n✨ Updated ${updated} React elements`);
