import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './components/json-editor.js';
import './components/player-controls.js';
import './components/element-renderer.js';
import type { ElementDefinition } from './components/element-renderer.js';

export type Mode = 'gather' | 'view' | 'evaluate' | 'configure';
export type { ElementDefinition };

@customElement('pie-demo-player')
export class PieDemoPlayer extends LitElement {
  static override styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .demo-layout {
      display: flex;
      height: 100%;
      gap: 0;
    }

    .editor-panel {
      flex: 0 0 40%;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e5e7eb;
      overflow: hidden;
    }

    .preview-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      padding: 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
      font-weight: 600;
    }

    .panel-content {
      flex: 1;
      overflow: auto;
      padding: 1rem;
    }

    .element-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .tab {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .tab:hover {
      background: #e5e7eb;
    }

    .tab.active {
      background: white;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    @media (max-width: 768px) {
      .demo-layout {
        flex-direction: column;
      }

      .editor-panel {
        flex: 0 0 auto;
        height: 50%;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
      }
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
  private activeTab: 'model' | 'session' | 'config' = 'model';

  private handleModelChange(e: CustomEvent) {
    try {
      this.model = JSON.parse(e.detail.value);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  }

  private handleSessionChange(e: CustomEvent) {
    try {
      this.session = JSON.parse(e.detail.value);
    } catch (error) {
      console.error('Invalid JSON:', error);
    }
  }

  private handleModeChange(e: CustomEvent) {
    this.mode = e.detail.mode;
  }

  private handleElementSessionChange(e: CustomEvent) {
    // Propagate session-changed event from element-renderer
    this.session = e.detail;
    this.dispatchEvent(
      new CustomEvent('session-changed', {
        detail: e.detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <div class="demo-layout">
        <div class="editor-panel">
          <div class="panel-header">Configuration</div>

          <div class="tabs">
            <button
              class="tab ${this.activeTab === 'model' ? 'active' : ''}"
              @click=${() => {
                this.activeTab = 'model';
              }}
            >
              Model
            </button>
            <button
              class="tab ${this.activeTab === 'session' ? 'active' : ''}"
              @click=${() => {
                this.activeTab = 'session';
              }}
            >
              Session
            </button>
            <button
              class="tab ${this.activeTab === 'config' ? 'active' : ''}"
              @click=${() => {
                this.activeTab = 'config';
              }}
            >
              Config
            </button>
          </div>

          <div class="panel-content">
            ${
              this.activeTab === 'model'
                ? html`
                  <json-editor
                    .value=${JSON.stringify(this.model, null, 2)}
                    @change=${this.handleModelChange}
                  ></json-editor>
                `
                : ''
            }
            ${
              this.activeTab === 'session'
                ? html`
                  <json-editor
                    .value=${JSON.stringify(this.session, null, 2)}
                    @change=${this.handleSessionChange}
                  ></json-editor>
                `
                : ''
            }
            ${this.activeTab === 'config' ? html`<div>Config options coming soon...</div>` : ''}
          </div>
        </div>

        <div class="preview-panel">
          <player-controls
            .mode=${this.mode}
            @mode-change=${this.handleModeChange}
          ></player-controls>

          <div class="panel-content">
            <div class="element-container">
              ${this.renderElement()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderElement() {
    return html`
      <element-renderer
        .element=${this.element}
        .model=${this.model}
        .session=${this.session}
        .mode=${this.mode}
        @session-changed=${this.handleElementSessionChange}
      ></element-renderer>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pie-demo-player': PieDemoPlayer;
  }
}
