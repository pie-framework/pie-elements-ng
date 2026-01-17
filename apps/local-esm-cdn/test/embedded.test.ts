import { describe, test, expect } from 'bun:test';
import path from 'node:path';
import { createLocalEsmCdn } from '../src/embedded.js';

describe('Embedded API Integration Tests', () => {
  // Determine repo root (apps/local-esm-cdn/test -> repo root)
  const repoRoot = path.resolve(import.meta.dir, '..', '..', '..');

  const cdn = createLocalEsmCdn({
    repoRoot,
    esmShBaseUrl: 'https://esm.sh',
  });

  test('handler returns Response for valid package request', async () => {
    const request = new Request('http://localhost:5179/@pie-element/hotspot');
    const response = await cdn.handler(request);

    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/javascript');
  });

  test('handler includes CORS headers', async () => {
    const request = new Request('http://localhost:5179/@pie-element/hotspot');
    const response = await cdn.handler(request);

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(response.headers.get('access-control-allow-methods')).toContain('GET');
  });

  test('handler includes x-local-esm-cdn-file header', async () => {
    const request = new Request('http://localhost:5179/@pie-element/hotspot');
    const response = await cdn.handler(request);

    const filePath = response.headers.get('x-local-esm-cdn-file');
    expect(filePath).toBeTruthy();
    expect(filePath).toContain('/hotspot/');
    expect(filePath).toContain('/dist/');
  });

  test('handler rewrites external imports to esm.sh', async () => {
    const request = new Request('http://localhost:5179/@pie-element/hotspot');
    const response = await cdn.handler(request);
    const code = await response.text();

    expect(code).toMatch(/esm\.sh\/(react|prop-types)/);
  });

  test('handler preserves local @pie-* imports', async () => {
    const request = new Request('http://localhost:5179/@pie-element/hotspot');
    const response = await cdn.handler(request);
    const code = await response.text();

    // Local imports should not be rewritten to esm.sh
    expect(code).not.toContain('esm.sh/@pie-lib/');
    expect(code).not.toContain('esm.sh/@pie-element/');
  });

  test('handler serves multiple package types', async () => {
    const packages = [
      '@pie-element/hotspot',
      '@pie-lib/render-ui',
      '@pie-elements-ng/shared-math-rendering',
      '@pie-framework/pie-player-events',
    ];

    for (const pkg of packages) {
      const request = new Request(`http://localhost:5179/${pkg}`);
      const response = await cdn.handler(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/javascript');
    }
  });

  test('handler returns 404 for unknown packages', async () => {
    const request = new Request('http://localhost:5179/@pie-element/nonexistent');
    const response = await cdn.handler(request);

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toContain('not found');
  });

  test('handler handles CORS preflight', async () => {
    const request = new Request('http://localhost:5179/@pie-element/hotspot', {
      method: 'OPTIONS',
    });
    const response = await cdn.handler(request);

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  test('getHealth returns health status', async () => {
    const health = await cdn.getHealth();

    expect(health.ok).toBe(true);
    expect(health.pieElementsNgPath).toBeTruthy();
    expect(health.builtElementPackages).toBeGreaterThan(0);
    expect(health.builtLibPackages).toBeGreaterThan(0);
  });

  test('updateConfig changes configuration', async () => {
    const testCdn = createLocalEsmCdn({
      repoRoot,
      esmShBaseUrl: 'https://esm.sh',
    });

    // Update config
    testCdn.updateConfig({
      esmShBaseUrl: 'https://custom-cdn.example.com',
    });

    // Config should be updated (we can verify by checking the response)
    const request = new Request('http://localhost:5179/@pie-element/hotspot');
    const response = await testCdn.handler(request);
    const code = await response.text();

    // Should use custom CDN URL
    expect(code).toContain('custom-cdn.example.com');
  });

  test('handles subpath requests', async () => {
    const request = new Request('http://localhost:5179/@pie-element/hotspot/controller');
    const response = await cdn.handler(request);

    // May return 404 if controller subpath doesn't exist, or 200 if it does
    expect([200, 404]).toContain(response.status);
  });

  test('returns help text at root', async () => {
    const request = new Request('http://localhost:5179/');
    const response = await cdn.handler(request);

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain('PIE local ESM CDN');
  });

  test('health endpoint returns proper status', async () => {
    const request = new Request('http://localhost:5179/health');
    const response = await cdn.handler(request);

    expect(response.status).toBe(200);
    const health = await response.json();
    expect(health.ok).toBe(true);
  });
});
