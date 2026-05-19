import AxeBuilder from '@axe-core/playwright';
import { test, type Page, type TestInfo } from '@playwright/test';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ELEMENT_REGISTRY, type ElementMetadata } from '../../src/lib/elements/registry';
import { waitForMathRendering } from '../e2e/test-helpers';

type ScanMode = 'gather' | 'evaluate';
type ScanStatus = 'passed' | 'violations' | 'error';

type DemoSummary = {
  id: string;
  title: string;
  description?: string;
  tags: string[];
};

type AxeNodeSummary = {
  target: string[];
  html: string;
  failureSummary?: string;
};

type AxeViolationSummary = {
  id: string;
  impact?: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNodeSummary[];
  suggestedJiraTitle: string;
};

type ScanTarget = {
  element: ElementMetadata;
  demo: DemoSummary;
  mode: ScanMode;
  role: 'student' | 'instructor';
  route: string;
};

type ScanRecord = ScanTarget & {
  status: ScanStatus;
  durationMs: number;
  violationCount: number;
  violations: AxeViolationSummary[];
  error?: string;
  consoleErrors: string[];
};

type RawAxeViolation = {
  id: string;
  impact?: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNodeSummary[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const samplesRoot = resolve(__dirname, '../../src/lib/samples');
const reportDir = resolve(process.cwd(), process.env.A11Y_REPORT_DIR || 'test-results/a11y');
const records: ScanRecord[] = [];

const elementFilter = process.env.A11Y_ELEMENT?.trim();
const demoFilter = process.env.A11Y_DEMO?.trim();
const modeFilter = process.env.A11Y_MODE?.trim() as ScanMode | undefined;
const maxTargets = Number.parseInt(process.env.A11Y_MAX_TARGETS || '', 10);
const runInventorySuite = process.env.A11Y_SUITE === 'inventory';

function roleForMode(mode: ScanMode): 'student' | 'instructor' {
  return mode === 'evaluate' ? 'instructor' : 'student';
}

function loadDemos(elementName: string): DemoSummary[] {
  const samplePath = resolve(samplesRoot, `${elementName}.json`);
  if (!existsSync(samplePath)) {
    return [
      {
        id: 'default',
        title: 'Default',
        description: 'Fallback demo because no sample file was found.',
        tags: ['fallback'],
      },
    ];
  }

  const parsed = JSON.parse(readFileSync(samplePath, 'utf-8')) as {
    demos?: Array<{
      id?: string;
      title?: string;
      description?: string;
      tags?: string[];
    }>;
  };

  const demos = parsed.demos ?? [];
  if (demos.length === 0) {
    return [
      {
        id: 'default',
        title: 'Default',
        description: 'Fallback demo because no demos were defined.',
        tags: ['fallback'],
      },
    ];
  }

  return demos.map((demo, index) => ({
    id: demo.id || `demo-${index + 1}`,
    title: demo.title || demo.id || `Demo ${index + 1}`,
    description: demo.description,
    tags: demo.tags ?? [],
  }));
}

function buildRoute(elementName: string, demoId: string, mode: ScanMode): string {
  const params = new URLSearchParams({
    demo: demoId,
    mode,
    player: 'esm',
  });
  return `/a11y/${elementName}/scan?${params.toString()}`;
}

function buildTargets(): ScanTarget[] {
  const targets = ELEMENT_REGISTRY.flatMap((element) => {
    if (elementFilter && element.name !== elementFilter) {
      return [];
    }

    return loadDemos(element.name).flatMap((demo) => {
      if (demoFilter && demo.id !== demoFilter) {
        return [];
      }

      return (['gather', 'evaluate'] as const).flatMap((mode) => {
        if (modeFilter && mode !== modeFilter) {
          return [];
        }

        return [
          {
            element,
            demo,
            mode,
            role: roleForMode(mode),
            route: buildRoute(element.name, demo.id, mode),
          },
        ];
      });
    });
  });

  return Number.isFinite(maxTargets) && maxTargets > 0 ? targets.slice(0, maxTargets) : targets;
}

function summarizeViolation(elementName: string, violation: RawAxeViolation): AxeViolationSummary {
  return {
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    nodes: violation.nodes.map((node) => ({
      target: node.target,
      html: node.html,
      failureSummary: node.failureSummary,
    })),
    suggestedJiraTitle: `[a11y][${elementName}] ${violation.help}`,
  };
}

async function runAxeScan(page: Page, target: ScanTarget, testInfo: TestInfo): Promise<ScanRecord> {
  const started = Date.now();
  const consoleErrors: string[] = [];
  const onConsole = (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  };

  page.on('console', onConsole);

  try {
    await page.goto(target.route);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[data-testid="a11y-scan-root"][data-a11y-ready="true"]', {
      timeout: 30_000,
    });
    await waitForMathRendering(page);

    const results = await new AxeBuilder({ page })
      .include('[data-testid="a11y-scan-subject"]')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const violations = (results.violations as RawAxeViolation[]).map((violation) =>
      summarizeViolation(target.element.name, violation)
    );

    if (violations.length > 0) {
      testInfo.annotations.push({
        type: 'a11y',
        description: `${violations.length} Axe violation(s) recorded in report`,
      });
    }

    return {
      ...target,
      status: violations.length > 0 ? 'violations' : 'passed',
      durationMs: Date.now() - started,
      violationCount: violations.length,
      violations,
      consoleErrors,
    };
  } catch (err) {
    return {
      ...target,
      status: 'error',
      durationMs: Date.now() - started,
      violationCount: 0,
      violations: [],
      error: err instanceof Error ? err.message : String(err),
      consoleErrors,
    };
  } finally {
    page.off('console', onConsole);
  }
}

