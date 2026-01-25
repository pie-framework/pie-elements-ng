import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import path from 'node:path';
import { serve } from '../src/index.js';

describe('Standalone Server Integration Tests', () => {
  let server: Awaited<ReturnType<typeof serve>>;
  let baseUrl: string;

  beforeAll(async () => {
    // Determine repo root (apps/local-esm-cdn -> repo root)
    const repoRoot = path.resolve(import.meta.dir, '..', '..', '..');

    // Start server with skip build and random port
    server = await serve({
      port: 0, // Random port
      config: {
        repoRoot,
        esmShBaseUrl: 'https://esm.sh',
        buildScope: 'none',
      },
    });
    baseUrl = `http://localhost:${server.port}`;
  });

  afterAll(() => {
    if (server) {
      server.stop(true);
    }
  });

  test('health endpoint returns 200 when packages are built', async () => {
    const response = await fetch(`${baseUrl}/health`);
    const health = await response.json();

    expect(response.status).toBe(200);
    expect(health.ok).toBe(true);
    expect(health.builtElementPackages).toBeGreaterThan(0);
  });

  test('serves @pie-element package with local-esm-cdn header', async () => {
    const response = await fetch(`${baseUrl}/@pie-element/hotspot`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/javascript');
    expect(response.headers.get('x-local-esm-cdn-file')).toContain('/hotspot/');
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('serves @pie-lib package', async () => {
    const response = await fetch(`${baseUrl}/@pie-lib/render-ui`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/javascript');
    expect(response.headers.get('x-local-esm-cdn-file')).toContain('/render-ui/');
  });

  test('serves @pie-element shared package', async () => {
    const response = await fetch(`${baseUrl}/@pie-element/shared-math-rendering`);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-local-esm-cdn-file')).toContain('/math-rendering/');
  });

  test('serves @pie-framework package', async () => {
    const response = await fetch(`${baseUrl}/@pie-framework/pie-player-events`);

    expect(response.status).toBe(200);
    expect(response.headers.get('x-local-esm-cdn-file')).toContain('/player-events/');
  });

  test('rewrites external imports to esm.sh', async () => {
    const response = await fetch(`${baseUrl}/@pie-element/hotspot`);
    const code = await response.text();

    // Should contain esm.sh URLs for external packages
    expect(code).toMatch(/esm\.sh\/(react|prop-types)/);
  });

  test('preserves local @pie-* imports (not rewritten to esm.sh)', async () => {
    const response = await fetch(`${baseUrl}/@pie-element/hotspot`);
    const code = await response.text();

    // Should not rewrite local PIE package imports to esm.sh
    expect(code).not.toContain('esm.sh/@pie-lib/');
    expect(code).not.toContain('esm.sh/@pie-element/');
    expect(code).not.toContain('esm.sh/@pie-element/');
  });

  test('handles CORS preflight requests', async () => {
    const response = await fetch(`${baseUrl}/@pie-element/hotspot`, {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain('GET');
  });

  test('returns 404 for unknown packages', async () => {
    const response = await fetch(`${baseUrl}/@pie-element/nonexistent-package`);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toContain('not found');
  });

  test('returns 404 for non-PIE package requests', async () => {
    const response = await fetch(`${baseUrl}/@other/package`);

    expect(response.status).toBe(404);
  });

  test('serves help text at root', async () => {
    const response = await fetch(`${baseUrl}/`);
    const text = await response.text();

    expect(response.status).toBe(200);
    expect(text).toContain('PIE local ESM CDN');
    expect(text).toContain('Endpoints:');
  });
});
