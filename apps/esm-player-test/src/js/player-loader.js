/**
 * Player Loader
 *
 * Dynamically loads PIE player and element packages as ESM modules.
 * Supports loading from:
 * - Published npm packages via jsDelivr CDN
 * - Local builds from the monorepo (player from pie-players, elements from pie-elements-ng)
 */

const JSDELIVR_BASE = 'https://cdn.jsdelivr.net/npm';

/**
 * Load the PIE player
 * @param {Object} config - Player configuration
 * @param {string} config.source - 'npm' or 'local'
 * @param {string} config.version - Version string or 'local'
 * @returns {Promise<Object>} Player module
 */
export async function loadPlayer(config) {
  let url;

  if (config.source === 'local') {
    // Load from local pie-players workspace
    // Use Vite's /@fs/ prefix to access files outside project root
    url =
      '/@fs/Users/eelco.hillenius/dev/prj/pie/pie-players/packages/pie-esm-player/dist/pie-esm-player.js';
  } else {
    // Load from npm via jsDelivr CDN
    const version = config.version === 'latest' ? '' : `@${config.version}`;
    url = `${JSDELIVR_BASE}/@pie-framework/pie-esm-player${version}/dist/pie-esm-player.js`;
  }

  console.log(`Loading player from: ${url}`);

  try {
    const module = await import(/* @vite-ignore */ url);
    return module;
  } catch (error) {
    console.error('Failed to load player:', error);
    throw new Error(`Failed to load player from ${url}: ${error.message}`);
  }
}

/**
 * Load a PIE element package
 * @param {string} elementType - Element type (e.g., 'multiple-choice')
 * @param {Object} config - Element configuration
 * @param {string} config.source - 'npm' or 'local'
 * @param {string} config.version - Version string or 'local'
 * @param {string} config.framework - 'svelte' or 'react' (default: 'svelte' for local)
 * @returns {Promise<Object>} Element module
 */
export async function loadElement(elementType, config) {
  let url;

  if (config.source === 'local') {
    // Load from local monorepo build
    // Elements are in the same monorepo but Vite root is at app level, so we need to go up
    // Use /@fs/ to access the absolute path
    const framework = config.framework || 'svelte';

    if (framework === 'react') {
      url = `/@fs/Users/eelco.hillenius/dev/prj/pie/pie-elements-ng/packages/elements-react/${elementType}/dist/index.js`;
    } else {
      url = `/@fs/Users/eelco.hillenius/dev/prj/pie/pie-elements-ng/packages/elements-svelte/${elementType}/dist/element.js`;
    }
  } else {
    // Load from npm via jsDelivr CDN
    const version = config.version === 'latest' ? '' : `@${config.version}`;
    const packageName =
      config.framework === 'react'
        ? `@pie-element/${elementType}`
        : `@pie-elements-ng/${elementType}`;
    url = `${JSDELIVR_BASE}/${packageName}${version}/dist/${config.framework === 'react' ? 'index' : 'element'}.js`;
  }

  console.log(`Loading element ${elementType} from: ${url}`);

  try {
    const module = await import(/* @vite-ignore */ url);
    return module;
  } catch (error) {
    console.error(`Failed to load element ${elementType}:`, error);
    throw new Error(`Failed to load element ${elementType} from ${url}: ${error.message}`);
  }
}

/**
 * Get available versions for a package from npm registry
 * @param {string} packageName - Full npm package name
 * @returns {Promise<string[]>} Array of version strings
 */
export async function getAvailableVersions(packageName) {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const versions = Object.keys(data.versions || {});

    // Sort versions in descending order (newest first)
    return versions.sort((a, b) => {
      // Simple semver-ish sort
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < 3; i++) {
        if (aParts[i] > bParts[i]) return -1;
        if (aParts[i] < bParts[i]) return 1;
      }

      return 0;
    });
  } catch (error) {
    console.error(`Failed to fetch versions for ${packageName}:`, error);
    return [];
  }
}

/**
 * Preload element modules for an item
 * @param {Object} item - Item configuration with elements array
 * @param {Object} elementConfigs - Map of element types to version configs
 * @returns {Promise<Object>} Map of element types to loaded modules and errors
 */
export async function preloadElements(item, elementConfigs) {
  const elementTypes = new Set();

  // Extract unique element types from item
  if (item.elements && Array.isArray(item.elements)) {
    for (const element of item.elements) {
      if (element.element) {
        elementTypes.add(element.element);
      }
    }
  }

  // Load all elements in parallel, catching errors individually
  const loadPromises = Array.from(elementTypes).map(async (elementType) => {
    const config = elementConfigs[elementType] || { source: 'npm', version: 'latest' };
    try {
      const module = await loadElement(elementType, config);
      return { elementType, module, success: true };
    } catch (error) {
      console.warn(`Skipping element ${elementType}:`, error.message);
      return { elementType, error: error.message, success: false };
    }
  });

  const results = await Promise.all(loadPromises);

  // Separate successful loads from failures
  const loaded = {};
  const failed = {};

  for (const result of results) {
    if (result.success) {
      loaded[result.elementType] = result.module;
    } else {
      failed[result.elementType] = result.error;
    }
  }

  return { loaded, failed };
}

/**
 * Check if local player build is available
 * @returns {Promise<boolean>}
 */
export async function checkLocalPlayerBuild() {
  try {
    // Try to fetch the local player file using Vite's /@fs/ prefix
    const response = await fetch(
      '/@fs/Users/eelco.hillenius/dev/prj/pie/pie-players/packages/pie-esm-player/dist/pie-esm-player.js',
      { method: 'HEAD' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Check if local element builds are available
 * @param {string} elementType - Element type to check
 * @returns {Promise<boolean>}
 */
export async function checkLocalElementBuild(elementType) {
  try {
    const response = await fetch(`@local-elements/${elementType}/dist/index.js`, {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}
