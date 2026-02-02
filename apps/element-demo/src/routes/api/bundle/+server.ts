/**
 * SvelteKit API endpoint for PIE bundler
 * POST /api/bundle - Build a bundle
 * GET /api/bundle?hash={hash} - Check if bundle exists
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { Bundler } from '@pie-element/bundler-shared';
import { join } from 'node:path';

// Initialize bundler (singleton)
const bundler = new Bundler(
  join(process.cwd(), 'static', 'bundles'), // Output to static/bundles
  join(process.cwd(), '.cache', 'bundler') // Cache in .cache/bundler
);

export const POST: RequestHandler = async ({ request }) => {
  try {
    const buildRequest = await request.json();

    // Validate request
    if (!buildRequest.dependencies || !Array.isArray(buildRequest.dependencies)) {
      return json({ error: 'dependencies array required' }, { status: 400 });
    }

    if (buildRequest.dependencies.length === 0) {
      return json({ error: 'at least one dependency required' }, { status: 400 });
    }

    // Validate each dependency
    for (const dep of buildRequest.dependencies) {
      if (!dep.name || !dep.version) {
        return json({ error: 'each dependency must have name and version' }, { status: 400 });
      }
    }

    console.log('[api/bundle] Building:', buildRequest);

    // Build bundle
    const result = await bundler.build(buildRequest);

    return json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error('[api/bundle] Error:', error);
    return json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
};

export const GET: RequestHandler = async ({ url }) => {
  const hash = url.searchParams.get('hash');

  if (!hash) {
    return json({ error: 'hash parameter required' }, { status: 400 });
  }

  const exists = bundler.exists(hash);

  if (exists) {
    return json({
      exists: true,
      bundles: bundler.getBundleUrls(hash),
    });
  }

  return json({ exists: false });
};
