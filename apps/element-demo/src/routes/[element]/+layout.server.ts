/**
 * Server-side layout loader for element routes
 * Validates element exists before attempting to load
 */
import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { ELEMENT_REGISTRY } from '$lib/elements/registry';

export const load: LayoutServerLoad = async ({ params }) => {
  const elementName = params.element || 'multiple-choice';

  // Validate element exists in registry
  const elementInfo = ELEMENT_REGISTRY.find((el) => el.name === elementName);

  if (!elementInfo) {
    const availableElements = ELEMENT_REGISTRY.map((el) => el.name);

    // Find similar elements (fuzzy match)
    const similarElements = availableElements.filter(
      (name) => name.includes(elementName.slice(0, 3)) || elementName.includes(name.slice(0, 3))
    );

    // Build helpful error message
    const suggestions =
      similarElements.length > 0
        ? `Did you mean one of these?\n${similarElements.map((name) => `  - /${name}/deliver`).join('\n')}`
        : 'No similar elements found.';

    const errorMessage = [
      `Element "${elementName}" not found in registry.`,
      '',
      `Available elements: ${availableElements.join(', ')}`,
      '',
      suggestions,
    ].join('\n');

    // Use SvelteKit's error helper for proper error handling
    throw error(404, errorMessage);
  }

  // Element is valid, return minimal data
  // The client-side +layout.ts will handle loading the actual element data
  return {
    elementExists: true,
  };
};
