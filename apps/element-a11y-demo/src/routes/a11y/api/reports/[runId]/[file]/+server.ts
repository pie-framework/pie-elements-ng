import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  assertReportPathWithinApp,
  getA11yReportFile,
  type A11yReportFileKey,
} from '$lib/server/a11y-runner';
import { readFileSync } from 'node:fs';

function isReportFileKey(value: string): value is A11yReportFileKey {
  return ['scenario-json', 'scenario-md', 'inventory-json', 'inventory-md', 'html'].includes(value);
}

export const GET: RequestHandler = async ({ params }) => {
  if (!dev) {
    return json(
      { error: 'A11y UI reports are only available in local dev mode.' },
      { status: 403 }
    );
  }

  if (!isReportFileKey(params.file)) {
    return json({ error: `Unknown report file: ${params.file}` }, { status: 404 });
  }

  const reportFile = getA11yReportFile(params.runId, params.file);
  if (!reportFile) {
    return json(
      { error: `Report file is not available for run: ${params.runId}` },
      { status: 404 }
    );
  }

  assertReportPathWithinApp(reportFile.path);

  return new Response(readFileSync(reportFile.path), {
    headers: {
      'content-type': reportFile.contentType,
    },
  });
};
