import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getA11yReportFile } from '$lib/server/a11y-runner';
import { readFileSync } from 'node:fs';

type ReportType = 'scenarios' | 'inventory';

function readJsonReport(runId: string) {
  const scenarioReport = getA11yReportFile(runId, 'scenario-json');
  if (scenarioReport) {
    return {
      type: 'scenarios' as ReportType,
      report: JSON.parse(readFileSync(scenarioReport.path, 'utf-8')),
    };
  }

  const inventoryReport = getA11yReportFile(runId, 'inventory-json');
  if (inventoryReport) {
    return {
      type: 'inventory' as ReportType,
      report: JSON.parse(readFileSync(inventoryReport.path, 'utf-8')),
    };
  }

  return null;
}

export const load: PageServerLoad = async ({ params }) => {
  if (!dev) {
    throw error(403, 'A11y UI reports are only available in local dev mode.');
  }

  const loadedReport = readJsonReport(params.runId);
  if (!loadedReport) {
    throw error(404, `No formatted a11y report is available for run: ${params.runId}`);
  }

  const rawPrefix = `/a11y/api/reports/${params.runId}`;
  const rawLinks =
    loadedReport.type === 'inventory'
      ? [
          { label: 'Raw JSON', href: `${rawPrefix}/inventory-json` },
          { label: 'Markdown', href: `${rawPrefix}/inventory-md` },
        ]
      : [
          { label: 'Raw JSON', href: `${rawPrefix}/scenario-json` },
          { label: 'Markdown', href: `${rawPrefix}/scenario-md` },
        ];

  return {
    runId: params.runId,
    reportType: loadedReport.type,
    summary: loadedReport.report.summary,
    records: loadedReport.report.records ?? [],
    rawLinks: [...rawLinks, { label: 'Playwright HTML', href: `${rawPrefix}/html` }],
  };
};
