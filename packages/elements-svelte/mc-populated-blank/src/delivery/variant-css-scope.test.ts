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
});
