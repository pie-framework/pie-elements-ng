#!/usr/bin/env bun
/**
 * Test script to verify local-esm-cdn routing behavior
 *
 * Tests:
 * 1. Local PIE packages (@pie-element, @pie-lib, @pie-elements-ng, @pie-framework) are served from filesystem
 * 2. External packages (react, etc.) are proxied to esm.sh
 */

const PORT = 5179;
const BASE_URL = `http://localhost:${PORT}`;

type TestResult = {
  name: string;
  pass: boolean;
  message: string;
};

const results: TestResult[] = [];

function test(name: string, pass: boolean, message: string) {
  results.push({ name, pass, message });
  const icon = pass ? '✅' : '❌';
  console.log(`${icon} ${name}`);
  if (!pass) {
    console.log(`   ${message}`);
  }
}

async function main() {
  console.log('🧪 Testing local-esm-cdn routing...\n');

  // Wait a bit for server to be ready
  await new Promise(resolve => setTimeout(resolve, 500));

  // Test 1: Health check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const health = await res.json();
    test(
      'Health endpoint',
      res.status === 200 && health.ok,
      `Status: ${res.status}, OK: ${health.ok}`
    );
  } catch (e: any) {
    test('Health endpoint', false, `Failed to fetch: ${e.message}`);
  }

  // Test 2: @pie-element package (should be served from local filesystem)
  try {
    const res = await fetch(`${BASE_URL}/@pie-element/hotspot`);
    const hasLocalHeader = res.headers.has('x-local-esm-cdn-file');
    const localFile = res.headers.get('x-local-esm-cdn-file') || '';
    test(
      '@pie-element/hotspot served locally',
      res.ok && hasLocalHeader && localFile.includes('/packages/elements-react/hotspot/'),
      hasLocalHeader ? `File: ${localFile}` : 'No x-local-esm-cdn-file header'
    );
  } catch (e: any) {
    test('@pie-element/hotspot served locally', false, `Failed: ${e.message}`);
  }

  // Test 3: @pie-lib package (should be served from local filesystem)
  try {
    const res = await fetch(`${BASE_URL}/@pie-lib/render-ui`);
    const hasLocalHeader = res.headers.has('x-local-esm-cdn-file');
    const localFile = res.headers.get('x-local-esm-cdn-file') || '';
    test(
      '@pie-lib/render-ui served locally',
      res.ok && hasLocalHeader && localFile.includes('/packages/lib-react/render-ui/'),
      hasLocalHeader ? `File: ${localFile}` : 'No x-local-esm-cdn-file header'
    );
  } catch (e: any) {
    test('@pie-lib/render-ui served locally', false, `Failed: ${e.message}`);
  }

  // Test 4: @pie-elements-ng package (should be served from local filesystem)
  try {
    const res = await fetch(`${BASE_URL}/@pie-elements-ng/shared-math-rendering`);
    const hasLocalHeader = res.headers.has('x-local-esm-cdn-file');
    const localFile = res.headers.get('x-local-esm-cdn-file') || '';
    test(
      '@pie-elements-ng/shared-math-rendering served locally',
      res.ok && hasLocalHeader && localFile.includes('/packages/shared/math-rendering/'),
      hasLocalHeader ? `File: ${localFile}` : 'No x-local-esm-cdn-file header'
    );
  } catch (e: any) {
    test('@pie-elements-ng/shared-math-rendering served locally', false, `Failed: ${e.message}`);
  }

  // Test 5: @pie-framework package (should be served from local filesystem)
  try {
    const res = await fetch(`${BASE_URL}/@pie-framework/pie-player-events`);
    const hasLocalHeader = res.headers.has('x-local-esm-cdn-file');
    const localFile = res.headers.get('x-local-esm-cdn-file') || '';
    test(
      '@pie-framework/pie-player-events served locally',
      res.ok && hasLocalHeader && localFile.includes('/packages/shared/player-events/'),
      hasLocalHeader ? `File: ${localFile}` : 'No x-local-esm-cdn-file header'
    );
  } catch (e: any) {
    test('@pie-framework/pie-player-events served locally', false, `Failed: ${e.message}`);
  }

  // Test 6: Verify local packages don't have esm.sh imports rewritten to esm.sh
  // (they should keep @pie-* imports as-is)
  try {
    const res = await fetch(`${BASE_URL}/@pie-element/hotspot`);
    const code = await res.text();
    const hasLocalImports = code.includes('@pie-lib/') || code.includes('@pie-elements-ng/');
    const hasNoEsmShForLocal = !code.includes('esm.sh/@pie-lib/') && !code.includes('esm.sh/@pie-elements-ng/');
    test(
      'Local imports not rewritten to esm.sh',
      hasNoEsmShForLocal,
      hasLocalImports
        ? 'Local imports correctly preserved'
        : 'No local imports found to verify (may be OK)'
    );
  } catch (e: any) {
    test('Local imports not rewritten to esm.sh', false, `Failed: ${e.message}`);
  }

  // Test 7: Verify external imports ARE rewritten to esm.sh
  try {
    const res = await fetch(`${BASE_URL}/@pie-element/hotspot`);
    const code = await res.text();
    const hasEsmShRewrite = code.includes('esm.sh/react') || code.includes('esm.sh/prop-types');
    test(
      'External imports rewritten to esm.sh',
      hasEsmShRewrite,
      hasEsmShRewrite
        ? 'External imports correctly rewritten'
        : 'No external imports found or not rewritten'
    );
  } catch (e: any) {
    test('External imports rewritten to esm.sh', false, `Failed: ${e.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  const passed = results.filter(r => r.pass).length;
  const total = results.length;
  const icon = passed === total ? '🎉' : '⚠️';
  console.log(`${icon} Results: ${passed}/${total} tests passed`);

  if (passed < total) {
    console.log('\nFailed tests:');
    results.filter(r => !r.pass).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
    process.exit(1);
  }
}

void main();
