/**
 * Demo Element Loader
 *
 * Loads PIE elements for local development.
 * Uses static import registry (element-imports.ts) with absolute /@fs/ paths.
 *
 * Why use element-imports.ts instead of bare specifiers?
 * - Dynamic imports with variable paths don't benefit from Vite's alias resolution
 * - Absolute /@fs/ paths work correctly in dynamic imports
 * - This ensures we load DIST files (fully built) instead of source files
 */

import { getControllerModule } from '#lib/element-imports.js';

/**
 * Load a PIE controller
 */
export async function loadController(
  packageName: string,
  cdnUrl: string = '',
  debug: boolean = false
): Promise<any> {
  if (debug) console.log(`[demo-element-loader] Loading controller ${packageName}`);

  try {
    let module: any;

    // Extract element name from package name
    const elementName = packageName.replace(/^@pie-element\//, '');

    // Check if we have a static import for this controller
    const controllerImporter = getControllerModule(elementName);

    if (controllerImporter && (!cdnUrl || cdnUrl === '')) {
      // Use static import from element-imports.ts
      module = await controllerImporter();
    } else {
      // Fall back to dynamic import for CDN or missing static imports
      const controllerPath = `${packageName}/controller`;
      const modulePath = cdnUrl ? `${cdnUrl}/${controllerPath}` : controllerPath;
      module = await import(/* @vite-ignore */ modulePath);
    }

    const controller = module.default || module;

    if (!controller) {
      throw new Error(`No default export found for ${packageName}/controller`);
    }

    if (debug) console.log(`[demo-element-loader] ✓ Loaded controller for ${packageName}`);
    return controller;
  } catch (error) {
    console.error(`[demo-element-loader] Failed to load controller ${packageName}:`, error);
    throw error;
  }
}
