import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * The Svelte element packages may only read `--pie-*` names that the
 * `pie-players` token registry owns. A name invented here is invisible to that
 * registry's gate, so no color scheme overrides it and no contrast rule covers
 * it — the failure mode PIE-857 closed by retiring the `--pie-correct-answer-*`
 * family onto the canonical tokens below.
 *
 * Element-private sizing and variant hooks use the `--mpb-*` / `--vc-*`
 * prefixes instead and are deliberately outside the host contract.
 *
 * Adding a name here means the token is `canonical-semantic` and `active` in
 * `pie-players` - `packages/theme/src/token-registry.json`. Anything else needs
 * a registry entry over there first, not an entry here.
 */
const REGISTERED_CANONICAL_TOKENS = new Set([
  '--pie-background-dark',
  '--pie-border-light',
  '--pie-button-focus-outline',
  '--pie-correct-icon',
  '--pie-correct-secondary',
  '--pie-correct-tertiary',
  '--pie-focus-checked-border',
  '--pie-incorrect-icon',
  '--pie-incorrect-secondary',
  '--pie-secondary-background',
  '--pie-tertiary',
  '--pie-tertiary-light',
  '--pie-text',
  '--pie-white',
]);

/**
 * `--pie-focus-outline` is `planned` in the registry, not yet defined by the
 * theme. Reading it as the first link of a focus chain is what the PIE-727
 * contract asks for, so it is allowed ahead of its implementation.
 */
const REGISTERED_PLANNED_TOKENS = new Set(['--pie-focus-outline']);

const SVELTE_ELEMENT_PACKAGES = ['mc-populated-blank', 'simple-cloze', 'venn-classification'];
const SOURCE_EXTENSIONS = new Set(['.css', '.svelte', '.ts']);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function sourceFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === 'dist') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...sourceFiles(path));
    } else if (SOURCE_EXTENSIONS.has(extname(path))) {
      found.push(path);
    }
  }
  return found;
}

function pieTokensIn(pkg: string): Map<string, string[]> {
  const byToken = new Map<string, string[]>();
  for (const file of sourceFiles(join(repoRoot, 'packages/elements-svelte', pkg, 'src'))) {
    const contents = readFileSync(file, 'utf8');
    for (const [name] of contents.matchAll(/--pie-[a-z0-9-]+/g)) {
      const seenIn = byToken.get(name) ?? [];
      seenIn.push(file.slice(repoRoot.length + 1));
      byToken.set(name, seenIn);
    }
  }
  return byToken;
}

describe.each(SVELTE_ELEMENT_PACKAGES)('%s --pie-* token contract', (pkg) => {
  const tokens = pieTokensIn(pkg);

  it('reads only registered --pie-* tokens', () => {
    const unregistered = [...tokens]
      .filter(
        ([name]) => !REGISTERED_CANONICAL_TOKENS.has(name) && !REGISTERED_PLANNED_TOKENS.has(name)
      )
      .map(([name, files]) => `${name} (${[...new Set(files)].join(', ')})`);

    expect(unregistered).toEqual([]);
  });

  it('declares no --pie-* token of its own', () => {
    const declared: string[] = [];
    for (const file of sourceFiles(join(repoRoot, 'packages/elements-svelte', pkg, 'src'))) {
      const contents = readFileSync(file, 'utf8');
      // A declaration assigns the name; a read wraps it in var().
      for (const [, name] of contents.matchAll(/(?<!var\()(--pie-[a-z0-9-]+)\s*:/g)) {
        declared.push(`${name} (${file.slice(repoRoot.length + 1)})`);
      }
    }

    expect(declared).toEqual([]);
  });
});
