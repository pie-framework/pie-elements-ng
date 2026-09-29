/**
 * Legacy @pie-lib/math-rendering API for MathJax v4
 *
 * Provides backward compatibility with upstream pie-elements code.
 * MathJax handles LaTeX and MathML natively, so most functions are simple.
 */

import { createMathjaxRenderer } from './adapter.js';

const PLAYER_MATH_RENDERING_KEY = '@pie-lib/math-rendering';

// The legacy renderer reads its page options from this global, single-dollar delimiters included.
const LEGACY_OPTIONS_KEY = '@pie-lib/math-rendering@2';

type PlayerMathRenderingApi = {
  renderMath?: (element: HTMLElement) => void | Promise<void>;
  wrapMath?: (latex: string) => string;
  unWrapMath?: (latex: string) => unknown;
  mmlToLatex?: (mathml: string) => string;
};

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

  return typeof renderer?.renderMath === 'function' ? renderer : null;
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
  if (playerRenderer) {
    await playerRenderer.renderMath?.(target);
  } else {
    await getRenderer()(target);
  }

  return isString ? target.innerHTML : undefined;
};

/**
 * Wrap LaTeX - MathJax handles delimiters, so just pass through
 */
export const wrapMath = (latex: string): string =>
  getPlayerMathRenderer()?.wrapMath?.(latex) ?? latex;

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
