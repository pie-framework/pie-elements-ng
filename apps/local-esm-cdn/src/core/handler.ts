import { readFile } from 'node:fs/promises';
import type { LocalEsmCdnContext } from './config.js';
import { getHealth } from './health.js';
import { parsePackageRequest, resolveEntryFile } from './resolver.js';
import { js, json, text, withCors } from './utils.js';
import { rewriteImports } from '../rewrite-imports.js';

/**
 * Generate help text for the server
 */
function generateHelpText(config: { repoRoot: string; esmShBaseUrl: string }): string {
  return `PIE local ESM CDN (dev-only)

This server serves local built PIE packages from disk and rewrites *external* imports to ${config.esmShBaseUrl}.

Endpoints:
  GET  /health
  GET  /@pie-element/<name>@<version>[/<subpath>]
  GET  /@pie-lib/<name>@<version>[/<subpath>]

Env:
  PIE_ELEMENTS_NG_PATH=${config.repoRoot}
  LOCAL_ESM_CDN_ESM_SH_BASE_URL=${config.esmShBaseUrl}
`;
}

/**
 * Handle an HTTP request
 * @param request - The incoming request
 * @param context - The local ESM CDN context
 * @returns The HTTP response
 */
export async function handleRequest(
  request: Request,
  context: LocalEsmCdnContext
): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: withCors() });
  }

  // Help endpoint
  if (url.pathname === '/' || url.pathname === '/__help') {
    const helpText = generateHelpText({
      repoRoot: context.config.repoRoot,
      esmShBaseUrl: context.config.esmShBaseUrl,
    });
    return text(helpText);
  }

  // Health check endpoint
  if (url.pathname === '/health') {
    const health = await getHealth(context.config.repoRoot);
    return json(health, { status: health.ok ? 200 : 503 });
  }

  // Parse package request
  const parsed = parsePackageRequest(url.pathname);
  if (!parsed) {
    const helpText = generateHelpText({
      repoRoot: context.config.repoRoot,
      esmShBaseUrl: context.config.esmShBaseUrl,
    });
    return text(`Not found.\n\n${helpText}`, { status: 404 });
  }

  // Check health before serving packages
  const health = await getHealth(context.config.repoRoot);
  if (!health.ok) {
    return json(
      {
        error: 'Local ESM CDN is not ready: missing built artifacts.',
        hint: 'Run `bun run build` in pie-elements-ng (or build the relevant packages) and try again.',
        health,
      },
      { status: 503 }
    );
  }

  // Resolve the entry file on disk
  const entryFile = await resolveEntryFile(context.config.repoRoot, parsed.pkg, parsed.subpath);
  if (!entryFile) {
    return json(
      {
        error: 'Entrypoint not found on disk.',
        requested: parsed,
        tried: {
          pkg: parsed.pkg,
          subpath: parsed.subpath,
        },
        hint: 'Ensure pie-elements-ng is built and the package exists in packages/elements-react or packages/lib-react.',
      },
      { status: 404 }
    );
  }

  // Read and rewrite the file
  const code = await readFile(entryFile, 'utf8');
  const rewritten = await rewriteImports(code, {
    esmShBaseUrl: context.config.esmShBaseUrl,
    pkg: parsed.pkg,
    subpath: parsed.subpath,
  });

  return js(rewritten, {
    headers: {
      'x-local-esm-cdn-file': entryFile,
    },
  });
}
