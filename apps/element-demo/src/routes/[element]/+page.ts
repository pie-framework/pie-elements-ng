/**
 * Element Landing Page Data Loader
 * Loads element metadata for the landing page
 */
import type { PageLoad } from './$types';

interface DemoConfig {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

export const load: PageLoad = async ({ params }) => {
  const elementName = params.element || 'multiple-choice';

  // Format element name for display
  let elementTitle = elementName
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Load element registry to get metadata
  let capabilities: string[] = [];
  let demos: DemoConfig[] = [];
  let demoCount = 0;

  try {
    const registry = await import('$lib/elements/registry');
    const elementInfo = registry.getElement(elementName);

    if (elementInfo) {
      elementTitle = elementInfo.title;
      demoCount = elementInfo.demoCount || 0;

      // Convert registry metadata to capabilities array
      if (elementInfo.hasAuthor) {
        capabilities.push('author');
      }
      if (elementInfo.hasPrint) {
        capabilities.push('print');
      }

      // Load demos if available
      if (demoCount > 0) {
        try {
          const configModule = await import(`$lib/data/sample-configs/react/${elementName}.json`);
          if (configModule.default?.demos && Array.isArray(configModule.default.demos)) {
            demos = configModule.default.demos.map((demo: any) => ({
              id: demo.id,
              title: demo.title,
              description: demo.description,
              tags: demo.tags || [],
            }));
          }
        } catch (e) {
          console.log(`[+page.ts] Could not load demos for ${elementName}`);
        }
      }
    }
  } catch (e) {
    console.error('[+page.ts] Error loading element registry:', e);
  }

  return {
    elementName,
    elementTitle,
    capabilities,
    demos,
    demoCount,
  };
};
