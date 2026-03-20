import { describe, expect, it } from 'vitest';
import { generatePieLibViteConfig } from '../src/lib/upstream/sync-vite-config.js';

describe('generatePieLibViteConfig presets', () => {
  it('uses math-rendering wrapper preset config', () => {
    const config = generatePieLibViteConfig('math-rendering');
    expect(config).toContain("id === '@pie-element/shared-math-rendering-mathjax'");
    expect(config).toContain("['debug'].includes(id)");
  });

  it('uses test-utils preset config', () => {
    const config = generatePieLibViteConfig('test-utils');
    expect(config).toContain('external: (id) =>');
    expect(config).toContain("formats: ['es']");
  });

  it('uses editable-html-tip-tap preset config', () => {
    const config = generatePieLibViteConfig('editable-html-tip-tap');
    expect(config).toContain('/^prosemirror-/.test(id)');
    expect(config).toContain('/^@tiptap\\//.test(id)');
  });

  it('uses default config for other packages', () => {
    const config = generatePieLibViteConfig('graphing');
    expect(config).toContain('external: (id) =>');
    expect(config).not.toContain('/^prosemirror-/.test(id)');
    expect(config).not.toContain("id === '@pie-element/shared-math-rendering-mathjax'");
  });
});
