import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { Mode } from '../pie-demo-player.js';

export interface ElementDefinition {
  Element: any;
  Configure?: any;
  controller?: any;
}

/**
 * Element renderer for single PIE element demos.
 *
 * IMPORTANT: This is designed for SINGLE ELEMENT demos, not multi-element items.
 * Unlike pie-players (which renders items with multiple elements, passages, rubrics),
 * this component focuses on rendering and testing ONE PIE element at a time.
 *
 * Follows pie-players patterns for:
 * - Element registration as custom elements
 * - Model/session property initialization
 * - Session-changed event handling
 * - Mode-specific rendering (gather/view/evaluate/configure)
 * - Controller integration (if available)
 *
 * Usage:
 *   <element-renderer
 *     .element=${elementDefinition}
 *     .model=${pieModel}
 *     .session=${sessionData}
 *     .mode=${'gather'}
 *   ></element-renderer>
 */
@customElement('element-renderer')
export class ElementRenderer extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
    }

    .element-container {
      width: 100%;
    }

    .error {
      padding: 1rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.375rem;
      color: #991b1b;
    }

    .loading {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }
  `;

  @property({ type: Object })
  element?: ElementDefinition;

  @property({ type: Object })
  model: any = {};

  @property({ type: Object })
  session: any = {};

  @property({ type: String })
  mode: Mode = 'gather';

  @state()
  private elementTag: string = '';

  @state()
  private initialized: boolean = false;

  @state()
  private error: string = '';

  @state()
  private loading: boolean = false;

  private elementInstance?: HTMLElement;
  private mutationObserver?: MutationObserver;

  override connectedCallback() {
    super.connectedCallback();
    this.initializeElement();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  override updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('element')) {
      this.initializeElement();
    } else if (
      this.initialized &&
      (changedProperties.has('model') ||
        changedProperties.has('session') ||
        changedProperties.has('mode'))
    ) {
      this.updateElement();
    }
  }

  private async initializeElement() {
    if (!this.element) {
      this.initialized = false;
      this.error = '';
      return;
    }

    try {
      this.loading = true;
      this.error = '';

      // Generate tag name from model.element or use default
      const baseTag = this.model?.element || 'pie-element';
      this.elementTag = this.mode === 'configure' ? `${baseTag}-config` : baseTag;
      console.log('[element-renderer] initializeElement:', {
        baseTag,
        elementTag: this.elementTag,
        mode: this.mode,
        hasElement: !!this.element,
        hasElementClass: !!this.element?.Element,
        hasConfigureClass: !!this.element?.Configure,
      });

      // Register element as custom element
      await this.registerElement();

      // Wait for next update cycle, then initialize
      await this.updateComplete;
      this.updateElement();

      this.initialized = true;
      this.loading = false;

      // Set up mutation observer for dynamic elements
      this.setupMutationObserver();
    } catch (err) {
      console.error('[element-renderer] initializeElement error:', err);
      this.error = err instanceof Error ? err.message : String(err);
      this.loading = false;
      this.initialized = false;
    }
  }

  private async registerElement() {
    if (!this.element) return;

    const ElementClass =
      this.mode === 'configure' && this.element.Configure
        ? this.element.Configure
        : this.element.Element;

    console.log('[element-renderer] registerElement:', {
      elementTag: this.elementTag,
      mode: this.mode,
      ElementClass,
      alreadyDefined: !!customElements.get(this.elementTag),
    });

    if (!ElementClass) {
      throw new Error(`Element class not found for mode: ${this.mode}`);
    }

    // Check if already defined
    if (customElements.get(this.elementTag)) {
      // Already registered, use existing
      console.log('[element-renderer] Element already registered:', this.elementTag);
      return;
    }

    // Register new custom element
    try {
      console.log('[element-renderer] Registering element:', this.elementTag, ElementClass);
      customElements.define(this.elementTag, ElementClass);
      await customElements.whenDefined(this.elementTag);
      console.log('[element-renderer] Element registered successfully:', this.elementTag);
    } catch (err) {
      // Element may already be defined in a different scope
      console.warn(`Could not register ${this.elementTag}:`, err);
    }
  }

  private updateElement() {
    console.log('[element-renderer] updateElement called:', {
      initialized: this.initialized,
      hasElementInstance: !!this.elementInstance,
      elementTag: this.elementTag,
    });

    if (!this.initialized || !this.elementInstance) {
      // PIE elements need to be in light DOM, not shadow DOM
      // Look for element in light DOM (this element's direct children)
      this.elementInstance = this.querySelector(this.elementTag) as HTMLElement;

      console.log('[element-renderer] Looking for element instance:', {
        elementTag: this.elementTag,
        found: !!this.elementInstance,
        lightDOM: true,
      });

      if (!this.elementInstance) {
        // Create element if it doesn't exist
        console.log('[element-renderer] Creating element in light DOM');
        this.elementInstance = document.createElement(this.elementTag) as HTMLElement;
        this.elementInstance.id = this.model?.id || 'element-1';
        this.appendChild(this.elementInstance);
      }

      // Attach session-changed listener
      this.elementInstance.addEventListener('session-changed', this.handleSessionChanged);
    }

    // Process model and set properties asynchronously
    this.processAndSetProperties().catch((err) => {
      console.error('[element-renderer] Failed to update element:', err);
      this.error = err instanceof Error ? err.message : String(err);
    });
  }

  private async processAndSetProperties() {
    try {
      // Following pie-players pattern: set properties on element
      const env = {
        mode: this.mode,
        role: 'student', // Demo player always in student role
      };

      // Process model through controller if available and not in configure mode
      let processedModel = this.model;
      if (this.mode !== 'configure' && this.element?.controller?.model) {
        // Controller.model() returns a Promise, must await it
        processedModel = await this.element.controller.model(this.model, this.session, env);
        console.log('[element-renderer] Processed model through controller:', processedModel);
      }

      if (!this.elementInstance) {
        throw new Error('Element instance not available');
      }

      console.log('[element-renderer] Setting properties on element instance:', {
        hasModel: 'model' in this.elementInstance,
        hasSession: 'session' in this.elementInstance,
        hasConfiguration: 'configuration' in this.elementInstance,
      });

      // Set properties (following pie-players/initialization.ts patterns)
      if ('model' in this.elementInstance) {
        (this.elementInstance as any).model = processedModel;
      }

      if ('session' in this.elementInstance) {
        (this.elementInstance as any).session = this.session;
      }

      if ('configuration' in this.elementInstance) {
        (this.elementInstance as any).configuration = {};
      }
    } catch (err) {
      console.error('[element-renderer] processAndSetProperties error:', err);
      throw err;
    }
  }

  private handleSessionChanged = (event: Event) => {
    // Re-dispatch session-changed event following pie-players pattern
    const customEvent = event as CustomEvent;
    const newEvent = new CustomEvent('session-changed', {
      detail: customEvent.detail,
      bubbles: true,
      composed: true,
    });

    this.dispatchEvent(newEvent);

    // Update local session state
    if (customEvent.detail) {
      this.session = { ...this.session, ...customEvent.detail };
    }
  };

  private setupMutationObserver() {
    // Following pie-players pattern: watch for dynamically added elements in light DOM
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              (node as Element).tagName.toLowerCase() === this.elementTag
            ) {
              // New element added, initialize it
              console.log('[element-renderer] Element added via mutation observer');
              this.elementInstance = node as HTMLElement;
              this.updateElement();
            }
          });
        }
      }
    });

    // Observe light DOM (this element's direct children)
    this.mutationObserver.observe(this, {
      childList: true,
      subtree: false,
    });
  }

  private cleanup() {
    if (this.elementInstance) {
      this.elementInstance.removeEventListener('session-changed', this.handleSessionChanged);
      this.elementInstance = undefined;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = undefined;
    }

    this.initialized = false;
  }

  override render() {
    if (this.loading) {
      return html`
        <div class="loading">
          <p>Loading element...</p>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error">
          <strong>Error:</strong> ${this.error}
        </div>
      `;
    }

    if (!this.element || !this.elementTag) {
      return html`
        <div style="padding: 2rem; text-align: center; color: #6b7280;">
          <p>No element loaded</p>
          <p style="font-size: 0.875rem; margin-top: 0.5rem;">
            Set the <code>element</code> property to load an element
          </p>
        </div>
      `;
    }

    // PIE elements are created imperatively in light DOM (see updateElement)
    // Shadow DOM render provides container styling and slot for light DOM content
    return html`
      <div class="element-container">
        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'element-renderer': ElementRenderer;
  }
}
