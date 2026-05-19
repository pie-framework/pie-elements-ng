import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { ELEMENT_REGISTRY } from '$lib/elements/registry';
import { getA11yScenario } from '$lib/a11y/scenarios/catalog';
import type {
  A11yReportLink,
  A11yRunJobSnapshot,
  A11yRunRequest,
  A11yRunScope,
  A11yRunStatus,
} from '$lib/a11y/run-types';

type InternalA11yRunJob = A11yRunJobSnapshot & {
  process?: ChildProcessWithoutNullStreams;
  reportDir: string;
  htmlReportDir: string;
};

export type A11yReportFileKey =
  | 'scenario-json'
  | 'scenario-md'
  | 'inventory-json'
  | 'inventory-md'
  | 'html';

export interface A11yReportFile {
  path: string;
  contentType: string;
}

const jobs = new Map<string, InternalA11yRunJob>();
const appRoot = process.cwd();
const outputTailLimit = 20_000;

function activeJob(): InternalA11yRunJob | undefined {
  return [...jobs.values()].find((job) => job.status === 'queued' || job.status === 'running');
}

export function startA11yRun(request: A11yRunRequest): A11yRunJobSnapshot {
  validateRunRequest(request);

  const runningJob = activeJob();
  if (runningJob) {
    throw new Error(`A11y run ${runningJob.id} is already ${runningJob.status}.`);
  }

  const id = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  const reportDir = `test-results/a11y/runs/${id}`;
  const htmlReportDir = `playwright-a11y-report/runs/${id}`;
  const { args, command, env } = buildCommand(request, reportDir, htmlReportDir);

  const job: InternalA11yRunJob = {
    id,
    scope: request.scope,
    status: 'queued',
    command,
    createdAt: new Date().toISOString(),
    element: request.element,
    scenario: request.scenario,
    outputTail: '',
    reportLinks: buildReportLinks(id, request.scope),
    reportDir,
    htmlReportDir,
  };

  jobs.set(id, job);

  const child = spawn('bun', args, {
    cwd: appRoot,
    env,
  });

  job.process = child;
  job.status = 'running';
  job.startedAt = new Date().toISOString();

  child.stdout.on('data', (chunk) => appendOutput(job, chunk));
  child.stderr.on('data', (chunk) => appendOutput(job, chunk));
  child.on('error', (err) => {
    appendOutput(job, err.message);
    finishJob(job, 'failed');
  });
  child.on('close', (exitCode) => {
    job.exitCode = exitCode ?? undefined;
    finishJob(job, exitCode === 0 ? inferCompletedStatus(job) : 'failed');
  });

  return snapshot(job);
}

export function getA11yRun(id: string): A11yRunJobSnapshot | undefined {
  const job = jobs.get(id);
  return job ? snapshot(job) : undefined;
}

export function getA11yReportFile(
  runId: string,
  fileKey: A11yReportFileKey
): A11yReportFile | undefined {
  const job = jobs.get(runId);
  if (!job) {
    return undefined;
  }

  const candidates: Record<A11yReportFileKey, A11yReportFile> = {
    'scenario-json': {
      path: join(appRoot, job.reportDir, 'axe-a11y-scenarios-report.json'),
      contentType: 'application/json; charset=utf-8',
    },
    'scenario-md': {
      path: join(appRoot, job.reportDir, 'axe-a11y-scenarios-report.md'),
      contentType: 'text/markdown; charset=utf-8',
    },
    'inventory-json': {
      path: join(appRoot, job.reportDir, 'axe-a11y-report.json'),
      contentType: 'application/json; charset=utf-8',
    },
    'inventory-md': {
      path: join(appRoot, job.reportDir, 'axe-a11y-report.md'),
      contentType: 'text/markdown; charset=utf-8',
    },
    html: {
      path: join(appRoot, job.htmlReportDir, 'index.html'),
      contentType: 'text/html; charset=utf-8',
    },
  };

  const file = candidates[fileKey];
  return existsSync(file.path) ? file : undefined;
}

