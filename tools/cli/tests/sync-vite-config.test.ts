import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generatePieLibViteConfig } from '../src/lib/upstream/sync-vite-config.js';
import { browserCjsRequireInteropPlugin } from '../../vite/browser-cjs-require-interop.ts';

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

describe('shared element browser Vite config', () => {
  it('uses the shared browser ESM policy for externals and publish checks', async () => {
    const config = await readFile(
      join(process.cwd(), 'tools/vite/element-browser.config.ts'),
      'utf-8'
    );
    const policy = JSON.parse(
      await readFile(join(process.cwd(), 'tools/vite/browser-esm-policy.json'), 'utf-8')
    );
    const publishSurfaceCheck = await readFile(
      join(process.cwd(), 'scripts/check-publish-surface.mjs'),
      'utf-8'
    );

    expect(policy.allowedBareImports).toEqual([
      'react',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom',
      'react-dom/client',
    ]);
    expect(policy.sharedDependencyVersions).toEqual({
      react: '18.2.0',
      'react-dom': '18.2.0',
    });
    expect(policy.maxBrowserJsBytesPerPackage).toBeGreaterThan(0);
    expect(config).toContain('browser-esm-policy.json');
    expect(policy.allowedBareImports).not.toContain('use-sync-external-store');
    expect(policy.sharedDependencyVersions).not.toHaveProperty('use-sync-external-store');
    expect(config).toContain('esmExternalRequirePlugin');
    expect(config).toContain('browserCjsRequireInteropPlugin');
    expect(config).toContain('esmExternals: allowedBareImportSpecifiers');
    expect(config).toContain('strictRequires: false');
    expect(config).toContain('transformMixedEsModules: true');
    expect(config).toContain('external:');
    expect(config).toContain('allowedBareImports.has(id)');
    expect(publishSurfaceCheck).toContain('browser-esm-policy.json');
    expect(publishSurfaceCheck).toContain('allowedBrowserBareImports.has(specifier)');
    expect(publishSurfaceCheck).toContain('maxBrowserJsBytesPerPackage');
  });
});

describe('browser CJS require interop plugin', () => {
  const runBundle = (chunks: Record<string, string>): Record<string, string> => {
    const plugin = browserCjsRequireInteropPlugin();
    const bundle = Object.fromEntries(
      Object.entries(chunks).map(([fileName, code]) => [
        fileName,
        {
          type: 'chunk',
          fileName,
          code,
        },
      ])
    );
    plugin.generateBundle?.call(
      {
        error(message: string) {
          throw new Error(message);
        },
      } as never,
      {} as never,
      bundle as never,
      false as never
    );
    return Object.fromEntries(
      Object.entries(bundle).map(([fileName, output]) => [
        fileName,
        (output as { code: string }).code,
      ])
    );
  };

  const render = (code: string): string | null => {
    return runBundle({ 'entry.js': code })['entry.js'];
  };

  it('maps known Rolldown require helper targets to browser-safe values', () => {
    const transformed = render(`import { jsx } from "react/jsx-runtime";
var req = /* @__PURE__ */ ((fallback) => typeof require < "u" ? require : fallback)(function(id) {
  throw Error("Calling \`require\` for \\"" + id + "\\" in an environment that doesn't expose the \`require\` function.");
});
var React = req("react");
var classnames = req("classnames");
var PropTypes = req("prop-types");
`);

    expect(transformed).toContain('import * as __pieBrowserCjsReactRequire from "react";');
    expect(transformed).toContain('const __pieBrowserCjsClassnamesRequire = (...inputs) =>');
    expect(transformed).toContain('const __pieBrowserCjsPropTypesRequire = new Proxy');
    expect(transformed).toContain('case "react": return __pieBrowserCjsReactRequire;');
    expect(transformed).not.toContain('case "react-dom":');
    expect(transformed).not.toContain('case "react-dom/client":');
    expect(transformed).toContain('case "classnames": return __pieBrowserCjsClassnamesRequire;');
    expect(transformed).toContain('case "prop-types": return __pieBrowserCjsPropTypesRequire;');
    expect(transformed).toContain('var req = __pieBrowserCjsRequire;');
  });

  it('fails the build when an unsupported require helper target leaks', () => {
    expect(() =>
      render(`var req = /* @__PURE__ */ ((fallback) => typeof require < "u" ? require : fallback)(function(id) {
  throw Error("Calling \`require\` for \\"" + id + "\\" in an environment that doesn't expose the \`require\` function.");
});
var fs = req("fs");`)
    ).toThrow('Unsupported browser CJS require helper target(s): fs');
  });

  it('rewrites helper-only chunks that are imported by other browser chunks', () => {
    const transformed =
      render(`var req = /* @__PURE__ */ ((fallback) => typeof require < "u" ? require : fallback)(function(id) {
  throw Error("Calling \`require\` for \\"" + id + "\\" in an environment that doesn't expose the \`require\` function.");
});
export { req as $ };`);

    expect(transformed).toContain('var req = __pieBrowserCjsRequire;');
    expect(transformed).toContain('case "react": return __pieBrowserCjsReactRequire;');
    expect(transformed).toContain('case "react-dom": return __pieBrowserCjsReactDomRequire;');
    expect(transformed).toContain(
      'case "react-dom/client": return __pieBrowserCjsReactDomClientRequire;'
    );
    expect(transformed).toContain('case "classnames": return __pieBrowserCjsClassnamesRequire;');
    expect(transformed).toContain('case "prop-types": return __pieBrowserCjsPropTypesRequire;');
  });

  it('fails when a separate chunk calls an imported helper with an unsupported target', () => {
    expect(() =>
      runBundle({
        'shared.js': `var req = /* @__PURE__ */ ((fallback) => typeof require < "u" ? require : fallback)(function(id) {
  throw Error("Calling \`require\` for \\"" + id + "\\" in an environment that doesn't expose the \`require\` function.");
});
export { req as $ };`,
        'consumer.js': `import { $ as req } from "./shared.js";
var fs = req("fs");`,
      })
    ).toThrow('Unsupported browser CJS require helper target(s): fs');
  });

  it('ignores non-module strings passed to a minified imported helper alias', () => {
    expect(() =>
      runBundle({
        'shared.js': `var req = /* @__PURE__ */ ((fallback) => typeof require < "u" ? require : fallback)(function(id) {
  throw Error("Calling \`require\` for \\"" + id + "\\" in an environment that doesn't expose the \`require\` function.");
});
export { req as $ };`,
        'consumer.js': `import { $ as i } from "./shared.js";
var message = i("overridden or never called on this node");`,
      })
    ).not.toThrow();
  });

  it('keeps prop-types compatible with default-import interop checks', () => {
    const transformed =
      render(`var req = /* @__PURE__ */ ((fallback) => typeof require < "u" ? require : fallback)(function(id) {
  throw Error("Calling \`require\` for \\"" + id + "\\" in an environment that doesn't expose the \`require\` function.");
});
var mod = req("prop-types");
var wrapped = mod && mod.__esModule ? mod : { default: mod };
if (!wrapped.default.string.isRequired) throw new Error("missing default prop-types validator");`);

    expect(transformed).toContain('if (property === "__esModule") return false;');
    expect(() => new Function(transformed)()).not.toThrow();
  });
});
