/**
 * Integration tests for the PIE element bundler
 *
 * These tests verify that the bundler can:
 * 1. Build bundles from PIE element packages
 * 2. Cache bundles and return cached results
 * 3. Handle multiple elements with different @pie-lib versions
 * 4. Generate valid IIFE bundles that work with pie-player-components
 *
 * ⚠️ THESE TESTS ARE CURRENTLY DISABLED ⚠️
 *
 * Why: These integration tests download packages from NPM, but the published
 * packages (v2.0.0+) have a broken dependency on a git repo that no longer exists:
 *   mathquill@git+https://github.com/pie-framework/mathquill-webpack.git (404)
 *
 * This repo has fixed the issue by using @pie-element/shared-mathquill, but the
 * NPM packages haven't been republished yet.
 *
 * Alternative: Use `bun cli dev:test-bundler` to test with local workspace packages.
 * See packages/shared/bundler-shared/TESTING.md for details.
 *
 * TODO: Re-enable these tests after packages are published with fixed dependencies.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Bundler } from '../src/index';
import { mkdirSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe.skip('Bundler Integration Tests (DISABLED - NPM packages have broken deps)', () => {
  let bundler: Bundler;
  let outputDir: string;
  let cacheDir: string;

  beforeAll(() => {
    // Create temporary directories for testing
    outputDir = join(tmpdir(), 'pie-bundler-test-output');
    cacheDir = join(tmpdir(), 'pie-bundler-test-cache');

    // Clean up any existing test directories
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
    if (existsSync(cacheDir)) {
      rmSync(cacheDir, { recursive: true, force: true });
    }

    mkdirSync(outputDir, { recursive: true });
    mkdirSync(cacheDir, { recursive: true });

    bundler = new Bundler(outputDir, cacheDir);
  });

  afterAll(() => {
    // Clean up test directories
    if (existsSync(outputDir)) {
      rmSync(outputDir, { recursive: true, force: true });
    }
    if (existsSync(cacheDir)) {
      rmSync(cacheDir, { recursive: true, force: true });
    }
  });

  describe('Basic Bundle Creation', () => {
    it('should build a bundle for a single element', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/multiple-choice', version: '2.0.0' }],
      });

      expect(result.success).toBe(true);
      expect(result.hash).toBeDefined();
      expect(result.hash).toMatch(/^\d+$/); // Hash should be numeric string
      expect(result.bundles).toBeDefined();
      expect(result.bundles?.player).toBe(`/bundles/${result.hash}/player.js`);
      expect(result.bundles?.clientPlayer).toBe(`/bundles/${result.hash}/client-player.js`);
      expect(result.bundles?.editor).toBe(`/bundles/${result.hash}/editor.js`);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.cached).toBeFalsy();
    }, 120000); // 2 minute timeout for first build

    it('should create bundle files on disk', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/text-entry', version: '2.0.0' }],
      });

      expect(result.success).toBe(true);

      const bundleDir = join(outputDir, result.hash);
      expect(existsSync(bundleDir)).toBe(true);

      // Check that all three bundle files exist
      expect(existsSync(join(bundleDir, 'player.js'))).toBe(true);
      expect(existsSync(join(bundleDir, 'client-player.js'))).toBe(true);
      expect(existsSync(join(bundleDir, 'editor.js'))).toBe(true);

      // Check that source maps exist
      expect(existsSync(join(bundleDir, 'player.js.map'))).toBe(true);
    }, 120000);

    it('should generate valid IIFE bundles', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/inline-choice', version: '0.1.0' }],
      });

      expect(result.success).toBe(true);

      // Read the player bundle
      const playerPath = join(outputDir, result.hash, 'player.js');
      const playerContent = readFileSync(playerPath, 'utf-8');

      // Verify IIFE structure
      expect(playerContent).toContain('window.pie');
      expect(playerContent).toContain('@pie-element/inline-choice');

      // Verify bundle is minified (production mode)
      expect(playerContent.length).toBeGreaterThan(1000); // Should have substantial content
    }, 120000);
  });

  describe('Caching', () => {
    it('should return cached bundle on second build with same dependencies', async () => {
      const deps = [{ name: '@pie-element/number-line', version: '0.1.0' }];

      // First build
      const result1 = await bundler.build({ dependencies: deps });
      expect(result1.success).toBe(true);
      expect(result1.cached).toBeFalsy();
      const firstDuration = result1.duration;

      // Second build (should be cached)
      const result2 = await bundler.build({ dependencies: deps });
      expect(result2.success).toBe(true);
      expect(result2.cached).toBe(true);
      expect(result2.hash).toBe(result1.hash);
      expect(result2.duration).toBeLessThan(firstDuration); // Cached should be faster
      expect(result2.duration).toBeLessThan(1000); // Should be very fast
    }, 180000);

    it('should generate different hashes for different versions', async () => {
      const result1 = await bundler.build({
        dependencies: [{ name: '@pie-element/math-inline', version: '0.1.0' }],
      });

      const result2 = await bundler.build({
        dependencies: [{ name: '@pie-element/math-inline', version: '0.2.0' }],
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.hash).not.toBe(result2.hash);
    }, 180000);

    it('should use exists() to check for cached bundles', async () => {
      const deps = [{ name: '@pie-element/drag-in-the-blank', version: '0.1.0' }];
      const result = await bundler.build({ dependencies: deps });

      expect(result.success).toBe(true);
      expect(bundler.exists(result.hash)).toBe(true);
      expect(bundler.exists('nonexistent-hash')).toBe(false);
    }, 120000);

    it('should get bundle URLs for existing hash', async () => {
      const deps = [{ name: '@pie-element/hotspot', version: '0.1.0' }];
      const result = await bundler.build({ dependencies: deps });

      expect(result.success).toBe(true);

      const urls = bundler.getBundleUrls(result.hash);
      expect(urls.player).toBe(`/bundles/${result.hash}/player.js`);
      expect(urls.clientPlayer).toBe(`/bundles/${result.hash}/client-player.js`);
      expect(urls.editor).toBe(`/bundles/${result.hash}/editor.js`);
    }, 120000);
  });

  describe('Multiple Elements', () => {
    it('should build a bundle with multiple elements', async () => {
      const result = await bundler.build({
        dependencies: [
          { name: '@pie-element/multiple-choice', version: '2.0.0' },
          { name: '@pie-element/text-entry', version: '2.0.0' },
        ],
      });

      expect(result.success).toBe(true);
      expect(result.hash).toBeDefined();

      // Verify files exist
      const bundleDir = join(outputDir, result.hash);
      expect(existsSync(join(bundleDir, 'player.js'))).toBe(true);

      // Read player bundle and verify both elements are included
      const playerContent = readFileSync(join(bundleDir, 'player.js'), 'utf-8');
      expect(playerContent).toContain('@pie-element/multiple-choice');
      expect(playerContent).toContain('@pie-element/text-entry');
    }, 180000);

    it('should generate deterministic hashes regardless of dependency order', async () => {
      const result1 = await bundler.build({
        dependencies: [
          { name: '@pie-element/multiple-choice', version: '2.0.0' },
          { name: '@pie-element/text-entry', version: '2.0.0' },
        ],
      });

      const result2 = await bundler.build({
        dependencies: [
          { name: '@pie-element/text-entry', version: '2.0.0' },
          { name: '@pie-element/multiple-choice', version: '2.0.0' },
        ],
      });

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result1.hash).toBe(result2.hash); // Should be same hash
      expect(result2.cached).toBe(true); // Second should be cached
    }, 180000);
  });

  describe('Version Resolution', () => {
    it('should handle elements with different @pie-lib versions', async () => {
      // This tests the critical version resolution feature
      // Different elements may depend on different versions of @pie-lib packages
      const result = await bundler.build({
        dependencies: [
          { name: '@pie-element/multiple-choice', version: '2.0.0' },
          { name: '@pie-element/inline-choice', version: '0.1.0' },
        ],
      });

      expect(result.success).toBe(true);

      // Verify bundle was created
      const bundleDir = join(outputDir, result.hash);
      expect(existsSync(join(bundleDir, 'player.js'))).toBe(true);

      // The bundle should work even if elements use different @pie-lib versions
      // This is handled by the NormalModuleReplacementPlugin in webpack config
    }, 180000);
  });

  describe('Error Handling', () => {
    it('should handle invalid package name', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/nonexistent-package', version: '0.1.0' }],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    }, 60000);

    it('should handle invalid version', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/multiple-choice', version: '999.999.999' }],
      });

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Bundle Types', () => {
    it('should create player bundle with Element export', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/multiple-choice', version: '2.0.0' }],
      });

      expect(result.success).toBe(true);

      const playerContent = readFileSync(join(outputDir, result.hash, 'player.js'), 'utf-8');
      expect(playerContent).toContain('Element'); // Should export Element
    }, 120000);

    it('should create client-player bundle', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/multiple-choice', version: '2.0.0' }],
      });

      expect(result.success).toBe(true);

      const clientPlayerPath = join(outputDir, result.hash, 'client-player.js');
      expect(existsSync(clientPlayerPath)).toBe(true);

      const content = readFileSync(clientPlayerPath, 'utf-8');
      expect(content.length).toBeGreaterThan(100);
    }, 120000);

    it('should create editor bundle with Configure export', async () => {
      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/multiple-choice', version: '2.0.0' }],
      });

      expect(result.success).toBe(true);

      const editorPath = join(outputDir, result.hash, 'editor.js');
      expect(existsSync(editorPath)).toBe(true);

      const content = readFileSync(editorPath, 'utf-8');
      expect(content).toContain('Configure'); // Should export Configure component
    }, 120000);
  });

  describe('Performance', () => {
    it('should complete build within reasonable time', async () => {
      const start = Date.now();

      const result = await bundler.build({
        dependencies: [{ name: '@pie-element/select-text', version: '0.1.0' }],
      });

      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(120000); // Should complete in under 2 minutes
      console.log(`Build completed in ${duration}ms`);
    }, 150000);

    it('should have fast cache retrieval', async () => {
      const deps = [{ name: '@pie-element/categorize', version: '0.1.0' }];

      // Build once
      await bundler.build({ dependencies: deps });

      // Measure cache retrieval
      const start = Date.now();
      const result = await bundler.build({ dependencies: deps });
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(duration).toBeLessThan(100); // Should be nearly instant
      console.log(`Cache retrieval completed in ${duration}ms`);
    }, 150000);
  });
});
