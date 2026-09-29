import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'svelte/compiler';
import { describe, expect, it } from 'vitest';

/**
 * The Svelte elements render in hosts that load no Tailwind, daisyUI or CSS reset:
 * the PIE players ship none. A framework class in element markup therefore styles
 * nothing there, and the element-demo cannot show it because its page imports
 * Tailwind. Before 0f1b96e3 the mc-populated-blank blank lost its underline and
 * the choices fieldset kept the browser border in Quiz Engine this way.
 *
 * A class the package's own CSS defines is the element's, whatever it is called.
 */
const words = (list: string) => list.trim().split(/\s+/);

const FRAMEWORK_CLASSES = new Set([
  // Tailwind
  ...words(`
    absolute antialiased block capitalize container contents fixed flex flow-root grid grow
    hidden inline inline-block inline-flex inline-grid invisible italic line-through
    lowercase not-sr-only overline relative shrink sr-only static sticky table truncate
    underline uppercase visible
  `),
  // daisyUI
  ...words(`
    alert badge btn card checkbox divider dropdown fieldset input join kbd label link
    loading menu modal radio range select tab tabs textarea toggle tooltip
  `),
]);

/** Roots that take a value: `mb-2`, `text-gray-600`, `btn-primary`. */
const FRAMEWORK_PREFIXES = [
  // Tailwind
  ...words(`
    accent align animate appearance aspect auto-cols auto-rows basis bg blur border bottom
    box break caret clear col columns content cursor decoration delay divide duration ease
    end fill flex float font from gap grid grow h indent inset items justify leading left
    line-clamp list m max-h max-w mb me min-h min-w ml mr ms mt mx my object opacity order
    origin outline overflow overscroll p pb pe pl place pointer-events pr ps pt px py resize
    right ring rotate rounded row scale scroll select self shadow shrink size skew snap
    space-x space-y start stroke text to top touch tracking transition translate via w
    whitespace z
  `),
  // daisyUI
  ...words(`
    alert badge btn card checkbox divider dropdown input join link loading menu modal radio
    range tab textarea toggle tooltip
  `),
];

function isFrameworkClass(token: string): boolean {
  // Variants (`hover:`, `md:`) and arbitrary values (`min-h-[1.5em]`) are Tailwind syntax.
  if (/[:[\]]/.test(token)) return true;
  const utility = token.replace(/^[!-]/, '');
  return (
    FRAMEWORK_CLASSES.has(utility) ||
    FRAMEWORK_PREFIXES.some((root) => utility.startsWith(`${root}-`))
  );
}

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const svelteRoot = join(repoRoot, 'packages/elements-svelte');
const PACKAGES = readdirSync(svelteRoot).filter((name) =>
  statSync(join(svelteRoot, name, 'src'), { throwIfNoEntry: false })?.isDirectory()
);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? sourceFiles(path) : [path];
  });
}

// A string piece of a class value; `glued` marks an end that touches an
// interpolation, where the token there is only part of a class name.
type Piece = { text: string; glued: [boolean, boolean] };

// ESTree nodes from the Svelte parser.
type Node = any;

/** The strings an expression can contribute to a class value; operands of tests are skipped. */
function classStrings(node: Node, scope: Map<string, Node>, out: Piece[]): void {
  switch (node?.type) {
    case 'Literal':
      if (typeof node.value === 'string') out.push({ text: node.value, glued: [false, false] });
      return;
    case 'TemplateLiteral':
      node.quasis.forEach((q: Node, i: number) => {
        out.push({ text: q.value.cooked ?? '', glued: [i > 0, i < node.quasis.length - 1] });
      });
      for (const e of node.expressions) classStrings(e, scope, out);
      return;
    case 'ConditionalExpression':
      classStrings(node.consequent, scope, out);
      classStrings(node.alternate, scope, out);
      return;
    case 'LogicalExpression':
      if (node.operator !== '&&') classStrings(node.left, scope, out);
      classStrings(node.right, scope, out);
      return;
    case 'ArrayExpression':
      for (const e of node.elements) classStrings(e, scope, out);
      return;
    case 'ObjectExpression':
      for (const p of node.properties) {
        const key = p.type === 'Property' && !p.computed ? (p.key.name ?? p.key.value) : undefined;
        if (typeof key === 'string') out.push({ text: key, glued: [false, false] });
      }
      return;
    case 'CallExpression':
      // `$derived(expr)`, and `[...].join(' ')` / `.filter(Boolean)` chains.
      if (node.callee.type === 'Identifier' && node.callee.name === '$derived') {
        classStrings(node.arguments[0], scope, out);
      } else if (node.callee.type === 'MemberExpression') {
        classStrings(node.callee.object, scope, out);
      }
      return;
    case 'Identifier': {
      const init = scope.get(node.name);
      scope.delete(node.name);
      classStrings(init, scope, out);
      return;
    }
  }
}

function tokensOf(pieces: Piece[]): string[] {
  return pieces.flatMap(({ text, glued }) => {
    const parts = text.split(/\s+/);
    return parts.filter((part, i) => {
      if (!part) return false;
      if (i === 0 && glued[0]) return false;
      if (i === parts.length - 1 && glued[1]) return false;
      return true;
    });
  });
}

/** Class tokens in a component's markup: `class` attributes and `class:` directives. */
function markupClasses(source: string): string[] {
  const ast = parse(source, { modern: true });
  // Top-level `const x = ...` in the instance script, so `class={x}` is followed.
  const declared = new Map<string, Node>();
  for (const statement of ast.instance?.content.body ?? []) {
    if (statement.type !== 'VariableDeclaration') continue;
    for (const d of statement.declarations) {
      if (d.id.type === 'Identifier' && d.init) declared.set(d.id.name, d.init);
    }
  }
  const found: string[] = [];
  const visit = (node: Node): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (node.type === 'ClassDirective') found.push(node.name);
    if (node.type === 'Attribute' && node.name === 'class' && node.value !== true) {
      const values = Array.isArray(node.value) ? node.value : [node.value];
      const pieces: Piece[] = [];
      values.forEach((v: Node, i: number) => {
        if (v.type === 'Text') pieces.push({ text: v.data, glued: [i > 0, i < values.length - 1] });
        else classStrings(v.expression, new Map(declared), pieces);
      });
      found.push(...tokensOf(pieces));
    }
    for (const value of Object.values(node)) visit(value);
  };
  visit(ast.fragment);
  return found;
}

describe.each(PACKAGES)('%s markup', (pkg) => {
  it('uses no class that only a host framework styles', () => {
    const files = sourceFiles(join(svelteRoot, pkg, 'src'));
    const css = files.filter((f) => f.endsWith('.css')).map((f) => readFileSync(f, 'utf8'));
    const used: Array<[string, string]> = [];
    for (const file of files.filter((f) => f.endsWith('.svelte'))) {
      const source = readFileSync(file, 'utf8');
      css.push(...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g).map((m) => m[1]));
      for (const token of markupClasses(source))
        used.push([token, file.slice(repoRoot.length + 1)]);
    }
    const defined = new Set(
      css
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)
        .map((m) => m[1])
    );

    const hostStyled = used
      .filter(([token]) => isFrameworkClass(token) && !defined.has(token))
      .map(([token, file]) => `${token} (${file})`);

    expect([...new Set(hostStyled)]).toEqual([]);
  });
});
