/**
 * Legacy @pie-lib/math-rendering API for MathJax v4
 *
 * Provides backward compatibility with upstream pie-elements code.
 * MathJax handles LaTeX and MathML natively, so most functions are simple.
 */

import { createMathjaxRenderer, stripLegacyDelimiters } from './adapter.js';
import { nameMathInControls } from './math-name.js';

const PLAYER_MATH_RENDERING_KEY = '@pie-lib/math-rendering';

// The legacy renderer reads its page options from this global, single-dollar delimiters included.
const LEGACY_OPTIONS_KEY = '@pie-lib/math-rendering@2';

// The legacy print player imports the legacy renderer itself and publishes its `renderMath` on
// `window` when that import resolves, which can be after the elements it prints first render. The
// pie-players print player is also `<pie-print>`, imports no renderer and sets no import flag.
const PRINT_PLAYER_TAG = 'pie-print';
const PRINT_RENDERER_POLL_MS = 50;
const PRINT_RENDERER_TIMEOUT_MS = 10_000;

type RenderMathFn = (element: HTMLElement) => void | Promise<void>;

type PlayerMathRenderingApi = {
  renderMath?: RenderMathFn;
  wrapMath?: (latex: string, wrapType?: string | null) => string;
  unWrapMath?: (latex: string) => unknown;
  mmlToLatex?: (mathml: string) => string;
};

type PrintPlayer = HTMLElement & { mathRenderingModuleUrlImported?: boolean };

// Singleton renderer instance
let renderer: ReturnType<typeof createMathjaxRenderer> | null = null;

function pageUsesSingleDollar(): boolean {
  const legacyOptions = (window as any)[LEGACY_OPTIONS_KEY] as
    | { opts?: { useSingleDollar?: unknown } }
    | undefined;
  return Boolean(legacyOptions?.opts?.useSingleDollar);
}

function getRenderer() {
  if (!renderer) {
    renderer = createMathjaxRenderer({ useSingleDollar: pageUsesSingleDollar() });
  }
  return renderer;
}

function getPlayerMathRenderer(): PlayerMathRenderingApi | null {
  if (typeof window === 'undefined') return null;

  const renderer = (window as any)[PLAYER_MATH_RENDERING_KEY] as PlayerMathRenderingApi | undefined;

  // This module's own renderMath, installed as the page's renderer, would delegate to itself.
  return typeof renderer?.renderMath === 'function' && renderer.renderMath !== renderMath
    ? renderer
    : null;
}

/** The `<pie-print>` an element renders in, across shadow roots. */
function enclosingPrintPlayer(element: Element): PrintPlayer | null {
  let node: Node | null = element;
  while (node) {
    if (node instanceof Element && node.localName === PRINT_PLAYER_TAG) return node as PrintPlayer;
    node = node instanceof ShadowRoot ? node.host : node.parentNode;
  }
  return null;
}

function printPlayerRenderMath(): RenderMathFn | null {
  const render = (window as { renderMath?: unknown }).renderMath;
  return typeof render === 'function' ? (render as RenderMathFn) : null;
}

/**
 * The legacy print player's renderer, waited for while the player is still importing it. Null
 * when no player imports one, or it does not arrive in time, so the element's own MathJax renders.
 */
async function legacyPrintRenderMath(element: HTMLElement): Promise<RenderMathFn | null> {
  const player = enclosingPrintPlayer(element);
  if (!player) return null;
  const ready = printPlayerRenderMath();
  if (ready || player.mathRenderingModuleUrlImported !== true) return ready;

  const deadline = Date.now() + PRINT_RENDERER_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, PRINT_RENDERER_POLL_MS));
    const render = printPlayerRenderMath();
    if (render) return render;
  }
  return null;
}

/**
 * Render math in a DOM element or HTML string using MathJax
 */
export const renderMath = async (el?: Element | string): Promise<string | undefined> => {
  if (typeof window === 'undefined') return;

  const isString = typeof el === 'string';
  let target: HTMLElement;

  if (isString) {
    target = document.createElement('div');
    target.innerHTML = el as string;
  } else {
    target = (el || document.body) as HTMLElement;
  }

  // Delegating adds no MathJax to the page; the adapter reports MathJax 4 meeting MathJax 3.
  const playerRenderer = getPlayerMathRenderer();
  const printRenderMath = playerRenderer || isString ? null : await legacyPrintRenderMath(target);
  // A delegated renderer typesets without naming the math in controls, so it is named here.
  if (playerRenderer) {
    await playerRenderer.renderMath?.(target);
    nameMathInControls(target);
  } else if (printRenderMath && printRenderMath !== renderMath) {
    await printRenderMath(target);
    nameMathInControls(target);
  } else {
    await getRenderer()(target);
  }

  return isString ? target.innerHTML : undefined;
};

/**
 * Wraps LaTeX in inline delimiters, through the page renderer's `wrapMath` when it has one. The
 * fallback wraps as `@pie-lib/math-rendering` does, `$…$` for its `dollar` and `double_dollar`
 * wrap types and `\(…\)` for any other, so a math node saves the same markup whichever renderer
 * the authoring page installed. LaTeX that already has delimiters keeps one pair, where the legacy
 * function adds a second: a math span saved without `data-raw` reaches the editor with its
 * delimiters.
 */
export const wrapMath = (latex: string, wrapType?: string | null): string => {
  const pageWrapped = getPlayerMathRenderer()?.wrapMath?.(latex, wrapType);
  if (pageWrapped != null) return pageWrapped;
  const [open, close] =
    wrapType === 'dollar' || wrapType === 'double_dollar' ? ['$', '$'] : ['\\(', '\\)'];
  return `${open}${stripLegacyDelimiters(latex)}${close}`;
};

/**
 * Unwrap LaTeX delimiters - minimal implementation for editable-html-tip-tap
 */
export const unWrapMath = (
  latex: string
): { unwrapped: string; wrapper?: { open: string; close: string } } => {
  const trimmed = latex.trim();

  if (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) {
    return { unwrapped: trimmed.slice(2, -2).trim(), wrapper: { open: '\\[', close: '\\]' } };
  }
  if (trimmed.startsWith('\\(') && trimmed.endsWith('\\)')) {
    return { unwrapped: trimmed.slice(2, -2).trim(), wrapper: { open: '\\(', close: '\\)' } };
  }
  if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
    return { unwrapped: trimmed.slice(2, -2).trim(), wrapper: { open: '$$', close: '$$' } };
  }
  if (trimmed.startsWith('$') && trimmed.endsWith('$')) {
    return { unwrapped: trimmed.slice(1, -1).trim(), wrapper: { open: '$', close: '$' } };
  }

  return { unwrapped: trimmed };
};

/**
 * MathML to LaTeX - MathJax renders MathML natively, so just pass through
 */
export const mmlToLatex = (mathml: string): string =>
  getPlayerMathRenderer()?.mmlToLatex?.(mathml) ?? mathml;
