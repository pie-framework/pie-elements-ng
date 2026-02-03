/**
 * Shared layout data loader for player routes
 * Loads element metadata and initial model/session
 * Discovers available views dynamically from package.json exports
 */
import type { LayoutLoad } from './$types';
import { discoverElementViews, type ElementView } from '$lib/utils/view-discovery';

// SSR enabled for server-side validation - web components will hydrate on client

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
  let availableViews: ElementView[] = [];
  let demos: DemoConfig[] = [];
  let activeDemoId = 'default';
  let initialModel: any = {};
  let initialSession: any = { value: [] };

  // Discover available views from package.json exports
  try {
    availableViews = await discoverElementViews(elementName);
  } catch (e) {
    console.warn(`[+layout.ts] Could not discover views for ${elementName}:`, e);
  }

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

      // Load sample config from JSON file
      try {
        const configModule = await import(`$lib/data/sample-configs/react/${elementName}.json`);

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
      } catch (e) {
        console.log(`[+layout.ts] No sample config found for ${elementName}, using empty model`);
      }
    }
  } catch (e) {
    console.error('[+layout.ts] Error loading element registry:', e);
  }

  return {
    elementName,
    elementTitle,
    capabilities,
    availableViews,
    demos,
    activeDemoId,
    initialModel,
    initialSession,
  };
};
