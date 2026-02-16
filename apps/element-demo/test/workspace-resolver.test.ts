import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { workspaceResolver } from '../src/vite-plugin-workspace-resolver';
import type { ConfigEnv, UserConfig } from 'vite';

describe('workspaceResolver', () => {
  it('resolves subpath exports to source files', () => {
    const plugin = workspaceResolver({
      workspaceRoot: process.cwd(),
      resolveSources: true,
      debug: false,
    });

    const env: ConfigEnv = { command: 'serve', mode: 'test', isSsrBuild: false };
    const baseConfig: UserConfig = { resolve: { alias: [] } };
    const configHook = plugin.config;
    const hookContext = {
      meta: {},
      debug: () => {},
      warn: () => {},
      error: () => {
        throw new Error('workspaceResolver config hook failed');
      },
      info: () => {},
    } as any;
    const configResult = configHook
      ? typeof configHook === 'function'
        ? configHook.call(hookContext, baseConfig, env)
        : configHook.handler.call(hookContext, baseConfig, env)
      : undefined;
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
