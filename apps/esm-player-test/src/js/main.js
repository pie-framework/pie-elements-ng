/**
 * Main Application
 *
 * Orchestrates the ESM player test application.
 */

import {
  checkLocalPlayerBuild,
  getAvailableVersions,
  loadPlayer,
  preloadElements,
} from './player-loader.js';
import { getElementTypesForItem, getItemById, SAMPLE_ITEMS } from './sample-items.js';
import { StorageManager, URLStateManager } from './url-state.js';

class ESMPlayerTestApp {
  constructor() {
    this.urlState = new URLStateManager();
    this.storage = new StorageManager();

    // Application state
    this.state = {
      player: { source: 'local', version: 'local' },
      elements: {
        // Default multiple-choice to React framework for testing
        'multiple-choice': { source: 'local', version: 'local', framework: 'react' },
      }, // Map of element type -> {source, version, framework}
      itemId: null,
      currentItem: null,
    };

    // UI elements
    this.ui = {
      playerSource: document.querySelectorAll('input[name="player-source"]'),
      playerVersion: document.getElementById('player-version'),
      elementVersions: document.getElementById('element-versions'),
      sampleItems: document.getElementById('sample-items'),
      loadBtn: document.getElementById('load-btn'),
      copyUrlBtn: document.getElementById('copy-url-btn'),
      status: document.getElementById('status'),
      playerMount: document.getElementById('player-mount'),
    };

    // Player instance
    this.player = null;
    this.hasLocalPlayerBuild = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    this.logStatus('Initializing ESM Player Test App...');

    // Check for local player build
    try {
      this.hasLocalPlayerBuild = await checkLocalPlayerBuild();
      if (this.hasLocalPlayerBuild) {
        this.logStatus('Local player build detected', 'success');
      } else {
        this.logStatus('Local player build not available. Will use npm only.', 'warning');
        // Disable local radio button for player
        const localRadio = Array.from(this.ui.playerSource).find((r) => r.value === 'local');
        if (localRadio) {
          localRadio.disabled = true;
          localRadio.parentElement.style.opacity = '0.5';
        }
      }
    } catch (_error) {
      this.logStatus('Could not check for local player build', 'warning');
    }

    // Load player versions from npm
    await this.loadPlayerVersions();

    // Initialize state from URL or localStorage
    this.initializeState();

    // Render UI
    this.renderSampleItems();
    this.renderElementVersions();

    // Setup event listeners
    this.setupEventListeners();

    this.logStatus('Ready to load player', 'success');
  }

  /**
   * Initialize state from URL or localStorage
   */
  initializeState() {
    // Priority: URL params > localStorage > defaults

    // Get URL state
    const urlPlayer = this.urlState.getPlayerConfig();
    const urlElements = this.urlState.getElementVersions();
    const urlItemId = this.urlState.getItemId();

    // Get saved state
    const saved = this.storage.load();

    // Merge state
    if (urlItemId || saved?.itemId) {
      this.state.itemId = urlItemId || saved.itemId;
      this.state.currentItem = getItemById(this.state.itemId);
    }

    // Player config from URL or saved
    if (urlPlayer && (urlPlayer.version !== 'local' || urlPlayer.source !== 'local')) {
      this.state.player = urlPlayer;
    } else if (saved?.player) {
      this.state.player = saved.player;
    }

    if (Object.keys(urlElements).length > 0) {
      this.state.elements = urlElements;
    } else if (saved?.elements) {
      this.state.elements = saved.elements;
    }

    // Update UI to reflect state
    this.updateUIFromState();
  }

  /**
   * Update UI inputs to reflect current state
   */
  updateUIFromState() {
    // Player source
    const playerSourceInput = Array.from(this.ui.playerSource).find(
      (input) => input.value === this.state.player.source
    );
    if (playerSourceInput) {
      playerSourceInput.checked = true;
    }

    // Player version
    if (this.ui.playerVersion?.querySelector(`option[value="${this.state.player.version}"]`)) {
      this.ui.playerVersion.value = this.state.player.version;
    }

    // Active item
    if (this.state.itemId) {
      const itemBtn = document.querySelector(`[data-item-id="${this.state.itemId}"]`);
      if (itemBtn) {
        itemBtn.classList.add('active');
      }
    }
  }

