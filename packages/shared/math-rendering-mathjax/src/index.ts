/**
 * @pie-element/math-rendering-mathjax
 *
 * MathJax adapter for PIE math rendering.
 * Full-featured LaTeX and MathML rendering with accessibility support.
 *
 * It also implements the legacy @pie-lib/math-rendering API (renderMath, wrapMath,
 * unWrapMath, mmlToLatex) on MathJax 4; @pie-lib/math-rendering re-exports it.
 *
 * @example
 * ```typescript
 * import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
 *
 * const renderer = createMathjaxRenderer();
 * renderer(document.body);
 * ```
 */

export { createMathjaxRenderer, getMathjaxCssUrls } from './adapter.js';
export type { MathRenderer, MathRenderingAPI, MathjaxOptions } from './types.js';
export { MATHJAX_CONFLICT_EVENT, UNSUPPORTED_PAGE_DOCS_URL } from './unsupported-page.js';
export type { MathjaxConflictCondition, MathjaxConflictDetail } from './unsupported-page.js';
export { NO_ASSET_ROOT_EVENT } from './assets.js';
export type { NoAssetRootDetail, NoAssetRootEffect } from './assets.js';

export { mathContentName } from './math-name.js';
export type { MathNameOptions } from './math-name.js';
export { speakMathml } from './math-speech.js';

// Legacy @pie-lib/math-rendering API for backward compatibility
export { renderMath, wrapMath, unWrapMath, mmlToLatex } from './render-math.js';
