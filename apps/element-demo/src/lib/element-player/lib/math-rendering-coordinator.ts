/**
 * Math Rendering Coordinator
 *
 * Provides a generic solution for coordinating math rendering across all PIE elements
 * in all views (delivery, print, author). This ensures LaTeX formulas in prompts,
 * rationales, feedback, and other dynamic content are properly rendered.
 *
 * Pattern:
 * 1. Register global math renderer on window (like pie-player-components does)
 * 2. Provide hooks for parent components to call after element updates
 * 3. Use MutationObserver to catch dynamic content changes
 */

const MATH_RENDERING_KEY = '@pie-lib/math-rendering';

export interface MathRenderingApi {
  renderMath: (element: HTMLElement) => void;
}

/**
 * Register the math renderer globally so all elements can access it
 */
export function registerGlobalMathRenderer(renderer: MathRenderingApi) {
  if (typeof window !== 'undefined') {
    (window as any)[MATH_RENDERING_KEY] = renderer;
  }
}

/**
 * Get the global math renderer
 */
export function getGlobalMathRenderer(): MathRenderingApi | null {
  if (typeof window !== 'undefined') {
    return (window as any)[MATH_RENDERING_KEY] || null;
  }
  return null;
}

/**
 * Render math in a container element
 * This is the main function that parent components should call
 */
export function renderMathInContainer(container: HTMLElement) {
  const renderer = getGlobalMathRenderer();
  if (renderer && typeof renderer.renderMath === 'function') {
    // Use microtask to ensure DOM is fully updated
    queueMicrotask(() => {
      renderer.renderMath(container);
    });
  }
}

/**
 * Create a MutationObserver that automatically renders math when content changes
 * This catches cases like:
 * - Rationales being shown/hidden
 * - Feedback overlays appearing
 * - Dynamic content updates
 * - Print views rendering
 */
export function createMathRenderingObserver(
  container: HTMLElement,
  options: { debounceMs?: number } = {}
): MutationObserver {
  const { debounceMs = 100 } = options;
  let timeoutId: number | null = null;
  let renderCount = 0;

  const observer = new MutationObserver((mutations) => {
    // Only process mutations that actually add/remove elements with content
    const hasContentChange = mutations.some((mutation) => {
      // Check if nodes were added/removed
      if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
        return true;
      }
      return false;
    });

    if (!hasContentChange) {
      return; // Skip non-content mutations
    }

    // Debounce multiple rapid mutations
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      renderMathInContainer(container);
      renderCount++;
      timeoutId = null;
    }, debounceMs);
  });

  // Observe all changes to catch dynamic content
  observer.observe(container, {
    childList: true, // Watch for added/removed nodes
    subtree: true, // Watch entire subtree
    attributes: false, // Don't watch attribute changes (too noisy)
    characterData: false, // Don't watch text changes (too noisy)
  });

  return observer;
}

/**
 * Lifecycle hook for Svelte components
 * Call this after the element is mounted and whenever it updates
 *
 * Usage in Svelte:
 * ```
 * let container: HTMLElement;
 *
 * onMount(() => {
 *   const cleanup = useMathRendering(container);
 *   return cleanup;
 * });
 *
 * $effect(() => {
 *   if (model || session) {
 *     renderMathInContainer(container);
 *   }
 * });
 * ```
 */
export function useMathRendering(
  container: HTMLElement,
  options: {
    watchMutations?: boolean;
    debounceMs?: number;
  } = {}
): () => void {
  const { watchMutations = true, debounceMs = 100 } = options;

  // Initial render
  renderMathInContainer(container);

  // Setup observer if requested
  let observer: MutationObserver | null = null;
  if (watchMutations) {
    observer = createMathRenderingObserver(container, { debounceMs });
  }

  // Return cleanup function
  return () => {
    if (observer) {
      observer.disconnect();
    }
  };
}