  /**
   * Load available player versions from npm
   */
  async loadPlayerVersions() {
    try {
      const versions = await getAvailableVersions('@pie-framework/pie-esm-player');

      if (!this.ui.playerVersion) return;

      // Clear and populate version select
      this.ui.playerVersion.innerHTML = '<option value="latest">latest</option>';

      for (const version of versions.slice(0, 10)) {
        // Show last 10 versions
        const option = document.createElement('option');
        option.value = version;
        option.textContent = version;
        this.ui.playerVersion.appendChild(option);
      }

      if (versions.length > 0) {
        this.logStatus(`Loaded ${versions.length} player versions from npm`);
      }
    } catch (error) {
      this.logStatus('Failed to load player versions from npm', 'error');
      console.error(error);
    }
  }

  /**
   * Render sample items list
   */
  renderSampleItems() {
    this.ui.sampleItems.innerHTML = '';

    for (const item of SAMPLE_ITEMS) {
      const button = document.createElement('button');
      button.className = 'item-button';
      button.dataset.itemId = item.id;
      button.textContent = item.title;
      button.title = item.description;

      if (this.state.itemId === item.id) {
        button.classList.add('active');
      }

      button.addEventListener('click', () => this.selectItem(item.id));

      this.ui.sampleItems.appendChild(button);
    }
  }

  /**
   * Render element version controls for current item
   */
  renderElementVersions() {
    this.ui.elementVersions.innerHTML = '';

    if (!this.state.currentItem) {
      this.ui.elementVersions.innerHTML =
        '<p style="color: #666; font-size: 0.85rem;">Select an item to configure element versions</p>';
      return;
    }

    const elementTypes = getElementTypesForItem(this.state.currentItem);

    if (elementTypes.length === 0) {
      this.ui.elementVersions.innerHTML =
        '<p style="color: #666; font-size: 0.85rem;">No elements in this item</p>';
      return;
    }

    for (const elementType of elementTypes) {
      const control = this.createElementVersionControl(elementType);
      this.ui.elementVersions.appendChild(control);
    }
  }

  /**
   * Create version control for an element type
   */
  createElementVersionControl(elementType) {
    const container = document.createElement('div');
    container.className = 'element-version-control';

    const title = document.createElement('h4');
    title.textContent = elementType;
    container.appendChild(title);

    const options = document.createElement('div');
    options.className = 'element-version-options';

    // NPM Latest option
    const npmLatest = this.createVersionOption(elementType, 'npm', 'latest', 'NPM Latest');
    options.appendChild(npmLatest);

    // Local build option
    const local = this.createVersionOption(elementType, 'local', 'local', 'Local Build');
    options.appendChild(local);

    container.appendChild(options);

    return container;
  }

  /**
   * Create a version option radio button
   */
  createVersionOption(elementType, source, version, label) {
    const wrapper = document.createElement('label');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '6px';
    wrapper.style.fontSize = '0.85rem';

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `element-${elementType}`;
    input.value = `${source}:${version}`;

    // Check if this is the current selection
    const current = this.state.elements[elementType];
    if (
      (current && current.source === source && current.version === version) ||
      (!current && source === 'npm' && version === 'latest')
    ) {
      input.checked = true;
    }

    input.addEventListener('change', () => {
      this.state.elements[elementType] = { source, version };
      this.saveState();
      // Auto-load when element version changes
      if (this.state.currentItem) {
        this.loadAndRenderPlayer();
      }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(document.createTextNode(label));

    return wrapper;
  }

  /**
   * Select an item
   */
  selectItem(itemId) {
    this.state.itemId = itemId;
    this.state.currentItem = getItemById(itemId);

    // Update UI
    document.querySelectorAll('.item-button').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.itemId === itemId);
    });

