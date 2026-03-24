/**
 * PIE Element Loader
 *
 * Dynamically loads PIE elements from CDN and registers them as custom elements.
 * Based on the ESM loader pattern from pie-players.
 */

export type ElementModuleKind = 'delivery' | 'author' | 'print' | 'controller';

export interface ElementModuleResolveRequest {
  packagePath: string;
  packageName: string;
  elementName: string;
  kind: ElementModuleKind;
  cdnUrl: string;
}

export type ElementModuleResolver = (
  request: ElementModuleResolveRequest
) => Promise<unknown | null | undefined> | unknown | null | undefined;

let moduleResolver: ElementModuleResolver | null = null;

export function configureElementModuleResolver(resolver?: ElementModuleResolver): void {
  moduleResolver = resolver ?? null;
}

async function resolveModule(
  request: ElementModuleResolveRequest,
  debug: boolean = false
): Promise<any> {
  if (!request.cdnUrl && moduleResolver) {
    const resolved = await moduleResolver(request);
    if (resolved != null) {
      if (debug) {
        console.log(
          `[element-loader] Resolved ${request.kind} module via injected resolver for ${request.packagePath}`
        );
      }
      return resolved;
    }
  }

  const modulePath = request.cdnUrl
    ? `${request.cdnUrl}/${request.packagePath}`
    : request.packagePath;
  if (request.cdnUrl) {
    return import(/* @vite-ignore */ modulePath);
  }
  // Let Vite resolve local workspace specifiers in ESM mode.
  return import(modulePath);
}

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

  if (debug)
    console.log(`[element-loader] Loading element ${packagePath} (cdnUrl: ${cdnUrl || 'local'})`);

  try {
    const elementName = packagePath
      .replace(/^@pie-element\//, '')
      .replace(/\/(author|print|controller)$/, '');
    const kind: ElementModuleKind = packagePath.endsWith('/author')
      ? 'author'
      : packagePath.endsWith('/print')
        ? 'print'
        : 'delivery';
    const module = await resolveModule(
      {
        packagePath,
        packageName: `@pie-element/${elementName}`,
        elementName,
        kind,
        cdnUrl: cdnUrl || '',
      },
      debug
    );

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

  if (debug)
    console.log(
      `[element-loader] Loading controller from ${controllerPath} (cdnUrl: ${cdnUrl || 'local'})`
    );

  try {
    const elementName = packageName.replace(/^@pie-element\//, '');
    const module = await resolveModule(
      {
        packagePath: controllerPath,
        packageName,
        elementName,
        kind: 'controller',
        cdnUrl: cdnUrl || '',
      },
      debug
    );

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
