import { configureUnifiedPlayerResolver } from '@pie-element/element-player';

declare global {
  interface Window {
    __pieElementPlayerResolverConfigured?: boolean;
  }
}

type ElementImportRegistry = {
  getElementModule?: (name: string) => (() => Promise<unknown>) | undefined;
  getAuthorModule?: (name: string) => (() => Promise<unknown>) | undefined;
  getPrintModule?: (name: string) => (() => Promise<unknown>) | undefined;
  getControllerModule?: (name: string) => (() => Promise<unknown>) | undefined;
};

let registryPromise: Promise<ElementImportRegistry | null> | null = null;

function loadRegistry(): Promise<ElementImportRegistry | null> {
  if (!registryPromise) {
    registryPromise = import('$lib/element-imports')
      .then((module) => module as ElementImportRegistry)
      .catch(() => null);
  }
  return registryPromise;
}

if (typeof window !== 'undefined' && !window.__pieElementPlayerResolverConfigured) {
  configureUnifiedPlayerResolver(async ({ packagePath, elementName, kind, cdnUrl }) => {
    if (cdnUrl) {
      return null;
    }

    const registry = await loadRegistry();
    if (!registry) {
      return null;
    }

    const importer =
      kind === 'controller'
        ? registry.getControllerModule?.(elementName)
        : kind === 'author'
          ? registry.getAuthorModule?.(elementName)
          : kind === 'print'
            ? registry.getPrintModule?.(elementName)
            : registry.getElementModule?.(elementName);

    if (!importer) {
      return null;
    }

    try {
      return await importer();
    } catch {
      console.warn(`[element-player/demo] Failed registry import for ${packagePath}`);
      return null;
    }
  });
  window.__pieElementPlayerResolverConfigured = true;
}