    // Re-render element versions for new item
    this.renderElementVersions();

    // Save state
    this.saveState();

    this.logStatus(`Selected item: ${this.state.currentItem?.title || 'Unknown'}`);

    // Auto-load player with new item
    this.loadAndRenderPlayer();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Player source change
    this.ui.playerSource.forEach((input) => {
      input.addEventListener('change', (e) => {
        this.state.player.source = e.target.value;
        if (e.target.value === 'local') {
          this.state.player.version = 'local';
        }
        this.saveState();
        // Auto-load when player source changes
        if (this.state.currentItem) {
          this.loadAndRenderPlayer();
        }
      });
    });

    // Player version change
    if (this.ui.playerVersion) {
      this.ui.playerVersion.addEventListener('change', (e) => {
        this.state.player.version = e.target.value;
        this.saveState();
        // Auto-load when player version changes
        if (this.state.currentItem) {
          this.loadAndRenderPlayer();
        }
      });
    }

    // Load button
    this.ui.loadBtn.addEventListener('click', () => this.loadAndRenderPlayer());

    // Copy URL button
    this.ui.copyUrlBtn.addEventListener('click', () => this.copyShareableURL());
  }

  /**
   * Load and render the player
   */
  async loadAndRenderPlayer() {
    if (!this.state.currentItem) {
      this.logStatus('Please select an item first', 'error');
      return;
    }

    this.ui.loadBtn.disabled = true;
    this.ui.playerMount.innerHTML = '<div class="loading">Loading player...</div>';

    try {
      // Preload elements FIRST - they need to register controllers in window.pie
      this.logStatus('Loading elements...');
      const { loaded, failed } = await preloadElements(this.state.currentItem, this.state.elements);

      // Log results
      if (Object.keys(loaded).length > 0) {
        this.logStatus(
          `Loaded ${Object.keys(loaded).length} element(s): ${Object.keys(loaded).join(', ')}`,
          'success'
        );
      }
      if (Object.keys(failed).length > 0) {
        this.logStatus(
          `Failed to load ${Object.keys(failed).length} element(s): ${Object.keys(failed).join(', ')}`,
          'warning'
        );
      }

      // Load player AFTER elements are registered
      this.logStatus('Loading player...');
      const _playerModule = await loadPlayer(this.state.player);
      this.logStatus(`Player loaded successfully (${this.state.player.source})`, 'success');

      // Build PIE config format for the player
      const config = this.buildPlayerConfig(this.state.currentItem);

      // Check if all elements are local (no version specifier means local)
      // Local: "@pie-element/multiple-choice" (no @version)
      // NPM: "@pie-element/multiple-choice@1.0.0" (has @version)
      const allElementsLocal = Object.values(config.elements).every((pkg) => {
        const parts = pkg.split('@');
        // If it's @scope/name format, it will have 3 parts when split by @
        // @scope/name@version would have 4 or more
        return parts.length <= 2 || (parts.length === 3 && !parts[2]); // No version = local
      });

      // Create and configure player web component
      this.logStatus('Rendering player...');
      this.ui.playerMount.innerHTML = '';

      // The direct-init path is dev-only (it relies on Vite /@fs/ and local sibling repos).
      // For production builds (including CI), always use the ESM player component.
      if (!allElementsLocal || this.state.player.source === 'npm' || !import.meta.env.DEV) {
        // Use ESM player for CDN loading
        const player = document.createElement('pie-esm-player');
        player.config = config;
        player.env = { mode: 'gather', role: 'student' };
        player.session = { id: 'test-session', data: this.state.currentItem.sessions || [] };

        // Listen for events
        player.addEventListener('session-changed', (e) => {
          console.log('Session changed:', e.detail);
        });

        player.addEventListener('load-complete', () => {
          this.logStatus('Item loaded and rendered successfully', 'success');
        });

        player.addEventListener('player-error', (e) => {
          this.logStatus(`Player error: ${e.detail.message}`, 'error');
        });

        this.ui.playerMount.appendChild(player);
      } else {
        // All elements are local - use direct initialization
        // Elements are already loaded and registered in window.pie.default

        // Render the markup directly
        this.ui.playerMount.innerHTML = config.markup;

        // Initialize PIE elements from window.pie.default
        const playersSharedUrl =
          '/@fs/Users/eelco.hillenius/dev/prj/pie/pie-players/packages/players-shared/dist/index.js';
        const { initializePiesFromLoadedBundle, updatePieElementWithRef } = await import(
          /* @vite-ignore */
          playersSharedUrl
        );

        const env = { mode: 'gather', role: 'student' };
        const sessions = this.state.currentItem.sessions || [];

        initializePiesFromLoadedBundle(config, sessions, {
          env,
          bundleType: 'esm', // Mark as ESM bundle
        });

        // After initialization, update each element to invoke controllers
        // This step is normally done by the ESM player, but we need to do it manually here
        config.models.forEach((model) => {
          const element = document.getElementById(model.id);
          if (element) {
            updatePieElementWithRef(element, {
              config,
              session: sessions,
              env,
              invokeControllerForModel: true,
            });
          }
        });

        this.logStatus('Item loaded and rendered successfully', 'success');
      }
    } catch (error) {
      this.logStatus(`Error: ${error.message}`, 'error');
      this.ui.playerMount.innerHTML = `
        <div class="error-message">
          <strong>Failed to load player</strong>
          <p>${error.message}</p>
        </div>
      `;
      console.error(error);
    } finally {
      this.ui.loadBtn.disabled = false;
    }
  }

  /**
   * Build PIE player config from item
   */
  buildPlayerConfig(item) {
    const elements = {};

    // Map element types to package specifiers
    // Include ALL elements in config - needed by initializePiesFromLoadedBundle
    for (const element of item.elements || []) {
      const elementType = element.element;
      const config = this.state.elements[elementType] || { source: 'npm', version: 'latest' };

      if (config.source === 'npm') {
        // NPM elements: add with version for ESM loader
        const version = config.version === 'latest' ? 'latest' : config.version;
        elements[`pie-${elementType}`] = `@pie-element/${elementType}@${version}`;
      } else {
        // Local elements: add with @pie-element package name so initializePiesFromLoadedBundle can find them in window.pie.default
        elements[`pie-${elementType}`] = `@pie-element/${elementType}`;
      }
    }

    return {
      elements,
      models: item.models || [],
      markup: this.buildMarkup(item.elements || []),
    };
  }

  /**
   * Build HTML markup for item elements
   */
  buildMarkup(elements) {
    return elements
      .map((element) => `<pie-${element.element} id="${element.id}"></pie-${element.element}>`)
      .join('\n');
  }

  /**
   * Copy shareable URL to clipboard
   */
  async copyShareableURL() {
    const url = this.urlState.getShareableURL(this.state);

    try {
      await navigator.clipboard.writeText(url);
      this.logStatus('URL copied to clipboard!', 'success');
    } catch (error) {
      this.logStatus('Failed to copy URL', 'error');
      console.error(error);
    }
  }

  /**
   * Save current state to localStorage and URL
   */
  saveState() {
    this.storage.save(this.state);
    this.urlState.updateURL(this.state);
  }

  /**
   * Log a status message
   */
  logStatus(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const entry = document.createElement('div');
    entry.className = `status-message ${type}`;
    entry.textContent = `[${timestamp}] ${message}`;

    this.ui.status.appendChild(entry);
    this.ui.status.scrollTop = this.ui.status.scrollHeight;

    // Keep only last 20 messages
    while (this.ui.status.children.length > 20) {
      this.ui.status.removeChild(this.ui.status.firstChild);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new ESMPlayerTestApp();
  app.init().catch((error) => {
    console.error('Failed to initialize app:', error);
    document.body.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h1 style="color: #d32f2f;">Failed to Initialize</h1>
        <p>${error.message}</p>
      </div>
    `;
  });
});
