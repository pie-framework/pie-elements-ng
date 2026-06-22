import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { globSync } from 'glob';

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf-8')) as T;
}

describe('browser ESM private child custom elements', () => {
  const root = process.cwd();

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
});
