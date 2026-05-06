import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getAllA11yScenarios } from '../../src/lib/a11y/scenarios/catalog';
import type {
  A11yAutomatedCheck,
  A11yConcern,
  A11yScenarioDefinition,
} from '../../src/lib/a11y/scenarios/types';
import { ELEMENT_REGISTRY, type ElementMetadata } from '../../src/lib/elements/registry';
import { waitForMathRendering } from '../e2e/test-helpers';

type ScanStatus = 'passed' | 'findings' | 'error';
type CheckStatus = 'passed' | 'failed' | 'skipped';

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

type RawAxeViolation = {
  id: string;
  impact?: string;
  help: string;
  helpUrl: string;
  tags: string[];
  nodes: AxeNodeSummary[];
};

type ScanTarget = {
  element: ElementMetadata;
  scenario: A11yScenarioDefinition;
  route: string;
};

type CheckResult = {
  check: A11yAutomatedCheck;
  status: CheckStatus;
  message: string;
  details?: string[];
};

type ScanRecord = ScanTarget & {
  status: ScanStatus;
  durationMs: number;
  violationCount: number;
  violations: AxeViolationSummary[];
  checks: CheckResult[];
  error?: string;
  consoleErrors: string[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const reportDir = resolve(process.cwd(), process.env.A11Y_REPORT_DIR || 'test-results/a11y');
const records: ScanRecord[] = [];

const elementFilter = process.env.A11Y_ELEMENT?.trim();
const scenarioFilter = process.env.A11Y_SCENARIO?.trim();
const concernFilter = process.env.A11Y_CONCERN?.trim() as A11yConcern | undefined;
const maxTargets = Number.parseInt(process.env.A11Y_MAX_TARGETS || '', 10);
const enforce = process.env.A11Y_ENFORCE === '1';
const runScenarioSuite = process.env.A11Y_SUITE !== 'inventory';

function buildRoute(elementName: string, scenarioId: string): string {
  const params = new URLSearchParams({
    scenario: scenarioId,
    player: 'esm',
  });
  return `/a11y/${elementName}/scan?${params.toString()}`;
}

function buildTargets(): ScanTarget[] {
  const scenarios = getAllA11yScenarios().filter((scenario) => {
    if (elementFilter && scenario.element !== elementFilter) {
      return false;
    }
    if (scenarioFilter && scenario.id !== scenarioFilter) {
      return false;
    }
    if (concernFilter && !scenario.concerns.includes(concernFilter)) {
      return false;
    }
    return true;
  });

  const targets = scenarios.flatMap((scenario) => {
    const element = ELEMENT_REGISTRY.find((entry) => entry.name === scenario.element);
    return element ? [{ element, scenario, route: buildRoute(element.name, scenario.id) }] : [];
  });

  return Number.isFinite(maxTargets) && maxTargets > 0 ? targets.slice(0, maxTargets) : targets;
}

function summarizeViolation(
  elementName: string,
  scenario: A11yScenarioDefinition,
  violation: RawAxeViolation
): AxeViolationSummary {
  const criterion = scenario.wcagCriteria[0] ?? 'wcag';
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
    suggestedJiraTitle: `[a11y][${elementName}][${criterion}] ${scenario.title}`,
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
      summarizeViolation(target.element.name, target.scenario, violation)
    );
    const checks = await runScenarioChecks(page, target.scenario);
    const failedChecks = checks.filter((check) => check.status === 'failed');

    if (violations.length > 0) {
      testInfo.annotations.push({
        type: 'a11y',
        description: `${violations.length} Axe violation(s) recorded in report`,
      });
    }
    if (failedChecks.length > 0) {
      testInfo.annotations.push({
        type: 'a11y-check',
        description: `${failedChecks.length} scenario check failure(s) recorded in report`,
      });
    }

    return {
      ...target,
      status: violations.length > 0 || failedChecks.length > 0 ? 'findings' : 'passed',
      durationMs: Date.now() - started,
      violationCount: violations.length,
      violations,
      checks,
      consoleErrors,
    };
  } catch (err) {
    return {
      ...target,
      status: 'error',
      durationMs: Date.now() - started,
      violationCount: 0,
      violations: [],
      checks: [],
      error: err instanceof Error ? err.message : String(err),
      consoleErrors,
    };
  } finally {
    page.off('console', onConsole);
  }
}

async function runScenarioChecks(
  page: Page,
  scenario: A11yScenarioDefinition
): Promise<CheckResult[]> {
  const checks = scenario.automatedChecks.filter((check) => check !== 'axe');
  const results: CheckResult[] = [];

  for (const check of checks) {
    if (check === 'interactive-control-name') {
      results.push(await checkInteractiveControlNames(page));
    } else if (check === 'keyboard-tab-reach') {
      results.push(await checkKeyboardTabReach(page));
    } else if (check === 'target-size') {
      results.push(await checkTargetSize(page));
    } else if (check === 'status-message') {
      results.push(await checkStatusMessage(page));
    }
  }

  return results;
}

