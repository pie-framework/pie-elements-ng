import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Bundler } from '../src/index';

describe('Bundler controller URL helpers', () => {
  it('builds pie-api-aws compatible controller URLs', () => {
    const root = mkdtempSync(join(tmpdir(), 'bundler-controller-url-test-'));
    const bundlesDir = join(root, 'bundles');
    const cacheDir = join(root, 'cache');
    const controllersDir = join(root, 'controllers');
    try {
      const bundler = new Bundler(bundlesDir, cacheDir, undefined, controllersDir);
      const urls = bundler.getControllerUrls([
        { name: '@pie-element/multiple-choice', version: '1.2.3' },
        { name: '@pie-element/inline-choice', version: '4.5.6' },
      ]);

      expect(urls['@pie-element/multiple-choice@1.2.3']).toBe(
        '/controllers/@pie-element/multiple-choice_at_1.2.3/controller.js'
      );
      expect(urls['@pie-element/inline-choice@4.5.6']).toBe(
        '/controllers/@pie-element/inline-choice_at_4.5.6/controller.js'
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
