import type { PageLoad } from './$types';

interface DemoDocsManifestView {
  id: string;
  file: string;
  pieSource: string;
  configSource: string;
  hasModelDefaults: boolean;
  hasConfigDefaults: boolean;
}

interface DemoDocsManifest {
  elementName: string;
  packageName: string;
  framework: string;
  generatedAt: string;
  summary: string;
  supportedModes: string[];
  views: DemoDocsManifestView[];
}

const normalizeViewFile = (file: string): string => file.replace(/[^a-zA-Z0-9._-]/g, '');

export const load: PageLoad = async ({ params, url, fetch }) => {
  const elementName = params.element;
  const basePath = `/element-docs/${encodeURIComponent(elementName)}`;
  const manifestPath = `${basePath}/manifest.json`;

  let manifest: DemoDocsManifest | null = null;
  try {
    const response = await fetch(manifestPath);
    if (response.ok) {
      manifest = (await response.json()) as DemoDocsManifest;
    }
  } catch {
    manifest = null;
  }

  if (!manifest) {
    return {
      docsAvailable: false as const,
      elementName,
      manifestPath,
    };
  }

  const fallbackView =
    manifest.views.find((view) => view.id === 'delivery') ||
    manifest.views.find((view) => view.id === 'author') ||
    manifest.views[0] ||
    null;
  const requestedViewId = url.searchParams.get('view');
  const activeView = manifest.views.find((view) => view.id === requestedViewId) || fallbackView;

  return {
    docsAvailable: true as const,
    elementName,
    manifest,
    activeViewId: activeView?.id || '',
    activeViewFile: activeView ? normalizeViewFile(activeView.file) : '',
    docsBasePath: basePath,
  };
};
