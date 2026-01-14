/**
 * URL State Management
 *
 * Manages application state via URL parameters for shareable test scenarios.
 * Parameters:
 * - player: Player version (e.g., "latest", "1.2.3", "local")
 * - item: Sample item ID
 * - elements: JSON object mapping element types to versions
 */

export class URLStateManager {
  constructor() {
    this.params = new URLSearchParams(window.location.search);
  }

  /**
   * Get player configuration from URL
   * @returns {{source: 'npm'|'local', version: string}}
   */
  getPlayerConfig() {
    const player = this.params.get('player') || 'local';

    if (player === 'local') {
      return { source: 'local', version: 'local' };
    }

    return { source: 'npm', version: player };
  }

  /**
   * Get element version overrides from URL
   * @returns {Object.<string, {source: 'npm'|'local', version: string}>}
   */
  getElementVersions() {
    const elements = this.params.get('elements');

    if (!elements) {
      return {};
    }

    try {
      const parsed = JSON.parse(elements);
      const result = {};

      for (const [elementType, version] of Object.entries(parsed)) {
        if (version === 'local') {
          result[elementType] = { source: 'local', version: 'local' };
        } else {
          result[elementType] = { source: 'npm', version };
        }
      }

      return result;
    } catch (e) {
      console.error('Failed to parse elements parameter:', e);
      return {};
    }
  }

  /**
   * Get selected item ID from URL
   * @returns {string|null}
   */
  getItemId() {
    return this.params.get('item');
  }

  /**
   * Update URL with current state
   * @param {Object} state - Current application state
   */
  updateURL(state) {
    const params = new URLSearchParams();

    // Player version
    if (state.player) {
      const version = state.player.source === 'local' ? 'local' : state.player.version;
      params.set('player', version);
    }

    // Element versions (only include non-default versions)
    const elementVersions = {};
    if (state.elements) {
      for (const [elementType, config] of Object.entries(state.elements)) {
        if (config.source === 'local') {
          elementVersions[elementType] = 'local';
        } else if (config.version !== 'latest') {
          elementVersions[elementType] = config.version;
        }
      }
    }

    if (Object.keys(elementVersions).length > 0) {
      params.set('elements', JSON.stringify(elementVersions));
    }

    // Item ID
    if (state.itemId) {
      params.set('item', state.itemId);
    }

    // Update URL without page reload
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newURL);
  }

  /**
   * Get shareable URL for current state
   * @param {Object} state - Current application state
   * @returns {string}
   */
  getShareableURL(state) {
    const params = new URLSearchParams();

    if (state.player) {
      const version = state.player.source === 'local' ? 'local' : state.player.version;
      params.set('player', version);
    }

    if (state.elements) {
      const elementVersions = {};
      for (const [elementType, config] of Object.entries(state.elements)) {
        elementVersions[elementType] = config.source === 'local' ? 'local' : config.version;
      }
      if (Object.keys(elementVersions).length > 0) {
        params.set('elements', JSON.stringify(elementVersions));
      }
    }

    if (state.itemId) {
      params.set('item', state.itemId);
    }

    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }
}

/**
 * LocalStorage persistence for user preferences
 */
export class StorageManager {
  constructor(key = 'esm-player-test-state') {
    this.key = key;
  }

  /**
   * Save state to localStorage
   * @param {Object} state
   */
  save(state) {
    try {
      localStorage.setItem(this.key, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  /**
   * Load state from localStorage
   * @returns {Object|null}
   */
  load() {
    try {
      const saved = localStorage.getItem(this.key);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
      return null;
    }
  }

  /**
   * Clear saved state
   */
  clear() {
    try {
      localStorage.removeItem(this.key);
    } catch (e) {
      console.error('Failed to clear state from localStorage:', e);
    }
  }
}
