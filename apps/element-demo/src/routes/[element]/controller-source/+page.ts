import type { PageLoad } from './$types';

const controllerSourceModules = import.meta.glob<string>(
  '@workspace/packages/elements-{react,svelte}/*/src/controller/index.{ts,tsx,js,jsx}',
  { query: '?raw', import: 'default' }
);

const CONTROLLER_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx'] as const;
const ELEMENT_FAMILIES = ['react', 'svelte'] as const;
const controllerSourceEntries = Object.entries(controllerSourceModules);

export const load: PageLoad = async ({ params, parent }) => {
  const layoutData = await parent();
  const elementName = params.element;
  const packageName = layoutData.packageName || `@pie-element/${elementName}`;

  for (const family of ELEMENT_FAMILIES) {
    for (const extension of CONTROLLER_EXTENSIONS) {
      const sourcePath = `packages/elements-${family}/${elementName}/src/controller/index.${extension}`;
      const loader = controllerSourceEntries.find(([modulePath]) =>
        modulePath.endsWith(sourcePath)
      )?.[1];
      if (!loader) continue;

      return {
        controllerSourceAvailable: true as const,
        elementName,
        packageName,
        sourcePath,
        source: await loader(),
        esmSpecifier: `${packageName}/controller`,
        compatibilitySpecifier: `${packageName}/controller.js`,
      };
    }
  }

  return {
    controllerSourceAvailable: false as const,
    elementName,
    packageName,
  };
};
