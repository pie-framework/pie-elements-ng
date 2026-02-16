import type { BuildDependency } from './types.js';

export const TOOLING_DEPENDENCIES: Record<string, string> = {
  webpack: '^5.99.9',
  'esbuild-loader': '^4.3.0',
  'css-loader': '^7.1.2',
  'style-loader': '^4.0.0',
  '@babel/runtime': '^7.28.4',
};

export function createWorkspacePackageJson(
  deps: BuildDependency[],
  opts: { useWorkspaceRefs: boolean }
): Record<string, unknown> {
  const dependencyMap: Record<string, string> = {
    ...TOOLING_DEPENDENCIES,
  };
  for (const dep of deps) {
    dependencyMap[dep.name] = opts.useWorkspaceRefs ? 'workspace:*' : dep.version;
  }

  if (opts.useWorkspaceRefs) {
    return {
      name: 'pie-bundler-workspace',
      private: true,
      dependencies: dependencyMap,
      workspaces: [
        'packages/*',
        'packages/*/controller',
        'packages/*/configure',
        'packages/*/author',
      ],
    };
  }

  return {
    name: 'pie-bundler-runtime',
    private: true,
    dependencies: dependencyMap,
  };
}
