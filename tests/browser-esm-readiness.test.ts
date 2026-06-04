import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const formerlyBlockedElements = [
  { kind: 'react', slug: 'math-inline', views: ['delivery', 'author', 'print', 'controller'] },
  { kind: 'react', slug: 'math-templated', views: ['delivery', 'author', 'print', 'controller'] },
  {
    kind: 'svelte',
    slug: 'mc-populated-blank',
    views: ['delivery', 'author', 'print', 'controller'],
  },
  { kind: 'svelte', slug: 'simple-cloze', views: ['delivery', 'author', 'print', 'controller'] },
  { kind: 'svelte', slug: 'venn-classification', views: ['delivery', 'author', 'controller'] },
] as const;

type PackageJson = {
  private?: boolean;
  scripts?: Record<string, string>;
  exports?: Record<string, { default?: string; types?: string } | string>;
  pie?: {
    browserSharedDependencies?: Record<string, string>;
  };
};

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf-8')) as T;
}

describe('browser ESM readiness report', () => {
  const root = process.cwd();

  test('has no unsupported browser ESM elements', async () => {
    const report = await readJson<{
      browserEsmReady?: string[];
      browserEsmUnsupported?: Record<string, unknown>;
    }>(join(root, '.compatibility/report.json'));

    expect(report.browserEsmUnsupported ?? {}).toEqual({});
    for (const { slug } of formerlyBlockedElements) {
      expect(report.browserEsmReady).toContain(slug);
    }
  });

  test('root build includes every formerly blocked element', async () => {
    const rootPackageJson = await readJson<{ scripts?: Record<string, string> }>(
      join(root, 'package.json')
    );
    const buildScript = rootPackageJson.scripts?.build ?? '';

    for (const { slug } of formerlyBlockedElements) {
      expect(buildScript).not.toContain(`--filter=!@pie-element/${slug}`);
    }
  });
});

describe('formerly blocked element browser package surfaces', () => {
  const root = process.cwd();

  test.each(formerlyBlockedElements)('$slug publishes browser ESM entries', async (element) => {
    const packageDir = join(
      root,
      'packages',
      element.kind === 'react' ? 'elements-react' : 'elements-svelte',
      element.slug
    );
    const pkg = await readJson<PackageJson>(join(packageDir, 'package.json'));

    expect(pkg.private).not.toBe(true);
    expect(pkg.scripts?.build).toContain('element-browser');
    if (element.kind === 'react') {
      expect(pkg.pie?.browserSharedDependencies).toEqual({
        react: '18.2.0',
        'react-dom': '18.2.0',
      });
    } else {
      expect(pkg.pie?.browserSharedDependencies).toBeUndefined();
    }

    for (const view of element.views) {
      const exportKey = `./browser/${view}`;
      const target = pkg.exports?.[exportKey];
      const defaultTarget = typeof target === 'string' ? target : target?.default;

      expect(defaultTarget).toBe(`./dist/browser/${view}/index.js`);
      expect(existsSync(join(packageDir, `dist/browser/${view}/index.js`))).toBe(true);
    }
  });
});
