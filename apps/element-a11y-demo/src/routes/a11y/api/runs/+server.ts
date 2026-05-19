import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { startA11yRun } from '$lib/server/a11y-runner';
import type { A11yRunRequest } from '$lib/a11y/run-types';

export const POST: RequestHandler = async ({ request }) => {
  if (!dev) {
    return json({ error: 'A11y UI runs are only available in local dev mode.' }, { status: 403 });
  }

  try {
    const runRequest = (await request.json()) as A11yRunRequest;
    return json(startA11yRun(runRequest), { status: 202 });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, { status: 400 });
  }
};
