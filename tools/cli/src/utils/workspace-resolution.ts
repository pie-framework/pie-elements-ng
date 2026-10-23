import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

export interface WorkspaceResolutionIssue {
  dependency: string;
  expectedPath?: string;
  resolvedPath?: string;
  reason: string;
}

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
] as const;

/** Check package identity without loading an entry point (dist may not exist yet). */
export function checkWorkspaceResolution(
  manifestPath: string,
  workspacePackages: ReadonlyMap<string, string>
): WorkspaceResolutionIssue[] {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<
    string,
    Record<string, string> | undefined
  >;
  const dependencies = new Set(
    DEPENDENCY_FIELDS.flatMap((field) =>
      Object.entries(manifest[field] ?? {})
        .filter(([, range]) => range.startsWith('workspace:'))
        .map(([name]) => name)
    )
  );
  const requireFromConsumer = createRequire(manifestPath);
  const issues: WorkspaceResolutionIssue[] = [];
  for (const dependency of [...dependencies].sort()) {
    const expectedPath = workspacePackages.get(dependency);
    const lookupPaths = requireFromConsumer.resolve.paths(dependency) ?? [];
    const installedPath = lookupPaths
      .map((base) => join(base, dependency))
      .find((candidate) => lstatSync(candidate, { throwIfNoEntry: false }));
    let resolvedPath: string | undefined;
    let installedName: string | undefined;
    if (installedPath) {
      try {
        resolvedPath = realpathSync(installedPath);
        installedName = JSON.parse(readFileSync(join(resolvedPath, 'package.json'), 'utf8')).name;
      } catch {
        // Keep the installed path in the diagnostic for dangling links and invalid manifests.
      }
    }
    if (
      expectedPath &&
      resolvedPath === realpathSync(expectedPath) &&
      installedName === dependency
    ) {
      continue;
    }
    issues.push({
      dependency,
      expectedPath,
      resolvedPath: resolvedPath ?? installedPath,
      reason: !expectedPath
        ? 'No workspace declares this package'
        : !installedPath
          ? 'Workspace dependency is not installed'
          : !installedName
            ? 'Workspace entry is broken or has no valid package manifest'
            : 'Installed package does not resolve to the declared workspace',
    });
  }
  return issues;
}
