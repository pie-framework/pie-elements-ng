#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();

const trackedFiles = execSync('git ls-files -z', { cwd: root, encoding: 'utf8' })
  .split('\u0000')
  .filter(Boolean)
  .filter((file) => file.startsWith('packages/elements-svelte/') && file.endsWith('.svelte'));

const violations = [];
const optionsBlockPattern = /<svelte:options[\s\S]*?\/>/g;
const tagPattern = /\bcustomElement\s*=\s*\{\{[\s\S]*?\btag\s*:/;

function lineForOffset(content, offset) {
  const prior = content.slice(0, offset);
  return prior.split('\n').length;
}

for (const relativePath of trackedFiles) {
  const absolutePath = resolve(root, relativePath);
  const content = readFileSync(absolutePath, 'utf8');
  const optionsBlocks = content.matchAll(optionsBlockPattern);
  for (const match of optionsBlocks) {
    const block = match[0];
    if (!tagPattern.test(block)) {
      continue;
    }
    const tagOffsetInBlock = block.search(/\btag\s*:/);
    const absoluteOffset = (match.index ?? 0) + Math.max(0, tagOffsetInBlock);
    violations.push({
      path: relativePath,
      line: lineForOffset(content, absoluteOffset),
    });
  }
}

if (violations.length > 0) {
  console.error(
    'Found forbidden `tag:` in `<svelte:options customElement={{...}}>` for Svelte element packages.'
  );
  console.error(
    'These tags auto-register custom elements and conflict with player-controlled registration.'
  );
  for (const violation of violations) {
    console.error(`- ${violation.path}:${violation.line}`);
  }
  process.exit(1);
}

console.log('No forbidden Svelte customElement tags found.');
