/**
 * Shared layout data loader for player routes
 * Loads element metadata and initial model/session
 */
import type { LayoutLoad } from './$types';
import { createKatexRenderer } from '@pie-element/math-rendering-katex';

export const ssr = false; // Client-side only rendering for web components

// Cache the math renderer to prevent re-creating it on every load
let cachedMathRenderer: any = null;

export const load: LayoutLoad = async () => {
  const elementName = import.meta.env.VITE_ELEMENT_NAME || 'multiple-choice';

  // Format element name for display
  let elementTitle = elementName
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Load element registry to get metadata
  let capabilities: string[] = [];
  let initialModel: any = {};
  let initialSession: any = { value: [] };

  try {
    const registry = await import('$lib/elements/registry');
    const elementInfo = registry.getElement(elementName);

    if (elementInfo) {
      elementTitle = elementInfo.title;

      // Convert registry metadata to capabilities array
      if (elementInfo.hasAuthor) {
        capabilities.push('author');
      }
      if (elementInfo.hasPrint) {
        capabilities.push('print');
      }

      // Try to load default model from element package
      try {
        const elementModule = await import(`@pie-element/${elementName}`);
        if (elementModule.defaultModel) {
          initialModel = elementModule.defaultModel;
        }
      } catch (e) {
        // Default model not available, use empty object
        console.log(`No default model for ${elementName}`);
      }
    }
  } catch (e) {
    console.error('[+layout.ts] Error loading element registry:', e);
  }

  // Create math renderer only once and cache it
  if (!cachedMathRenderer) {
    cachedMathRenderer = createKatexRenderer();
  }

  return {
    elementName,
    elementTitle,
    capabilities,
    initialModel,
    initialSession,
    mathRenderer: cachedMathRenderer
  };
};
