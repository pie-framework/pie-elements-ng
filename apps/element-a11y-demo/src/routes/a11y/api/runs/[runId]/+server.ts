import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getA11yRun } from '$lib/server/a11y-runner';

export const GET: RequestHandler = async ({ params }) => {
  if (!dev) {
    return json({ error: 'A11y UI runs are only available in local dev mode.' }, { status: 403 });
  }

  const job = getA11yRun(params.runId);
  if (!job) {
    return json({ error: `Unknown a11y run: ${params.runId}` }, { status: 404 });
  }

  return json(job);
};