async function checkInteractiveControlNames(page: Page): Promise<CheckResult> {
  const details = await page.locator('[data-testid="a11y-scan-subject"]').evaluate((subject) => {
    const interactiveSelector = [
      'button',
      'input',
      'select',
      'textarea',
      'summary',
      'a[href]',
      '[role="button"]',
      '[role="checkbox"]',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="menuitem"]',
      '[role="option"]',
      '[role="radio"]',
      '[role="slider"]',
      '[role="switch"]',
      '[role="tab"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    function isVisible(element: Element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    }

    function textFromIdRefs(ids: string | null) {
      if (!ids) {
        return '';
      }
      return ids
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .filter(Boolean)
        .join(' ');
    }

    function controlName(element: Element) {
      const ariaLabel = element.getAttribute('aria-label')?.trim();
      if (ariaLabel) {
        return ariaLabel;
      }

      const labelledBy = textFromIdRefs(element.getAttribute('aria-labelledby'));
      if (labelledBy) {
        return labelledBy;
      }

      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        const label = [...document.querySelectorAll('label')].find(
          (candidate) => candidate.control === element
        );
        if (label?.textContent?.trim()) {
          return label.textContent.trim();
        }
      }

      const closestLabel = element.closest('label')?.textContent?.trim();
      if (closestLabel) {
        return closestLabel;
      }

      return element.getAttribute('title')?.trim() || element.textContent?.trim() || '';
    }

    return [...subject.querySelectorAll(interactiveSelector)]
      .filter(isVisible)
      .filter((element) => !controlName(element))
      .slice(0, 10)
      .map((element) => element.outerHTML.slice(0, 300));
  });

  return {
    check: 'interactive-control-name',
    status: details.length > 0 ? 'failed' : 'passed',
    message:
      details.length > 0
        ? `${details.length} visible interactive control(s) appear to lack an accessible name`
        : 'Visible interactive controls have accessible-name signals',
    details,
  };
}

async function checkKeyboardTabReach(page: Page): Promise<CheckResult> {
  await page.locator('[data-testid="a11y-scan-subject"]').evaluate((subject) => {
    if (subject instanceof HTMLElement) {
      subject.setAttribute('tabindex', '-1');
      subject.focus();
    }
  });

  let reached = false;
  for (let index = 0; index < 30; index += 1) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate(() => {
      const subject = document.querySelector('[data-testid="a11y-scan-subject"]');
      let active = document.activeElement;

      while (active?.shadowRoot?.activeElement) {
        active = active.shadowRoot.activeElement;
      }

      return !!subject && !!active && subject.contains(active);
    });
    if (reached) {
      break;
    }
  }

  return {
    check: 'keyboard-tab-reach',
    status: reached ? 'passed' : 'failed',
    message: reached
      ? 'Tab navigation reached an interactive target inside the scan subject'
      : 'Tab navigation did not reach the scan subject within 30 steps',
  };
}

async function checkTargetSize(page: Page): Promise<CheckResult> {
  const details = await page.locator('[data-testid="a11y-scan-subject"]').evaluate((subject) => {
    const selector = [
      'button',
      'input:not([type="hidden"])',
      'select',
      'textarea',
      'a[href]',
      '[role="button"]',
      '[role="checkbox"]',
      '[role="radio"]',
      '[role="slider"]',
      '[role="switch"]',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    function isVisible(element: Element) {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none'
      );
    }

    return [...subject.querySelectorAll(selector)]
      .filter(isVisible)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          html: element.outerHTML.slice(0, 200),
        };
      })
      .filter((target) => target.width < 24 || target.height < 24)
      .slice(0, 10)
      .map((target) => `${target.width}x${target.height}: ${target.html}`);
  });

  return {
    check: 'target-size',
    status: details.length > 0 ? 'failed' : 'passed',
    message:
      details.length > 0
        ? `${details.length} visible target(s) are smaller than 24x24 CSS pixels`
        : 'Visible interactive targets meet the automated 24x24 size check',
    details,
  };
}

async function checkStatusMessage(page: Page): Promise<CheckResult> {
  const count = await page
    .locator(
      '[data-testid="a11y-scan-subject"] [role="status"], [data-testid="a11y-scan-subject"] [role="alert"], [data-testid="a11y-scan-subject"] [aria-live]'
    )
    .count();

  return {
    check: 'status-message',
    status: count > 0 ? 'passed' : 'failed',
    message:
      count > 0
        ? 'Status or live-region semantics are present'
        : 'No status, alert, or aria-live region was found for the feedback scenario',
  };
}

