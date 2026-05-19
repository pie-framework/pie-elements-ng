/**
 * PIE Element Loader
 *
 * Dynamically loads PIE elements from CDN and registers them as custom elements.
 * Based on the ESM loader pattern from pie-players.
 */

/**
 * Load and register a PIE element as a custom element
 *
 * @param packagePath - Package path (e.g., '@pie-element/hotspot' or '@pie-element/hotspot/configure')
 * @param tagName - Custom element tag name (e.g., 'hotspot-element')
 * @param cdnUrl - Base CDN URL (e.g., 'http://localhost:5179' or 'https://esm.sh')
 * @param debug - Enable debug logging
 * @param optional - If true, suppress error logging (for optional components like configure)
 */
export async function loadElement(
  packagePath: string,
  tagName: string,
  cdnUrl: string,
  debug: boolean = false,
  optional: boolean = false
): Promise<void> {
  // Check if already registered
  if (customElements.get(tagName)) {
    if (debug) console.log(`[element-loader] Element ${tagName} already registered`);
    return;
  }

  // Build module path
  // If cdnUrl is empty, use bare specifier (resolved by import maps or Vite aliases)
  let modulePath: string;
  if (!cdnUrl || cdnUrl === '') {
    // Use bare specifier - let import maps or Vite aliases resolve it
    modulePath = packagePath;
  } else {
    // External CDN mode with full URL
    modulePath = `${cdnUrl}/${packagePath}`;
  }

  if (debug) console.log(`[element-loader] Loading element from ${modulePath}`);

  try {
    // Dynamic import from CDN or local Vite alias
    const module = cdnUrl ? await import(/* @vite-ignore */ modulePath) : await import(modulePath);

    // Get element class (try default export first, then Element export)
    const ElementClass = module.default || module.Element;

    if (!ElementClass) {
      throw new Error(`No default or Element export found for ${packagePath}`);
    }

    // Verify it's a valid custom element constructor
    if (typeof ElementClass !== 'function') {
      throw new Error(`Export from ${packagePath} is not a constructor function`);
    }

    // Register as custom element
    customElements.define(tagName, ElementClass);

    if (debug) console.log(`[element-loader] ✓ Registered custom element: ${tagName}`);
  } catch (error) {
    const err = error as Error;
    // Only log errors for non-optional elements
    if (!optional) {
      console.error(`[element-loader] Failed to load element ${packagePath}:`, err);
      throw new Error(`Failed to load element ${packagePath}: ${err.message}`);
    }
    if (debug) {
      console.log(`[element-loader] Optional element ${packagePath} not available`);
    }
  }
}

/**
 * Load a PIE controller module
 *
 * @param packageName - Package name (e.g., '@pie-element/hotspot')
 * @param cdnUrl - Base CDN URL
 * @param debug - Enable debug logging
 * @returns Controller object with model/score/outcome methods
 */
export async function loadController(
  packageName: string,
  cdnUrl: string,
  debug: boolean = false
): Promise<any> {
  // Build controller path
  // If cdnUrl is empty, use bare specifier (resolved by import maps or Vite aliases)
  let controllerPath: string;
  if (!cdnUrl || cdnUrl === '') {
    // Use bare specifier - let import maps or Vite aliases resolve it
    controllerPath = `${packageName}/controller`;
  } else {
    // External CDN mode with full URL
    controllerPath = `${cdnUrl}/${packageName}/controller`;
  }

  if (debug) console.log(`[element-loader] Loading controller from ${controllerPath}`);

  try {
    // Dynamic import from CDN or local Vite alias
    const module = cdnUrl
      ? await import(/* @vite-ignore */ controllerPath)
      : await import(controllerPath);

    const controller = module.default || module;

    if (!controller) {
      throw new Error(`No default export found for ${packageName}/controller`);
    }

    if (debug) console.log(`[element-loader] ✓ Loaded controller for ${packageName}`);

    return controller;
  } catch (error) {
    const err = error as Error;
    console.error(`[element-loader] Failed to load controller ${packageName}:`, err);
    throw new Error(`Failed to load controller ${packageName}: ${err.message}`);
  }
}
