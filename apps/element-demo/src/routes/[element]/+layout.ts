/**
 * Shared layout data loader for player routes
 * Loads element metadata and initial model/session
 */
import type { LayoutLoad } from './$types';
import { createKatexRenderer } from '@pie-element/shared-math-rendering-katex';

export const ssr = false; // Client-side only rendering for web components

// Cache the math renderer to prevent re-creating it on every load
let cachedMathRenderer: any = null;

export const load: LayoutLoad = async ({ params }: { params: { element: string } }) => {
  const elementName = params.element || 'multiple-choice';

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

      // Load sample config from JSON file (instead of dynamic import)
      try {
        const configModule = await import(`$lib/data/sample-configs/react/${elementName}.json`);
        if (configModule.default?.models?.[0]) {
          initialModel = configModule.default.models[0];
          console.log(`[+layout.ts] Loaded sample model for ${elementName}`);
        }
      } catch (e) {
        console.log(`[+layout.ts] No sample config found for ${elementName}, using empty model`);
      }

      // Try to load sample session from JSON file
      try {
        const sessionModule = await import(`$lib/data/sample-configs/react/${elementName}-session.json`);
        if (sessionModule.default) {
          initialSession = sessionModule.default;
          console.log(`[+layout.ts] Loaded sample session for ${elementName}`);
        }
      } catch (e) {
        console.log(`[+layout.ts] No sample session found for ${elementName}, using empty session`);
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
    mathRenderer: cachedMathRenderer,
  };
};
