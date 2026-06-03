#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { runPublishSurfaceCheck } from './check-publish-surface.mjs';
import { runSourcemapSourceCheck } from './check-sourcemap-sources.mjs';
import { createPackageSnapshots } from './lib/package-inspection.mjs';

const childSteps = [
  {
    name: 'Controller package contract',
    command: ['bun', 'run', 'cli', 'verify:controllers'],
  },
  {
    name: 'Runtime support export contract',
    command: ['bun', './scripts/verify-runtime-support-exports.mjs'],
  },
];

export const createPackageSnapshotsForContracts = ({ root = process.cwd(), packRunner } = {}) =>
  createPackageSnapshots({ root, includePackedFiles: true, packRunner });

export const defaultRunChildProcess = (command) =>
  spawnSync(command[0], command.slice(1), {
    stdio: 'inherit',
    shell: false,
  });

export const createContractSteps = ({
  root = process.cwd(),
  snapshots,
  runChildProcess = defaultRunChildProcess,
} = {}) => [
  {
    name: 'NPM packaging surface',
    run: (io) => runPublishSurfaceCheck({ root, snapshots, ...io }),
  },
  {
    name: 'Controller package contract',
    run: () => runChildProcess(childSteps[0].command),
  },
  {
    name: 'Runtime support export contract',
    run: () => runChildProcess(childSteps[1].command),
  },
  {
    name: 'Sourcemap source contract',
    run: (io) => runSourcemapSourceCheck({ root, snapshots, ...io }),
  },
];

export const runElementContractVerification = ({
  root = process.cwd(),
  packRunner,
  runChildProcess = defaultRunChildProcess,
  log = console.log,
  error = console.error,
} = {}) => {
  const snapshots = createPackageSnapshotsForContracts({ root, packRunner });
  const steps = createContractSteps({ root, snapshots, runChildProcess });
  const failures = [];
  const stepResults = [];

  for (const step of steps) {
    log(`\n== ${step.name} ==`);
    const result = step.run({ log, error });
    stepResults.push({ name: step.name, result });

    const failed = typeof result?.ok === 'boolean' ? !result.ok : result.status !== 0;
    if (failed) {
      failures.push(step.name);
    }
  }

  if (failures.length > 0) {
    error('\nPIE element contract verification failed:');
    for (const failure of failures) {
      error(`- ${failure}`);
    }
    return { ok: false, failures, steps: stepResults, snapshots };
  }

  log('\nPIE element contract verification passed.');
  return { ok: true, failures, steps: stepResults, snapshots };
};

const isDirectRun = () =>
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun()) {
  const result = runElementContractVerification();
  if (!result.ok) process.exit(1);
}
