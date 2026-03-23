#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import process from 'node:process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const demoUrl = 'http://localhost:5222';
const maxE2eAttempts = Math.max(Number.parseInt(process.env.IIFE_E2E_RETRIES ?? '2', 10) || 2, 1);
const retryableFailurePatterns = [
  /ERR_CONNECTION_REFUSED/i,
  /ECONNREFUSED/i,
  /connection refused/i,
  /net::ERR_CONNECTION_CLOSED/i,
  /webServer was not able to start/i,
  /Target page, context or browser has been closed/i,
];

const nonRetryableFailurePatterns = [
  /IIFE usefulness failures/i,
  /Smoke matrix found \d+ failing cases/i,
  /expect\(.*\)/i,
  /Timeout \d+ms exceeded/i,
  /Module parse failed/i,
  /ReferenceError:/i,
  /TypeError:/i,
];

const dryRun = process.argv.includes('--dry-run');

let serverProcess = null;
let startedServer = false;
let stoppingServer = false;
let serverExitedUnexpectedly = false;

const log = (...args) => {
  process.stdout.write(`[iife-suite] ${args.join(' ')}\n`);
};

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerUp() {
  try {
    const response = await fetch(demoUrl, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForServer(timeoutMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isServerUp()) {
      return true;
    }
    await delay(1000);
  }
  return false;
}

function runCommand(command, args, options = {}) {
  const pretty = [command, ...args].join(' ');
  log(`running: ${pretty}`);
  if (dryRun) {
    return Promise.resolve({ code: 0, output: '' });
  }
  return new Promise((resolve, reject) => {
    const { captureOutput = false, env: envOverrides, ...spawnOptions } = options;
    let combinedOutput = '';
    const stdoutMode = captureOutput === true ? 'pipe' : 'inherit';
    const stderrMode = captureOutput === true ? 'pipe' : 'inherit';
    const childEnv = envOverrides ? { ...process.env, ...envOverrides } : process.env;
    const child = spawn(command, args, {
      cwd: repoRoot,
      stdio: ['inherit', stdoutMode, stderrMode],
      env: childEnv,
      ...spawnOptions,
    });

    if (captureOutput === true) {
      child.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        combinedOutput += text;
        process.stdout.write(text);
      });
      child.stderr?.on('data', (chunk) => {
        const text = chunk.toString();
        combinedOutput += text;
        process.stderr.write(text);
      });
    }

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${pretty} exited via signal ${signal}`));
      } else {
        resolve({ code: code ?? 1, output: combinedOutput });
      }
    });
  });
}

function classifyE2eFailure(output, serverHealthy) {
  const nonRetryableMatch = nonRetryableFailurePatterns.find((pattern) => pattern.test(output));
  if (nonRetryableMatch) {
    return {
      retryable: false,
      reason: `matched non-retryable pattern ${nonRetryableMatch}`,
    };
  }

  if (!serverHealthy) {
    return {
      retryable: true,
      reason: 'demo server is not reachable after e2e failure',
    };
  }
  const matched = retryableFailurePatterns.find((pattern) => pattern.test(output));
  if (matched) {
    return {
      retryable: true,
      reason: `matched retryable pattern ${matched}`,
    };
  }
  return {
    retryable: false,
    reason: 'non-network test failure (likely assertion/runtime regression)',
  };
}

async function stopServer() {
  if (!serverProcess || serverProcess.killed) {
    return;
  }
  if (serverProcess.exitCode !== null) {
    serverProcess = null;
    return;
  }
  log('stopping demo server');
  stoppingServer = true;
  serverProcess.kill('SIGTERM');
  const exited = await Promise.race([
    new Promise((resolve) => serverProcess.once('exit', () => resolve(true))),
    delay(10_000).then(() => false),
  ]);
  if (!exited) {
    serverProcess.kill('SIGKILL');
  }
  stoppingServer = false;
  serverProcess = null;
}

async function restartServer(reason) {
  log(`restarting demo server (${reason})`);
  await stopServer();
  startedServer = false;
  serverExitedUnexpectedly = false;
  await ensureServer();
}

async function ensureServer() {
  if (await isServerUp()) {
    log('demo server already running, reusing it');
    return;
  }
  log('starting demo server once for iife suite');
  if (dryRun) {
    return;
  }
  serverProcess = spawn('bun', ['run', '--cwd', 'apps/element-demo', 'dev'], {
    cwd: repoRoot,
    stdio: 'inherit',
    env: process.env,
  });
  startedServer = true;
  serverExitedUnexpectedly = false;
  serverProcess.on('exit', (code, signal) => {
    if (stoppingServer) {
      return;
    }
    serverExitedUnexpectedly = true;
    log(`demo server exited unexpectedly (code=${String(code)} signal=${String(signal)})`);
  });

  const ok = await waitForServer();
  if (!ok) {
    throw new Error('demo server did not become ready at http://localhost:5222');
  }
  log('demo server is ready');
}

async function runIifeE2eWithRetry() {
  for (let attempt = 1; attempt <= maxE2eAttempts; attempt += 1) {
    await ensureServer();
    if (serverExitedUnexpectedly) {
      await restartServer('detected unexpected exit before iife e2e run');
    }
    log(`iife e2e attempt ${attempt}/${maxE2eAttempts}`);
    const result = await runCommand(
      'bun',
      ['run', '--cwd', 'apps/element-demo', 'test:e2e:iife:suite:orchestrated'],
      { captureOutput: true }
    );
    if (result.code === 0) {
      return 0;
    }

    const serverHealthy = await isServerUp();
    const classification = classifyE2eFailure(result.output, serverHealthy);
    log(
      `iife e2e failed on attempt ${attempt}: ${classification.reason}; retryable=${
        classification.retryable ? 'yes' : 'no'
      }`
    );

    if (!classification.retryable || attempt === maxE2eAttempts) {
      return result.code;
    }

    await restartServer(`retry after iife e2e failure (attempt ${attempt})`);
  }
  return 1;
}

async function main() {
  const cleanup = async () => {
    if (startedServer) {
      await stopServer();
    }
  };

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(130);
  });
  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(143);
  });

  try {
    await ensureServer();

    if (serverExitedUnexpectedly) {
      await restartServer('detected unexpected exit before bundle contract run');
    }

    const bundleResult = await runCommand('bun', [
      'run',
      '--cwd',
      'apps/element-demo',
      'test:iife:bundle',
    ]);
    if (bundleResult.code !== 0) {
      process.exit(bundleResult.code);
    }

    const e2eCode = await runIifeE2eWithRetry();
    if (e2eCode !== 0) {
      process.exit(e2eCode);
    }

    log('iife suite completed');
  } finally {
    await cleanup();
  }
}

await main();
