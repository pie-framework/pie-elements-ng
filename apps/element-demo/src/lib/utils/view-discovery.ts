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

// Use Vite's import.meta.glob to statically analyze package.json files at build time
// IMPORTANT: The path MUST be a literal string (Vite requirement for static analysis)
// If this file moves or the workspace structure changes, update this path:
//   Current file: apps/element-demo/src/lib/utils/view-discovery.ts
//   Target: <workspace-root>/packages/elements-{react,svelte}/*/package.json
//   Levels up: ../../../../../ (from utils/ -> lib/ -> src/ -> element-demo/ -> apps/ -> root/)
const packageJsonModules = import.meta.glob<{ exports?: Record<string, unknown> }>(
  '../../../../../packages/elements-{react,svelte}/*/package.json',
  { eager: false }
);

/**
 * Discover available views from an element's package.json exports
 *
 * @param elementName - Element name (e.g., 'multiple-choice')
 * @returns Array of available views
 */
export async function discoverElementViews(elementName: string): Promise<ElementView[]> {
  const views: ElementView[] = [];

  try {
    // Find the matching package.json using the glob result
    // The glob pattern matches both React and Svelte elements, so we need to check both paths
    const reactPath = `../../../../../packages/elements-react/${elementName}/package.json`;
    const sveltePath = `../../../../../packages/elements-svelte/${elementName}/package.json`;

    let packagePath = reactPath;
    let loader = packageJsonModules[reactPath];

    if (!loader) {
      packagePath = sveltePath;
      loader = packageJsonModules[sveltePath];
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
      // Skip root export (that's delivery, handled separately)
      if (key === '.') continue;

      // Skip controller export
      if (key === './controller') continue;

      // Skip plain delivery export (same as root, handled separately)
      if (key === './delivery') continue;

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
