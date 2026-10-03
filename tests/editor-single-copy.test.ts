// Guards the one invariant the editor stack cannot express for itself: exactly one copy of
// tiptap and of the two prosemirror packages it shares state through.
//
// tiptap pins its own peers exactly from 3.24.0 on, so a mixed @tiptap/* set cannot be
// satisfied and a second @tiptap/core resolves. prosemirror-model and prosemirror-view are the
// same problem one layer down: the sibling prosemirror-* packages depend on them by caret, and
// two copies make tiptap warn "prosemirror-model is loaded more than once. Wrapping and
// splitting nodes will fail." Neither failure shows up as a build or type error — the editor
// just misbehaves at runtime — so it is asserted against the lockfile and the manifests. See
// the `overrides` note in the root package.json. PIE-1042.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { glob } from 'glob';
import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(import.meta.dirname, '..');
const EXPECTED_TIPTAP = '3.31.3';
const SINGLE_COPY_PROSEMIRROR = ['prosemirror-model', 'prosemirror-view'];

function resolvedVersions(lockfile: string, packageName: string): Set<string> {
  const escaped = packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^\\s*"[^"]*${escaped}": \\["${escaped}@([^"]+)"`, 'gm');
  const versions = new Set<string>();
  for (const match of lockfile.matchAll(pattern)) versions.add(match[1]);
  return versions;
}

describe('editor dependency single-copy invariant', () => {
  it('resolves exactly one version of every @tiptap/* package', async () => {
    const lockfile = await readFile(join(REPO_ROOT, 'bun.lock'), 'utf8');

    const names = new Set<string>();
    for (const match of lockfile.matchAll(/"(@tiptap\/[a-z0-9-]+)@[0-9]/g)) names.add(match[1]);
    expect(names.size).toBeGreaterThan(0);

    const duplicated: Record<string, string[]> = {};
    for (const name of [...names].sort()) {
      const versions = resolvedVersions(lockfile, name);
      if (versions.size > 1) duplicated[name] = [...versions].sort();
    }
    expect(duplicated).toEqual({});
  });

  it('resolves exactly one version of the shared prosemirror packages', async () => {
    const lockfile = await readFile(join(REPO_ROOT, 'bun.lock'), 'utf8');

    const duplicated: Record<string, string[]> = {};
    for (const name of SINGLE_COPY_PROSEMIRROR) {
      const versions = resolvedVersions(lockfile, name);
      expect(versions.size).toBeGreaterThan(0);
      if (versions.size > 1) duplicated[name] = [...versions].sort();
    }
    expect(duplicated).toEqual({});
  });

  it('declares every @tiptap/* dependency as one exact version, never a range', async () => {
    const manifests = await glob('**/package.json', {
      cwd: REPO_ROOT,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.svelte-kit/**'],
      absolute: true,
    });

    // A range is what broke this before: a lone Dependabot bump moved one package while
    // @tiptap/core stayed put, and the exact peer pins could no longer all be satisfied.
    const offenders: string[] = [];
    for (const manifest of manifests) {
      const pkg = JSON.parse(await readFile(manifest, 'utf8'));
      const relative = manifest.slice(REPO_ROOT.length + 1);
      for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
        for (const [name, version] of Object.entries(pkg[field] ?? {})) {
          if (!name.startsWith('@tiptap/')) continue;
          if (version !== EXPECTED_TIPTAP) {
            offenders.push(`${relative} ${field}.${name} = ${version}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('declares every @tiptap/* package that tiptap itself reaches through a range', async () => {
    // The root `overrides` hold this tree's copies; a consumer has no overrides and resolves a
    // ranged @tiptap/* dependency to the newest release, past the rest of the set. @tiptap/react
    // takes both menus by caret, so a published manifest has to declare them exactly itself.
    const lockfile = await readFile(join(REPO_ROOT, 'bun.lock'), 'utf8');
    const tiptapDeps = new Map<string, Record<string, string>>();
    for (const match of lockfile.matchAll(
      /^\s*"(@tiptap\/[a-z0-9-]+)": \["[^"]+", "[^"]*", (\{.*\}), "sha/gm
    )) {
      const meta = JSON.parse(match[2]);
      const deps = { ...meta.dependencies, ...meta.optionalDependencies };
      tiptapDeps.set(
        match[1],
        Object.fromEntries(Object.entries(deps).filter(([name]) => name.startsWith('@tiptap/')))
      );
    }
    expect(tiptapDeps.size).toBeGreaterThan(0);

    const manifests = await glob('**/package.json', {
      cwd: REPO_ROOT,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.svelte-kit/**'],
      absolute: true,
    });

    const offenders: string[] = [];
    for (const manifest of manifests) {
      const pkg = JSON.parse(await readFile(manifest, 'utf8'));
      if (pkg.private) continue;
      const declared = new Set(
        Object.keys(pkg.dependencies ?? {}).filter((name) => name.startsWith('@tiptap/'))
      );
      const queue = [...declared];
      const seen = new Set(queue);
      while (queue.length > 0) {
        for (const [name, version] of Object.entries(tiptapDeps.get(queue.pop() ?? '') ?? {})) {
          if (version !== EXPECTED_TIPTAP && !declared.has(name)) {
            offenders.push(`${manifest.slice(REPO_ROOT.length + 1)} ${name} (${version})`);
          }
          if (!seen.has(name)) {
            seen.add(name);
            queue.push(name);
          }
        }
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  });
});
