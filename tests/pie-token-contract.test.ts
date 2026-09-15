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

/**
 * The React packages reach `--pie-*` through the `color.*()` accessors in
 * `@pie-lib/render-ui`, so that module is the chokepoint: a token it can emit is
 * a token any of the twelve element packages can paint with. PIE-856 moved the
 * `theme.palette.grey` reads onto those accessors, which is only an improvement
 * while every accessor resolves to a name the registry owns.
 *
 * These names are not in that registry and no scheme can reach them directly.
 * `--pie-primary-text`, `--pie-secondary-text` and the three `--pie-table-*`
 * names chain through to a registered token, so they degrade to a themed value;
 * the keypad and keyboard-focus names do not, and fall back to a fixed literal
 * under every scheme. Closing the gap means a registry entry in `pie-players`,
 * so they are recorded here rather than silently tolerated.
 *
 * The `--pie-table-*` trio arrived with the upstream `pie-lib` sync that added
 * `color.tableGrid()` / `tableGridLight()` / `tableStripe()` for authored tables.
 * They chain onto `--pie-text`, `--pie-border-light` and `--pie-background-dark`
 * respectively, which the registry does own.
 */
const KNOWN_UNREGISTERED_TOKENS = new Set([
  '--pie-keyboard-focus-indicator',
  '--pie-keypad-button',
  '--pie-keypad-button-hover',
  '--pie-keypad-button-operator',
  '--pie-keypad-empty-placeholder',
  '--pie-primary-text',
  '--pie-prompt-holder-max-width',
  '--pie-secondary-text',
  '--pie-table-grid',
  '--pie-table-grid-light',
  '--pie-table-stripe',
  '--pie-zoom',
]);

/**
 * Every `--pie-*` the React source tree may name, whether through a `color.*()`
 * accessor or a literal `var()` string. `canonical-semantic` unless noted.
 */
const REACT_ALLOWED_TOKENS = new Set([
  '--pie-background',
  '--pie-background-dark',
  '--pie-black',
  '--pie-blue-grey-100',
  '--pie-blue-grey-300',
  '--pie-blue-grey-600',
  '--pie-blue-grey-900',
  '--pie-border',
  '--pie-border-dark',
  '--pie-border-gray',
  '--pie-border-light',
  '--pie-button-border',
  '--pie-button-focus-outline',
  '--pie-button-hover-bg',
  '--pie-correct',
  '--pie-correct-icon',
  '--pie-correct-secondary',
  '--pie-correct-tertiary',
  '--pie-disabled',
  '--pie-disabled-secondary',
  '--pie-dropdown-background',
  '--pie-faded-primary',
  '--pie-focus-checked',
  '--pie-focus-checked-border',
  '--pie-focus-unchecked',
  '--pie-focus-unchecked-border',
  '--pie-incorrect',
  '--pie-incorrect-icon',
  '--pie-incorrect-secondary',
  '--pie-missing',
  '--pie-missing-icon',
  // component-public: owned by the passage element, registered in pie-players.
  '--pie-passage-header-background',
  '--pie-primary',
  '--pie-primary-dark',
  '--pie-primary-light',
  '--pie-secondary',
  '--pie-secondary-background',
  '--pie-secondary-dark',
  '--pie-secondary-light',
  '--pie-surface',
  '--pie-tertiary',
  '--pie-tertiary-light',
  '--pie-text',
  '--pie-white',
]);

const REACT_SOURCE_ROOTS = ['packages/elements-react', 'packages/lib-react'];
const REACT_SOURCE_EXTENSIONS = new Set(['.css', '.ts', '.tsx']);

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

function reactSourceFiles(): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'dist') continue;
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (REACT_SOURCE_EXTENSIONS.has(extname(path))) {
        found.push(path);
      }
    }
  };
  for (const root of REACT_SOURCE_ROOTS) walk(join(repoRoot, root));
  return found;
}

describe('React --pie-* token contract', () => {
  it('every color.*() accessor resolves to a registered token', () => {
    const colorModule = readFileSync(
      join(repoRoot, 'packages/lib-react/render-ui/src/color.ts'),
      'utf8'
    );

    // pv('a', 'b', fallback) reads --pie-a, falling back through --pie-b.
    const emitted: string[] = [];
    for (const [, accessor, args] of colorModule.matchAll(
      /export const (\w+) = \(\) => pv\(([^)]*)\)/g
    )) {
      for (const [, token] of args.matchAll(/'([a-z0-9-]+)'/g)) {
        const name = `--pie-${token}`;
        if (!REACT_ALLOWED_TOKENS.has(name) && !KNOWN_UNREGISTERED_TOKENS.has(name)) {
          emitted.push(`${name} (color.${accessor}())`);
        }
      }
    }

    expect(emitted).toEqual([]);
  });

  it('names no --pie-* token outside the registered set', () => {
    const unregistered: string[] = [];
    for (const file of reactSourceFiles()) {
      for (const [name] of readFileSync(file, 'utf8').matchAll(/--pie-[a-z0-9-]+/g)) {
        if (REACT_ALLOWED_TOKENS.has(name) || KNOWN_UNREGISTERED_TOKENS.has(name)) continue;
        unregistered.push(`${name} (${file.slice(repoRoot.length + 1)})`);
      }
    }

    expect([...new Set(unregistered)]).toEqual([]);
  });

  it('reads no MUI grey from the palette', () => {
    /*
     * The regression PIE-856 closed. MUI's palette does not follow `--pie-*`, so a
     * `theme.palette.grey[N]` read holds one hex under every colour scheme -- below
     * the 3:1 non-text minimum in most of them.
     */
    const offenders: string[] = [];
    for (const file of reactSourceFiles()) {
      const contents = readFileSync(file, 'utf8');
      if (/palette\??\.grey/.test(contents)) offenders.push(file.slice(repoRoot.length + 1));
    }

    expect(offenders).toEqual([]);
  });
});