function reportSummary() {
  const byStatus = records.reduce<Record<ScanStatus, number>>(
    (summary, record) => {
      summary[record.status] += 1;
      return summary;
    },
    { passed: 0, findings: 0, error: 0 }
  );

  const byElement = records.reduce<
    Record<string, { title: string; passed: number; findings: number; error: number }>
  >((summary, record) => {
    if (!summary[record.element.name]) {
      summary[record.element.name] = {
        title: record.element.title,
        passed: 0,
        findings: 0,
        error: 0,
      };
    }
    const entry = summary[record.element.name];
    entry[record.status] += 1;
    return summary;
  }, {});

  const coverageMatrix = records.reduce<Record<string, A11yConcern[]>>((summary, record) => {
    const current = new Set(summary[record.element.name] ?? []);
    for (const concern of record.scenario.concerns) {
      current.add(concern);
    }
    summary[record.element.name] = [...current].sort();
    return summary;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      scenarios: records.length,
      passedScenarios: byStatus.passed,
      scenariosWithFindings: byStatus.findings,
      errorScenarios: byStatus.error,
      axeViolations: records.reduce((sum, record) => sum + record.violationCount, 0),
      automatedCheckFailures: records.reduce(
        (sum, record) => sum + record.checks.filter((check) => check.status === 'failed').length,
        0
      ),
    },
    byElement,
    coverageMatrix,
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

  writeFileSync(
    resolve(reportDir, 'axe-a11y-scenarios-report.json'),
    JSON.stringify(jsonReport, null, 2)
  );
  writeFileSync(resolve(reportDir, 'axe-a11y-scenarios-report.md'), renderMarkdownReport(summary));
}

function renderMarkdownReport(summary: ReturnType<typeof reportSummary>): string {
  const lines = [
    '# PIE Axe Accessibility Scenarios',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Scenarios: ${summary.totals.scenarios}`,
    `- Passed scenarios: ${summary.totals.passedScenarios}`,
    `- Scenarios with findings: ${summary.totals.scenariosWithFindings}`,
    `- Scenarios with harness errors: ${summary.totals.errorScenarios}`,
    `- Total Axe violations: ${summary.totals.axeViolations}`,
    `- Automated check failures: ${summary.totals.automatedCheckFailures}`,
    '',
    '## Element Coverage',
    '',
    '| Element | Passed | Findings | Errors | Concerns |',
    '| --- | ---: | ---: | ---: | --- |',
  ];

  for (const [elementName, elementSummary] of Object.entries(summary.byElement)) {
    lines.push(
      `| ${escapeMarkdownCell(`${elementSummary.title} (${elementName})`)} | ${elementSummary.passed} | ${elementSummary.findings} | ${elementSummary.error} | ${escapeMarkdownCell(summary.coverageMatrix[elementName]?.join(', ') ?? '')} |`
    );
  }

  lines.push('', '## Findings', '');

  const findings = records.filter((record) => record.status !== 'passed');
  if (findings.length === 0) {
    lines.push('No Axe violations, automated check failures, or harness errors were recorded.');
  } else {
    for (const record of findings) {
      lines.push(
        `### ${record.element.title} / ${record.scenario.title}`,
        '',
        `- Route: \`${record.route}\``,
        `- Status: ${record.status}`,
        `- Purpose: ${record.scenario.purpose}`,
        `- WCAG: ${record.scenario.wcagCriteria.join(', ')}`,
        `- Concerns: ${record.scenario.concerns.join(', ')}`,
        `- Suggested ticket scope: \`[a11y][${record.element.name}] ${record.scenario.title}\``
      );

      if (record.error) {
        lines.push(`- Harness error: ${record.error}`);
      }

      const failedChecks = record.checks.filter((check) => check.status === 'failed');
      for (const check of failedChecks) {
        lines.push('', `- Automated check failed: ${check.check}`, `  - ${check.message}`);
        for (const detail of check.details ?? []) {
          lines.push(`  - ${escapeMarkdownCell(detail)}`);
        }
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

const targets = runScenarioSuite ? buildTargets() : [];

test.describe.configure({ mode: 'serial' });

test.describe('Axe accessibility scenarios', () => {
  if (!runScenarioSuite) {
    return;
  }

  test('scenario catalog covers every registered element', () => {
    const scenarioElements = new Set(getAllA11yScenarios().map((scenario) => scenario.element));
    const missing = ELEMENT_REGISTRY.filter((element) => !scenarioElements.has(element.name)).map(
      (element) => element.name
    );

    expect(missing).toEqual([]);
  });

  for (const target of targets) {
    test(`${target.element.name} / ${target.scenario.id}`, async ({ page }, testInfo) => {
      const record = await runAxeScan(page, target, testInfo);
      records.push(record);

      if (enforce) {
        expect(record.status).toBe('passed');
      }
    });
  }

  test.afterAll(() => {
    writeReports();
  });
});
