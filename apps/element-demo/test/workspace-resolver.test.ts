import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { workspaceResolver } from '../src/vite-plugin-workspace-resolver';

describe('workspaceResolver', () => {
  it('resolves subpath exports to source files', () => {
    const plugin = workspaceResolver({
      workspaceRoot: process.cwd(),
      resolveSources: true,
      debug: false,
    });

    const configResult = plugin.config?.({ resolve: { alias: [] } });
    const aliases = (configResult as any)?.resolve?.alias ?? [];
    const findAlias = (id: string) => aliases.find((alias: any) => alias.find === id)?.replacement;

    const expected = path.join(
      process.cwd(),
      'packages',
      'elements-react',
      'categorize',
      'src',
      'controller',
      'index.ts'
    );

    expect(findAlias('@pie-element/categorize/controller')).toBe(expected);
  });
});
