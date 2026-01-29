/**
 * Dynamic Element Demo - Data Loader
 *
 * Loads element specified by VITE_ELEMENT_NAME and VITE_ELEMENT_PATH environment variables
 * Set by CLI: bun run dev:demo <element-name>
 */
export const ssr = false; // Elements require browser APIs

export const load = async () => {
  // Get element info from environment variables (set by CLI)
  const elementName = import.meta.env.VITE_ELEMENT_NAME;
  const elementPath = import.meta.env.VITE_ELEMENT_PATH;
  const elementType = import.meta.env.VITE_ELEMENT_TYPE || 'react';
  const workspaceRoot = import.meta.env.VITE_WORKSPACE_ROOT;

  if (!elementName || !elementPath || !workspaceRoot) {
    throw new Error(
      'VITE_ELEMENT_NAME, VITE_ELEMENT_PATH, and VITE_WORKSPACE_ROOT not set. Use CLI: bun run dev:demo <element-name>'
    );
  }

  const normalizePath = (input: string) => input.replace(/\\/g, '/');
  const rootPath = normalizePath(workspaceRoot).replace(/\/$/, '');
  const elementPathNormalized = normalizePath(elementPath).replace(/^\.?\//, '');
  const fsImport = (relativePath: string) => {
    const cleanedRelative = normalizePath(relativePath).replace(/^\/+/, '');
    return `/@fs/${rootPath}/${elementPathNormalized}/${cleanedRelative}`;
  };
  const tryImport = async (relativeBase: string) => {
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.svelte'];
    let lastError: unknown;

    for (const ext of extensions) {
      try {
        return await import(/* @vite-ignore */ fsImport(`${relativeBase}${ext}`));
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  };

  // Dynamic imports using resolved filesystem paths

  try {
    // Load element components
    const [controllerModule, deliveryModule] = await Promise.all([
      tryImport('src/controller/index'),
      tryImport('src/delivery/index'),
    ]);

    // Try to load author (optional)
    let authorModule = null;
    try {
      authorModule = await tryImport('src/author/index');
    } catch (e) {
      console.log(`No author view for ${elementName}`);
    }

    // Try to load print (optional)
    let printModule = null;
    try {
      printModule = await tryImport('src/print/index');
    } catch (e) {
      console.log(`No print view for ${elementName}`);
    }

    // Try to load config
    let config = { id: '1', element: elementName };
    try {
      const configModule = await import(/* @vite-ignore */ fsImport('docs/demo/config.mjs'));
      config = Array.isArray(configModule.models) ? configModule.models[0] : configModule.default;
    } catch (e) {
      console.warn(`No config found for ${elementName}, using defaults`);
    }

    // Try to load session
    let session = { id: '1', element: elementName };
    try {
      const sessionModule = await import(/* @vite-ignore */ fsImport('docs/demo/session.mjs'));
      session = Array.isArray(sessionModule.default)
        ? sessionModule.default[0]
        : sessionModule.default;
    } catch (e) {
      console.warn(`No session found for ${elementName}, using defaults`);
    }

    // Read capabilities and metadata from package.json
    let capabilities = ['delivery', 'controller'];
    let pieMetadata = null;

    try {
      const pkgModule = await import(/* @vite-ignore */ fsImport('package.json'));
      pieMetadata = pkgModule.pie || pkgModule.default?.pie;

      if (pieMetadata?.capabilities) {
        // Use capabilities from pie metadata
        capabilities = pieMetadata.capabilities;
      } else {
        // Infer from loaded modules
        capabilities = [
          'delivery',
          'controller',
          ...(authorModule ? ['author'] : []),
          ...(printModule ? ['print'] : []),
        ];
      }
    } catch (e) {
      console.warn(`Could not read package.json for ${elementName}:`, e);
      // Infer from loaded modules
      capabilities = [
        'delivery',
        'controller',
        ...(authorModule ? ['author'] : []),
        ...(printModule ? ['print'] : []),
      ];
    }

    // Format title
    const title = elementName
      .split('-')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return {
      controller: controllerModule,
      DeliveryElement: deliveryModule.default,
      AuthorElement: authorModule?.default,
      PrintElement: printModule?.default,
      model: config,
      session,
      capabilities,
      elementName,
      elementTitle: title,
    };
  } catch (error) {
    console.error(`Failed to load element ${elementName}:`, error);
    throw new Error(
      `Failed to load element "${elementName}". Ensure it's built: cd packages/elements-${elementType}/${elementName} && bun run build`
    );
  }
};
