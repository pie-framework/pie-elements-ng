#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const steps = [
  {
    name: 'NPM packaging surface',
    command: ['bun', './scripts/check-publish-surface.mjs'],
  },
  {
    name: 'Controller package contract',
    command: ['bun', 'run', 'cli', 'verify:controllers'],
    marker: 'verify:controllers',
  },
  {
    name: 'Runtime support export contract',
    command: ['bun', './scripts/verify-runtime-support-exports.mjs'],
  },
  {
    name: 'Sourcemap source contract',
    command: ['bun', './scripts/check-sourcemap-sources.mjs'],
  },
];

const failures = [];

for (const step of steps) {
  console.log(`\n== ${step.name} ==`);
  const result = spawnSync(step.command[0], step.command.slice(1), {
    stdio: 'inherit',
    shell: false,
  });

  if (result.status !== 0) {
    failures.push(step.name);
  }
}

if (failures.length > 0) {
  console.error('\nPIE element contract verification failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('\nPIE element contract verification passed.');