function reportSummary() {
  const byStatus = records.reduce<Record<ScanStatus, number>>(
    (summary, record) => {
      summary[record.status] += 1;
      return summary;
    },
    { passed: 0, violations: 0, error: 0 }
  );

  const byElement = records.reduce<
    Record<string, { title: string; passed: number; violations: number; error: number }>
  >((summary, record) => {
    if (!summary[record.element.name]) {
      summary[record.element.name] = {
        title: record.element.title,
        passed: 0,
        violations: 0,
        error: 0,
      };
    }
    const entry = summary[record.element.name];
    entry[record.status] += 1;
    return summary;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      targets: records.length,
      passedTargets: byStatus.passed,
      targetsWithViolations: byStatus.violations,
      errorTargets: byStatus.error,
      axeViolations: records.reduce((sum, record) => sum + record.violationCount, 0),
    },
    byElement,
  };
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function writeReports() {
  mkdirSync(reportDir, { recursive: true });

  const summary = reportSummary();
  const jsonReport = {
    summary,
    records,
  };

  writeFileSync(resolve(reportDir, 'axe-a11y-report.json'), JSON.stringify(jsonReport, null, 2));
  writeFileSync(resolve(reportDir, 'axe-a11y-report.md'), renderMarkdownReport(summary));
}

function renderMarkdownReport(summary: ReturnType<typeof reportSummary>): string {
  const lines = [
    '# PIE Axe Accessibility Inventory',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Scan targets: ${summary.totals.targets}`,
    `- Passed targets: ${summary.totals.passedTargets}`,
    `- Targets with violations: ${summary.totals.targetsWithViolations}`,
    `- Targets with harness errors: ${summary.totals.errorTargets}`,
    `- Total Axe violations: ${summary.totals.axeViolations}`,
    '',
    '## Element Inventory',
    '',
    '| Element | Passed | With Violations | Errors |',
    '| --- | ---: | ---: | ---: |',
  ];

  for (const [elementName, elementSummary] of Object.entries(summary.byElement)) {
    lines.push(
      `| ${escapeMarkdownCell(`${elementSummary.title} (${elementName})`)} | ${elementSummary.passed} | ${elementSummary.violations} | ${elementSummary.error} |`
    );
  }

  lines.push('', '## Findings', '');

  const findings = records.filter((record) => record.status !== 'passed');
  if (findings.length === 0) {
    lines.push('No Axe violations or harness errors were recorded.');
  } else {
    for (const record of findings) {
      lines.push(
        `### ${record.element.title} / ${record.demo.title} / ${record.mode}`,
        '',
        `- Route: \`${record.route}\``,
        `- Status: ${record.status}`,
        `- Suggested ticket scope: \`[a11y][${record.element.name}] ${record.demo.title} ${record.mode}\``
      );

      if (record.error) {
        lines.push(`- Harness error: ${record.error}`);
      }

      for (const violation of record.violations) {
        lines.push(
          '',
          `- ${violation.impact ?? 'unknown'}: ${violation.help} (\`${violation.id}\`)`,
          `  - Help: ${violation.helpUrl}`,
          `  - Suggested Jira title: \`${violation.suggestedJiraTitle}\``,
          `  - Nodes: ${violation.nodes.length}`
        );
      }

      lines.push('');
    }
  }

  return `${lines.join('\n')}\n`;
}

const targets = runInventorySuite ? buildTargets() : [];

test.describe.configure({ mode: 'serial' });

test.describe('Axe accessibility inventory', () => {
  if (!runInventorySuite) {
    return;
  }

  for (const target of targets) {
    test(`${target.element.name} / ${target.demo.id} / ${target.mode}`, async ({
      page,
    }, testInfo) => {
      records.push(await runAxeScan(page, target, testInfo));
    });
  }

  test.afterAll(() => {
    writeReports();
  });
});