function validateRunRequest(request: A11yRunRequest) {
  if (!isKnownScope(request.scope)) {
    throw new Error(`Unknown a11y run scope: ${request.scope}`);
  }

  if (request.element && !ELEMENT_REGISTRY.some((element) => element.name === request.element)) {
    throw new Error(`Unknown PIE element: ${request.element}`);
  }

  if (request.scope === 'element-scenarios' && !request.element) {
    throw new Error('Element scenario runs require an element.');
  }

  if (request.scope === 'single-scenario') {
    if (!request.element || !request.scenario) {
      throw new Error('Single scenario runs require an element and scenario.');
    }
    if (!getA11yScenario(request.element, request.scenario)) {
      throw new Error(`Unknown a11y scenario: ${request.element}/${request.scenario}`);
    }
  }
}

function isKnownScope(scope: string): scope is A11yRunScope {
  return ['full-scenarios', 'element-scenarios', 'single-scenario', 'inventory'].includes(scope);
}

function buildCommand(request: A11yRunRequest, reportDir: string, htmlReportDir: string) {
  const args =
    request.scope === 'inventory' ? ['run', 'test:a11y:inventory'] : ['run', 'test:a11y'];
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PIE_A11Y_EXTERNAL_SERVER: '1',
    A11Y_REPORT_DIR: reportDir,
    A11Y_PLAYWRIGHT_REPORT_DIR: htmlReportDir,
  };

  if (request.element) {
    env.A11Y_ELEMENT = request.element;
  }
  if (request.scenario) {
    env.A11Y_SCENARIO = request.scenario;
  }
  if (request.scope === 'inventory') {
    env.A11Y_SUITE = 'inventory';
  }

  const filters = [
    request.element ? `A11Y_ELEMENT=${request.element}` : undefined,
    request.scenario ? `A11Y_SCENARIO=${request.scenario}` : undefined,
  ].filter(Boolean);
  const command = [...filters, 'bun', ...args].join(' ');

  return { args, command, env };
}

function appendOutput(job: InternalA11yRunJob, chunk: unknown) {
  job.outputTail = `${job.outputTail}${String(chunk)}`.slice(-outputTailLimit);
}

function finishJob(job: InternalA11yRunJob, status: A11yRunStatus) {
  job.status = status;
  job.completedAt = new Date().toISOString();
  job.process = undefined;
}

function inferCompletedStatus(job: InternalA11yRunJob): A11yRunStatus {
  const scenarioSummary = readJsonSummary(
    join(appRoot, job.reportDir, 'axe-a11y-scenarios-report.json')
  );
  const inventorySummary = readJsonSummary(join(appRoot, job.reportDir, 'axe-a11y-report.json'));

  const hasScenarioFindings =
    Number(scenarioSummary?.totals?.scenariosWithFindings ?? 0) > 0 ||
    Number(scenarioSummary?.totals?.errorScenarios ?? 0) > 0;
  const hasInventoryFindings =
    Number(inventorySummary?.totals?.targetsWithViolations ?? 0) > 0 ||
    Number(inventorySummary?.totals?.errorTargets ?? 0) > 0;

  return hasScenarioFindings || hasInventoryFindings ? 'findings' : 'passed';
}

function readJsonSummary(path: string): any {
  if (!existsSync(path)) {
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8')).summary;
  } catch {
    return undefined;
  }
}

function buildReportLinks(runId: string, scope: A11yRunScope): A11yReportLink[] {
  const prefix = `/a11y/api/reports/${runId}`;
  const reportLinks =
    scope === 'inventory'
      ? [
          { label: 'Inventory JSON', href: `${prefix}/inventory-json` },
          { label: 'Inventory Markdown', href: `${prefix}/inventory-md` },
        ]
      : [
          { label: 'Scenario JSON', href: `${prefix}/scenario-json` },
          { label: 'Scenario Markdown', href: `${prefix}/scenario-md` },
        ];

  return [
    { label: 'Formatted report', href: `/a11y/reports/${runId}` },
    ...reportLinks,
    { label: 'Playwright HTML', href: `${prefix}/html` },
  ];
}

function snapshot(job: InternalA11yRunJob): A11yRunJobSnapshot {
  return {
    id: job.id,
    scope: job.scope,
    status: job.status,
    command: job.command,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    exitCode: job.exitCode,
    element: job.element,
    scenario: job.scenario,
    outputTail: job.outputTail,
    reportLinks: job.reportLinks,
  };
}

export function assertReportPathWithinApp(filePath: string) {
  const resolved = resolve(filePath);
  if (!resolved.startsWith(resolve(appRoot))) {
    throw new Error('Report path is outside the app root.');
  }
}
