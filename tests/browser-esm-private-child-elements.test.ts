import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { globSync } from 'glob';
import { beforeAll } from 'vitest';

type PrivateChildCase = {
  slug: string;
  views: Array<{
    view: 'delivery' | 'author' | 'print';
    tags: string[];
  }>;
};

const cases: PrivateChildCase[] = [
  {
    slug: 'ebsr',
    views: [
      { view: 'delivery', tags: ['ebsr-multiple-choice'] },
      { view: 'author', tags: ['ebsr-multiple-choice-configure'] },
      { view: 'print', tags: ['ebsr-multiple-choice'] },
    ],
  },
  {
    slug: 'complex-rubric',
    views: [
      {
        view: 'delivery',
        tags: ['complex-rubric-simple', 'complex-rubric-multi-trait'],
      },
      {
        view: 'author',
        tags: ['rubric-configure', 'multi-trait-rubric-configure'],
      },
      {
        view: 'print',
        tags: ['complex-rubric-simple', 'complex-rubric-multi-trait'],
      },
    ],
  },
];

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf-8')) as T;
}

function encodeVersionForTag(version: string): string {
  return version
    .trim()
    .toLowerCase()
    .replace(/[.+]/g, '-')
    .replace(/[^0-9A-Za-z-]/g, '-')
    .replace(/-{2,}/g, '-');
}

async function importBuiltView(path: string): Promise<void> {
  await import(`${pathToFileURL(path).href}?private-child-test=${Date.now()}-${Math.random()}`);
}

describe('browser ESM private child custom elements', () => {
  const root = process.cwd();

  beforeAll(() => {
    for (const { slug } of cases) {
      execFileSync('bun', ['run', '--cwd', `packages/elements-react/${slug}`, 'build'], {
        cwd: root,
        stdio: 'pipe',
      });
    }
  }, 60_000);

  test('shared browser build preserves package-owned private child registration', async () => {
    const browserConfig = await readFile(
      join(root, 'tools/vite/element-browser.config.ts'),
      'utf-8'
    );

    expect(browserConfig).toContain('__PIE_PACKAGE_VERSION__');
    expect(browserConfig).not.toContain("replaceAll('customElements.define('");
  });

  test('browser view sources do not self-register authored top-level element tags', async () => {
    const sourceFiles = globSync(
      'packages/elements-react/*/src/{delivery,author,print}/index.{ts,tsx}',
      {
        cwd: root,
        absolute: true,
      }
    );
    const violations: string[] = [];

    for (const sourceFile of sourceFiles) {
      const source = await readFile(sourceFile, 'utf-8');
      const packageDir = dirname(dirname(dirname(sourceFile)));
      const pkg = await readJson<{ name?: string }>(join(packageDir, 'package.json'));
      const slug = pkg.name?.replace(/^@pie-element\//, '');

      if (!slug) {
        continue;
      }

      const publicTagPattern = new RegExp(`customElements\\.define\\(\\s*['"]${slug}-element['"]`);
      if (publicTagPattern.test(source)) {
        violations.push(sourceFile);
      }
    }

    expect(violations).toEqual([]);
  });

  test.each(cases)('$slug browser ESM views register version-scoped private child tags', async ({
    slug,
    views,
  }) => {
    const packageDir = join(root, 'packages/elements-react', slug);
    const pkg = await readJson<{ version: string }>(join(packageDir, 'package.json'));
    const versionSuffix = `--version-${encodeVersionForTag(pkg.version)}`;
    const browserFiles = globSync('dist/browser/**/*.js', {
      cwd: packageDir,
      absolute: true,
    });
    const browserOutput = (
      await Promise.all(browserFiles.map((path) => readFile(path, 'utf-8')))
    ).join('\n');

    expect(browserOutput).toContain(pkg.version);
    expect(browserOutput).toContain('--version-');

    for (const { view, tags } of views) {
      const entry = join(packageDir, `dist/browser/${view}/index.js`);
      const source = await readFile(entry, 'utf-8');

      expect(source).toContain('customElements.define');
      await importBuiltView(entry);
      for (const tag of tags) {
        expect(customElements.get(`${tag}${versionSuffix}`)).toBeDefined();
        expect(browserOutput).toContain(tag);
        expect(browserOutput).not.toMatch(new RegExp(`['"]${tag}['"]`));
      }
    }
  });
});
