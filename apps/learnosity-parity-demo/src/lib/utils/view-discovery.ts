/**
 * View Discovery Utility
 *
 * Discovers available views (delivery variants, author, print) from element packages.
 * This enables dynamic tab generation based on what views an element actually exports.
 */

export interface ElementView {
  /** View identifier (e.g., 'delivery', 'author', 'delivery-mobile') */
  id: string;
  /** Display label for the tab */
  label: string;
  /** Subpath in package (e.g., '/author', '/print', '/delivery-mobile') */
  subpath: string;
  /** Whether this is a delivery variant (affects routing/player) */
  isDeliveryVariant: boolean;
  /** Optional description for tooltip */
  description?: string;
}

const packageJsonModules = import.meta.glob<{ exports?: Record<string, unknown> }>(
  '@workspace/packages/elements-{react,svelte}/*/package.json',
  { eager: false }
);
const packageJsonEntries = Object.entries(packageJsonModules);
const ELEMENT_FAMILIES = ['react', 'svelte'] as const;

export function isElementViewExport(exportKey: string): boolean {
  if (!exportKey.startsWith('./')) return false;
  const viewId = exportKey.replace('./', '');
  if (!viewId || viewId === 'delivery') return false;
  if (viewId === 'controller' || viewId === 'controller.js') return false;
  if (viewId === 'runtime-support') return false;
  if (viewId.startsWith('browser/')) return false;
  return viewId === 'author' || viewId === 'print' || viewId.startsWith('delivery-');
}

/**
 * Discover available views from an element's package.json exports
 *
 * @param elementName - Element name (e.g., 'multiple-choice')
 * @returns Array of available views
 */
export async function discoverElementViews(elementName: string): Promise<ElementView[]> {
  const views: ElementView[] = [];

  try {
    let loader: (() => Promise<{ exports?: Record<string, unknown> }>) | undefined;

    for (const family of ELEMENT_FAMILIES) {
      const candidatePath = `packages/elements-${family}/${elementName}/package.json`;
      const candidateLoader = packageJsonEntries.find(([modulePath]) =>
        modulePath.endsWith(candidatePath)
      )?.[1];

      if (candidateLoader) {
        loader = candidateLoader;
        break;
      }
    }

    if (!loader) {
      console.warn(`Could not find package.json for ${elementName}`);
      return views;
    }

    // Load the package.json
    const packageJson = await loader();
    const exports = packageJson.exports || {};

    // Parse exports to find view subpaths
    for (const [key] of Object.entries(exports)) {
      if (!isElementViewExport(key)) continue;

      // Parse the subpath
      const subpath = key.replace('./', '/');
      const viewId = key.replace('./', '');

      // Determine if this is a delivery variant (starts with 'delivery-')
      const isDeliveryVariant = viewId.startsWith('delivery-');

      // Generate label
      const label = formatViewLabel(viewId);

      // Add description based on view type
      const description = getViewDescription(viewId);

      views.push({
        id: viewId,
        label,
        subpath,
        isDeliveryVariant,
        description,
      });
    }
  } catch (error) {
    console.warn(`Could not discover views for ${elementName}:`, error);
  }

  // Sort views: delivery variants first, then others alphabetically
  return views.sort((a, b) => {
    if (a.isDeliveryVariant && !b.isDeliveryVariant) return -1;
    if (!a.isDeliveryVariant && b.isDeliveryVariant) return 1;
    return a.label.localeCompare(b.label);
  });
}

/**
 * Format view ID into display label
 *
 * @example
 * 'author' → 'Author'
 * 'delivery-mobile' → 'Delivery (Mobile)'
 * 'delivery-a11y' → 'Delivery (A11y)'
 */
function formatViewLabel(viewId: string): string {
  // Handle delivery variants
  if (viewId.startsWith('delivery-')) {
    const variant = viewId.replace('delivery-', '');
    const variantLabel = variant
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return `Delivery (${variantLabel})`;
  }

  // Handle standard views
  return viewId
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get description for a view (used in tooltips)
 */
function getViewDescription(viewId: string): string | undefined {
  const descriptions: Record<string, string> = {
    author: 'Configuration interface',
    print: 'Print-friendly view',
    'delivery-mobile': 'Touch-optimized for mobile devices',
    'delivery-a11y': 'Accessibility-optimized UI',
    'delivery-simple': 'Simplified UI for younger students',
    'delivery-branded': 'Custom branded interface',
  };

  return descriptions[viewId];
}

/**
 * Check if an element has a specific view
 *
 * @param elementName - Element name
 * @param viewId - View to check for (e.g., 'author', 'print')
 * @returns Whether the view exists
 */
export async function hasView(elementName: string, viewId: string): Promise<boolean> {
  const views = await discoverElementViews(elementName);
  return views.some((v) => v.id === viewId);
}
