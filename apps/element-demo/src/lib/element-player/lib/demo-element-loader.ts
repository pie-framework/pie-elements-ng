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

import {
  getElementModule,
  getControllerModule,
  getAuthorModule,
  getPrintModule,
  hasElementModule,
} from '$lib/element-imports';

/**
 * Load and register a PIE element
 */
export async function loadElement(
  packagePath: string,
  tagName: string,
  cdnUrl: string = '',
  debug: boolean = false,
  optional: boolean = false
): Promise<void> {
  // Check if already registered
  if (customElements.get(tagName)) {
    if (debug) console.log(`[demo-element-loader] Element ${tagName} already registered`);
    return;
  }

  if (debug) console.log(`[demo-element-loader] Loading element ${packagePath}`);

  try {
    let module: any;

    // Extract element name from package path
    const elementName = packagePath.replace(/^@pie-element\//, '');

    // Check if we have a static import for this element
    const hasStaticImport = hasElementModule(elementName);

    if (hasStaticImport && (!cdnUrl || cdnUrl === '')) {
      // Use static import from element-imports.ts
      const importer = getElementModule(elementName);
      if (!importer) {
        throw new Error(`No static import found for element ${elementName}`);
      }
      module = await importer();
    } else {
      // Fall back to dynamic import for CDN or missing static imports
      const modulePath = cdnUrl ? `${cdnUrl}/${packagePath}` : packagePath;
      module = await import(/* @vite-ignore */ modulePath);
    }

    const ElementClass = module.default || module.Element;

    if (!ElementClass) {
      throw new Error(`No default or Element export found for ${packagePath}`);
    }

    if (typeof ElementClass !== 'function') {
      throw new Error(`Export from ${packagePath} is not a constructor function`);
    }

    customElements.define(tagName, ElementClass);
    if (debug) console.log(`[demo-element-loader] ✓ Registered custom element: ${tagName}`);
  } catch (error) {
    if (!optional) {
      console.error(`[demo-element-loader] Failed to load element ${packagePath}:`, error);
      throw error;
    }
    if (debug) {
      console.log(`[demo-element-loader] Optional element ${packagePath} not available`);
    }
  }
}

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

/**
 * Load author view for an element
 */
export async function loadAuthor(
  packageName: string,
  cdnUrl: string = '',
  debug: boolean = false
): Promise<any> {
  if (debug) console.log(`[demo-element-loader] Loading author view ${packageName}`);

  try {
    let module: any;

    // Extract element name from package name
    const elementName = packageName.replace(/^@pie-element\//, '');

    // Check if we have a static import for this author view
    const authorImporter = getAuthorModule(elementName);

    if (authorImporter && (!cdnUrl || cdnUrl === '')) {
      // Use static import from element-imports.ts
      module = await authorImporter();
    } else {
      // Fall back to dynamic import for CDN or missing static imports
      const authorPath = `${packageName}/author`;
      const modulePath = cdnUrl ? `${cdnUrl}/${authorPath}` : authorPath;
      module = await import(/* @vite-ignore */ modulePath);
    }

    const AuthorComponent = module.default || module.Author || module;

    if (!AuthorComponent) {
      throw new Error(`No default export found for ${packageName}/author`);
    }

    if (debug) console.log(`[demo-element-loader] ✓ Loaded author view for ${packageName}`);
    return AuthorComponent;
  } catch (error) {
    console.error(`[demo-element-loader] Failed to load author view ${packageName}:`, error);
    throw error;
  }
}

/**
 * Load print view for an element
 */
export async function loadPrint(
  packageName: string,
  cdnUrl: string = '',
  debug: boolean = false
): Promise<any> {
  if (debug) console.log(`[demo-element-loader] Loading print view ${packageName}`);

  try {
    let module: any;

    // Extract element name from package name
    const elementName = packageName.replace(/^@pie-element\//, '');

    // Check if we have a static import for this print view
    const printImporter = getPrintModule(elementName);

    if (printImporter && (!cdnUrl || cdnUrl === '')) {
      // Use static import from element-imports.ts
      module = await printImporter();
    } else {
      // Fall back to dynamic import for CDN or missing static imports
      const printPath = `${packageName}/print`;
      const modulePath = cdnUrl ? `${cdnUrl}/${printPath}` : printPath;
      module = await import(/* @vite-ignore */ modulePath);
    }

    const PrintComponent = module.default || module.Print || module;

    if (!PrintComponent) {
      throw new Error(`No default export found for ${packageName}/print`);
    }

    if (debug) console.log(`[demo-element-loader] ✓ Loaded print view for ${packageName}`);
    return PrintComponent;
  } catch (error) {
    console.error(`[demo-element-loader] Failed to load print view ${packageName}:`, error);
    throw error;
  }
}
