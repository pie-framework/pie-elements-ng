/**
 * Shared layout data loader for player routes
 * Loads element metadata and initial model/session
 */
import type { LayoutLoad } from './$types';
import { createMathjaxRenderer } from '@pie-element/shared-math-rendering-mathjax';

// SSR enabled for server-side validation - web components will hydrate on client

// Cache the math renderer to prevent re-creating it on every load
let cachedMathRenderer: any = null;

// Demo configuration interface
interface DemoConfig {
  id: string;
  title: string;
  description: string;
  tags: string[];
  model: any;
  session?: any;
}

export const load: LayoutLoad = async ({
  params,
  url,
}: {
  params: { element: string };
  url: URL;
}) => {
  const elementName = params.element || 'multiple-choice';
  const requestedDemoId = url.searchParams.get('demo') || 'default';

  // Format element name for display
  let elementTitle = elementName
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Load element registry to get metadata
  // Note: Element existence is validated server-side in +layout.server.ts
  let capabilities: string[] = [];
  let demos: DemoConfig[] = [];
  let activeDemoId = 'default';
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

      // Load sample config from JSON file (supports both new and old formats)
      try {
        const configModule = await import(`$lib/data/sample-configs/react/${elementName}.json`);

        // Check for new format (demos array)
        if (configModule.default?.demos && Array.isArray(configModule.default.demos)) {
          demos = configModule.default.demos;
          console.log(`[+layout.ts] Loaded ${demos.length} demos for ${elementName}`);

          // Find the requested demo or use the first one
          const demoIndex = demos.findIndex((d) => d.id === requestedDemoId);
          const activeDemo = demos[demoIndex >= 0 ? demoIndex : 0];

          if (activeDemo) {
            activeDemoId = activeDemo.id;
            initialModel = activeDemo.model || {};
            initialSession = activeDemo.session || { value: [] };
            console.log(`[+layout.ts] Active demo: ${activeDemoId}`);
          }
        }
        // Fall back to old format (models array) for backwards compatibility
        else if (configModule.default?.models?.[0]) {
          const oldModel = configModule.default.models[0];
          demos = [
            {
              id: 'default',
              title: 'Default Demo',
              description: 'Default configuration',
              tags: [],
              model: oldModel,
              session: { value: [] },
            },
          ];
          activeDemoId = 'default';
          initialModel = oldModel;
          console.log(`[+layout.ts] Loaded sample model (old format) for ${elementName}`);

          // Try to load old-format session file
          try {
            const sessionModule = await import(
              `$lib/data/sample-configs/react/${elementName}-session.json`
            );
            if (sessionModule.default) {
              initialSession = sessionModule.default;
              demos[0].session = sessionModule.default;
              console.log(`[+layout.ts] Loaded sample session for ${elementName}`);
            }
          } catch (e) {
            console.log(
              `[+layout.ts] No sample session found for ${elementName}, using empty session`
            );
          }
        }
      } catch (e) {
        console.log(`[+layout.ts] No sample config found for ${elementName}, using empty model`);
      }
    }
  } catch (e) {
    console.error('[+layout.ts] Error loading element registry:', e);
  }

  // Create math renderer only once and cache it
  if (!cachedMathRenderer) {
    cachedMathRenderer = createMathjaxRenderer();
  }

  return {
    elementName,
    elementTitle,
    capabilities,
    demos,
    activeDemoId,
    initialModel,
    initialSession,
    mathRenderer: cachedMathRenderer,
  };
};
