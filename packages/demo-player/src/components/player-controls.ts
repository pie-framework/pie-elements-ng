import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

type Mode = 'gather' | 'view' | 'evaluate' | 'configure';

@customElement('player-controls')
export class PlayerControls extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    .mode-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .mode-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .mode-btn:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .mode-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid #d1d5db;
      background: white;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f3f4f6;
    }

    .action-btn.primary {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .action-btn.primary:hover {
      background: #059669;
    }

    .action-btn.secondary {
      background: #6b7280;
      color: white;
      border-color: #6b7280;
    }

    .action-btn.secondary:hover {
      background: #4b5563;
    }
  `;

  @property({ type: String })
  mode: Mode = 'gather';

  private handleModeChange(newMode: Mode) {
    this.mode = newMode;
    this.dispatchEvent(
      new CustomEvent('mode-change', {
        detail: { mode: newMode },
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleSubmit() {
    this.dispatchEvent(
      new CustomEvent('submit', {
        bubbles: true,
        composed: true,
      })
    );
  }

  private handleReset() {
    this.dispatchEvent(
      new CustomEvent('reset', {
        bubbles: true,
        composed: true,
      })
    );
  }

  override render() {
    return html`
      <div class="controls">
        <div class="mode-buttons">
          <button
            class="mode-btn ${this.mode === 'gather' ? 'active' : ''}"
            @click=${() => this.handleModeChange('gather')}
          >
            Gather
          </button>
          <button
            class="mode-btn ${this.mode === 'view' ? 'active' : ''}"
            @click=${() => this.handleModeChange('view')}
          >
            View
          </button>
          <button
            class="mode-btn ${this.mode === 'evaluate' ? 'active' : ''}"
            @click=${() => this.handleModeChange('evaluate')}
          >
            Evaluate
          </button>
          <button
            class="mode-btn ${this.mode === 'configure' ? 'active' : ''}"
            @click=${() => this.handleModeChange('configure')}
          >
            Configure
          </button>
        </div>

        <div class="actions">
          <button class="action-btn secondary" @click=${this.handleReset}>
            Reset
          </button>
          <button class="action-btn primary" @click=${this.handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'player-controls': PlayerControls;
  }
}
