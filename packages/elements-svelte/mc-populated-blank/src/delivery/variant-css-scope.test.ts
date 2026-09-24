import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// The variant sheets are injected into document.head, outside Svelte's scoping, so
// each selector has to anchor itself on the element root.
const CQT_CSS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'cqt-css');
const SHEETS = readdirSync(CQT_CSS_DIR).filter((name) => name.endsWith('.css'));
const ROOT_ANCHORS = ['.mc-populated-blank-root', ':is(.mc-populated-blank-root'];

/** Top-level selectors of every style rule, including those nested in @media. */
function selectorsOf(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors: string[] = [];
  for (const [, prelude] of withoutComments.matchAll(/([^{}]+)\{/g)) {
    const trimmed = prelude.trim();
    if (trimmed.startsWith('@')) continue;
    let depth = 0;
    let current = '';
    for (const ch of trimmed) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) {
        selectors.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    selectors.push(current.trim());
  }
  return selectors;
}

/** Innermost style rules as prelude + declarations, including those nested in @media. */
function rulesOf(css: string): Array<{ prelude: string; declarations: Map<string, string> }> {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, prelude, body]) => ({
    prelude: prelude.trim(),
    declarations: new Map(
      body
        .split(';')
        .map((d) => d.split(':'))
        .filter((parts) => parts.length > 1)
        .map(([name, ...value]) => [name.trim(), value.join(':').trim()])
    ),
  }));
}

/** Values that defer to the host instead of pinning a colour. */
const UNPINNED = new Set(['transparent', 'none', 'inherit', 'unset', 'initial', 'currentcolor']);

function pinned(declarations: Map<string, string>, ...properties: string[]): string | undefined {
  return properties.find((p) => {
    const value = declarations.get(p);
    return value !== undefined && !UNPINNED.has(value.toLowerCase());
  });
}

describe('bundled CQT variant CSS', () => {
  it('covers every sheet in cqt-css', () => {
    expect(SHEETS.length).toBeGreaterThan(0);
  });

  it.each(SHEETS)('%s anchors every selector on the element root', (name) => {
    const selectors = selectorsOf(readFileSync(join(CQT_CSS_DIR, name), 'utf8'));
    expect(selectors.length).toBeGreaterThan(0);
    const unanchored = selectors.filter((s) => !ROOT_ANCHORS.some((a) => s.startsWith(a)));
    expect(unanchored).toEqual([]);
  });

  // The sheets reproduce Learnosity's light-only look, so a colour they pin meets
  // whatever the host paints on the other side unless the same rule pins that
  // too: near-white text on #fcfcd3, or #cc3333 on a dark page.
  it.each(SHEETS)('%s pins background and text colour together', (name) => {
    const unpaired: string[] = [];
    const css = readFileSync(join(CQT_CSS_DIR, name), 'utf8');
    for (const { prelude, declarations } of rulesOf(css)) {
      const background = pinned(declarations, 'background', 'background-color');
      const color = pinned(declarations, 'color');
      if (background && !color) unpaired.push(`${prelude} { ${background} } without color`);
      if (color && !background) unpaired.push(`${prelude} { color } without background`);

      for (const property of declarations.keys()) {
        const [, hook, side] = property.match(/^(--mpb-[a-z0-9-]+)-(bg|color)$/) ?? [];
        const other = `${hook}-${side === 'bg' ? 'color' : 'bg'}`;
        if (hook && !declarations.has(other)) {
          unpaired.push(`${prelude} { ${property} } without ${other}`);
        }
      }
    }
    expect(unpaired).toEqual([]);
  });
});
