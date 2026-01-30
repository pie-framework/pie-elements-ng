/**
 * PIE Element Loader
 *
 * Dynamically loads PIE elements from CDN and registers them as custom elements.
 * Based on the ESM loader pattern from pie-players.
 */

// Import helper for static workspace imports (only in development)
let staticImports: any = null;

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

  if (debug) console.log(`[element-loader] Loading element ${packagePath} (cdnUrl: ${cdnUrl || 'local'})`);

  try {
    let module: any;

    if (!cdnUrl || cdnUrl === '') {
      // Local development mode - use static imports
      // Lazy load the static imports module
      if (!staticImports) {
        try {
          // This dynamic import is OK because it's a constant string
          staticImports = await import('$lib/element-imports');
        } catch (e) {
          console.warn('[element-loader] Static imports module not found, trying direct import');
        }
      }

      if (staticImports && staticImports.hasElementModule(packagePath)) {
        module = await staticImports.getElementModule(packagePath);
      } else {
        // Fallback to dynamic import (will fail in Vite but kept for compatibility)
        module = await import(/* @vite-ignore */ packagePath);
      }
    } else {
      // External CDN mode with full URL
      const modulePath = `${cdnUrl}/${packagePath}`;
      module = await import(/* @vite-ignore */ modulePath);
    }

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
  const controllerPath = `${packageName}/controller`;

  if (debug) console.log(`[element-loader] Loading controller from ${controllerPath} (cdnUrl: ${cdnUrl || 'local'})`);

  try {
    let module: any;

    if (!cdnUrl || cdnUrl === '') {
      // Local development mode - use static imports
      // Lazy load the static imports module if not already loaded
      if (!staticImports) {
        try {
          staticImports = await import('$lib/element-imports');
        } catch (e) {
          console.warn('[element-loader] Static imports module not found, trying direct import');
        }
      }

      if (staticImports?.hasElementModule(controllerPath)) {
        module = await staticImports.getElementModule(controllerPath);
      } else {
        // Fallback to dynamic import (will fail in Vite but kept for compatibility)
        module = await import(/* @vite-ignore */ controllerPath);
      }
    } else {
      // External CDN mode with full URL
      const fullPath = `${cdnUrl}/${controllerPath}`;
      module = await import(/* @vite-ignore */ fullPath);
    }

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
