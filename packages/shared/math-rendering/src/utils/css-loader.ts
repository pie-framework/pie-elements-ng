/**
 * Dynamic CSS loading utility
 *
 * Loads CSS files on-demand and caches them to prevent duplicate loads
 */

interface CssLoadOptions {
  integrity?: string;
  crossOrigin?: string;
}

const loadedCss = new Set<string>();

/**
 * Load CSS file dynamically
 *
 * Only loads once per URL (cached).
 * Returns immediately if CSS is already loaded.
 *
 * @param url - CSS file URL
 * @param options - Optional integrity and crossOrigin attributes
 * @returns Promise that resolves when CSS is loaded
 *
 * @example
 * ```typescript
 * await loadCss('https://cdn.example.com/style.css', {
 *   integrity: 'sha384-...',
 *   crossOrigin: 'anonymous'
 * });
 * ```
 */
export async function loadCss(url: string, options: CssLoadOptions = {}): Promise<void> {
  if (loadedCss.has(url)) {
    return;
  }

  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    if (options.integrity) {
      link.integrity = options.integrity;
    }
    if (options.crossOrigin) {
      link.crossOrigin = options.crossOrigin;
    }

    link.onload = () => {
      loadedCss.add(url);
      resolve();
    };

    link.onerror = () => {
      reject(new Error(`Failed to load CSS: ${url}`));
    };

    document.head.appendChild(link);
  });
}

/**
 * Check if CSS is already loaded
 */
export function isCssLoaded(url: string): boolean {
  return loadedCss.has(url);
}
