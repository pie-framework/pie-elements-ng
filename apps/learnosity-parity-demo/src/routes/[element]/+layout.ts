/**
 * Shared layout data loader for player routes
 * Loads element metadata and initial model/session
 * Discovers available views dynamically from package.json exports
 */
import type { LayoutLoad } from './$types';
import { error } from '@sveltejs/kit';
import { ELEMENT_REGISTRY, getElement } from '$lib/elements/registry';
import { discoverElementViews, type ElementView } from '$lib/utils/view-discovery';

// Player routes are client-rendered only; CE bundles reference browser-only globals (customElements/window).
export const ssr = false;

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
  parent,
}: {
  params: { element: string };
  url: URL;
  parent: () => Promise<Record<string, any>>;
}) => {
  const parentData = await parent();
  const elementName = params.element || 'multiple-choice';
  const requestedDemoId = url.searchParams.get('demo') || 'default';

  const elementInfo = getElement(elementName);
  if (!elementInfo) {
    const availableElements = ELEMENT_REGISTRY.map((el) => el.name);
    const similarElements = availableElements.filter(
      (name) => name.includes(elementName.slice(0, 3)) || elementName.includes(name.slice(0, 3))
    );
    const suggestions =
      similarElements.length > 0
        ? `Did you mean one of these?\n${similarElements.map((name) => `  - /${name}/deliver`).join('\n')}`
        : 'No similar elements found.';

    throw error(
      404,
      [
        `Element "${elementName}" not found in registry.`,
        '',
        `Available elements: ${availableElements.join(', ')}`,
        '',
        suggestions,
      ].join('\n')
    );
  }

  // Format element name for display
  let elementTitle = elementName
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Load element registry to get metadata
  let capabilities: string[] = [];
  let availableViews: ElementView[] = [];
  let demos: DemoConfig[] = [];
  let activeDemoId = 'default';
  let initialModel: any = {};
  let initialSession: any = {};
  let packageName = elementInfo.packageName;

  // Discover available views from package.json exports
  try {
    availableViews = await discoverElementViews(elementName);
  } catch (e) {
    console.warn(`[+layout.ts] Could not discover views for ${elementName}:`, e);
  }

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
    const configModule = await import(`$lib/samples/${elementName}.json`);

    if (configModule.default?.demos && Array.isArray(configModule.default.demos)) {
      demos = configModule.default.demos;
      console.log(`[+layout.ts] Loaded ${demos.length} demos for ${elementName}`);

      // Find the requested demo or use the first one
      const demoIndex = demos.findIndex((d) => d.id === requestedDemoId);
      const activeDemo = demos[demoIndex >= 0 ? demoIndex : 0];

      if (activeDemo) {
        activeDemoId = activeDemo.id;
        initialModel = activeDemo.model || {};
        initialSession = activeDemo.session || {};
        console.log(`[+layout.ts] Active demo: ${activeDemoId}`);
      }
    }
  } catch (e) {
    console.log(`[+layout.ts] No sample config found for ${elementName}, using empty model`);
  }

  return {
    ...parentData,
    elementVersion: 'latest',
    elementName,
    elementTitle,
    packageName,
    capabilities,
    availableViews,
    demos,
    activeDemoId,
    initialModel,
    initialSession,
  };
};
