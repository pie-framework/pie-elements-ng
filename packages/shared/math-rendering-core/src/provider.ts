/**
 * Global math rendering provider
 *
 * Manages the active renderer for consistent math rendering across PIE elements.
 * Provides programmatic switching between MathJax, KaTeX, or custom renderers.
 */

import type { MathRenderer } from './types';

/**
 * Math renderer provider class
 *
 * Singleton that manages the active math renderer globally.
 */
class MathRendererProvider {
	private currentRenderer: MathRenderer | null = null;

	/**
	 * Set the active math renderer
	 *
	 * @param renderer - The renderer function to use
	 *
	 * @example
	 * ```typescript
	 * import { createKatexRenderer } from '@pie-element/shared-math-rendering-katex';
	 * import { mathRendererProvider } from '@pie-element/shared-math-rendering-core';
	 *
	 * const renderer = createKatexRenderer();
	 * mathRendererProvider.setRenderer(renderer);
	 * ```
	 */
	setRenderer(renderer: MathRenderer): void {
		this.currentRenderer = renderer;
	}

	/**
	 * Get the current renderer
	 *
	 * @returns The active renderer, or null if none set
	 */
	getRenderer(): MathRenderer | null {
		return this.currentRenderer;
	}

	/**
	 * Check if a renderer has been initialized
	 *
	 * @returns true if a renderer is set
	 */
	isInitialized(): boolean {
		return this.currentRenderer !== null;
	}

	/**
	 * Get the current renderer or a default
	 *
	 * @param defaultRenderer - Renderer to return if none is set
	 * @returns The current renderer or the provided default
	 */
	getRendererOrDefault(defaultRenderer: MathRenderer): MathRenderer {
		return this.currentRenderer ?? defaultRenderer;
	}
}

/**
 * Global singleton instance
 *
 * Use this to set and get the active math renderer.
 *
 * @example
 * ```typescript
 * import { mathRendererProvider } from '@pie-element/shared-math-rendering-core';
 * import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';
 *
 * const renderer = createMathjaxRenderer();
 * mathRendererProvider.setRenderer(renderer);
 *
 * // Later...
 * const current = mathRendererProvider.getRenderer();
 * if (current) {
 *   await current(document.body);
 * }
 * ```
 */
export const mathRendererProvider = new MathRendererProvider();
