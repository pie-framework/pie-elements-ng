import { describe, expect, it } from 'vitest';
import { createWorkspacePackageJson } from '../src/runtime-template';

describe('runtime template', () => {
  it('uses workspace refs in workspace-fast mode template', () => {
    const pkg = createWorkspacePackageJson(
      [{ name: '@pie-element/categorize', version: '0.1.0' }],
      { useWorkspaceRefs: true }
    ) as any;

    expect(pkg.dependencies['@pie-element/categorize']).toBe('workspace:*');
    expect(Array.isArray(pkg.workspaces)).toBe(true);
  });

  it('uses explicit versions in prod-faithful mode template', () => {
    const pkg = createWorkspacePackageJson(
      [{ name: '@pie-element/categorize', version: '0.1.0' }],
      { useWorkspaceRefs: false }
    ) as any;

    expect(pkg.dependencies['@pie-element/categorize']).toBe('0.1.0');
    expect(pkg.workspaces).toBeUndefined();
  });
});
