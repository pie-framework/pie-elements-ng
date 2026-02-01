/**
 * Math Rendering Core
 *
 * Core types and utilities for pluggable math rendering in PIE elements.
 * This package provides the foundation - actual rendering is done by adapter packages:
 *
 * - @pie-element/math-rendering-katex - Fast, lightweight KaTeX renderer (~100KB)
 * - @pie-element/math-rendering-mathjax - Full-featured MathJax renderer (~2.7MB)
 *
 * @example
 * ```typescript
 * import type { MathRenderer } from '@pie-element/shared-math-rendering-core';
 * import { createKatexRenderer } from '@pie-element/shared-math-rendering-katex';
 *
 * const renderer: MathRenderer = createKatexRenderer();
 * await renderer(document.body);
 * ```
 */

// Core types
export type { MathRenderer, TypesetConfig, BracketType } from './types';
export { BracketTypes } from './types';

// Utilities
export { wrapMath, unWrapMath, fixMathElement, fixMathElements } from './utils/normalization';
export { mmlToLatex } from './utils/mml-to-latex';
export { loadCss, isCssLoaded } from './utils/css-loader';
