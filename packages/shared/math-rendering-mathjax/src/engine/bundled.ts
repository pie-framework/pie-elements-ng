/**
 * The MathJax engine of the browser ESM build, which `vite.browser.config.ts` puts in place of
 * `./page.ts`. Its MathJax is built from the `@mathjax/src` modules and lives in this module:
 * nothing reads or writes `window.MathJax`, so a host page's own MathJax, of any version, and
 * every other copy of this engine run beside it untouched.
 */
import type { MathJaxGlobal } from '../adapter.js';

let mathJax: MathJaxGlobal | undefined;

export function engineMathJax(): MathJaxGlobal | undefined {
  return mathJax;
}

/**
 * The engine chunk, requested as this module evaluates. Players import element modules before
 * they render, the section player a whole section's at once, so the download is done before the
 * first math. Nothing in the chunk touches the page until `loadMathJax` starts it.
 */
const engine = import('./bundled/mathjax.js');
// A failed request rejects the renders that hold math.
engine.catch(() => {});

/**
 * Starts this copy's MathJax from `config`, the configuration the page engine installs as
 * `window.MathJax`.
 */
export async function loadMathJax(config: MathJaxGlobal, _srcUrl: string): Promise<void> {
  const { createMathJax } = await engine;
  mathJax = createMathJax(config);
  const ready = config.startup?.ready ?? mathJax.startup?.defaultReady;
  ready?.();
}

/** Each copy of this engine is its own MathJax, so its load is its own too. */
export const loadingRegistry: object = {};

const COPIES: unique symbol = Symbol.for('@pie-element/shared-math-rendering-mathjax/bundled');

type CopyRegistry = { [COPIES]?: number };

/**
 * A MathJax replaces the `<style>` in `<head>` that has its stylesheet id with its own, so every
 * copy of this engine on a page takes a different one.
 */
function nextStylesheetId(): string {
  const registry = globalThis as CopyRegistry;
  registry[COPIES] = (registry[COPIES] ?? 0) + 1;
  return `PIE-MJX-CHTML-styles-${registry[COPIES]}`;
}

export const OWN_STYLESHEET_ID = nextStylesheetId();

/**
 * Another MathJax's CHTML stylesheet styles every `mjx-container[jax="CHTML"]`, this engine's
 * output included. SVG output's stylesheet applies to SVG output only.
 */
export const FOREIGN_OUTPUT_STYLESHEETS = ['MJX-CHTML-styles'];

/** A MathJax 3 on the page shares nothing with this engine. */
export function conflictingMathjax3Version(): string | undefined {
  return undefined;
}
