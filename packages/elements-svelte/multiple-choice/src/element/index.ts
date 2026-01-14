/**
 * PIE Multiple Choice Custom Element (Svelte)
 *
 * HTMLElement wrapper that renders the Svelte component inside.
 * Compatible with PIE player system.
 */

import { ModelSetEvent, SessionChangedEvent } from '@pie-framework/pie-player-events';
import { mount, unmount } from 'svelte';
import { model as modelController } from '../controller/index';
import MultipleChoice from '../delivery/MultipleChoice.svelte';
import type { MultipleChoiceModel, MultipleChoiceSession } from '../types';

// Extend Window interface for PIE global registry
declare global {
  interface Window {
    pie?: {
      default?: Record<
        string,
        {
          Element: typeof MultipleChoiceElement;
          controller: { model: typeof modelController };
          config: unknown;
        }
      >;
    };
  }
}

export class MultipleChoiceElement extends HTMLElement {
  private _model: MultipleChoiceModel | null = null;
  private _session: MultipleChoiceSession | null = null;
  private _component: any = null;
  private _viewModel: any = null;

  async connectedCallback() {
    await this._render();
  }

  disconnectedCallback() {
    if (this._component) {
      unmount(this._component);
      this._component = null;
    }
  }

  get model() {
    return this._model;
  }

  set model(value: MultipleChoiceModel | null) {
    this._model = value;
    this._render();
    this._dispatchModelSet();
  }

  get session() {
    return this._session;
  }

  set session(value: MultipleChoiceSession | null) {
    this._session = value;
    this._render();
  }

  private async _render() {
    if (!this._model) return;

    // Get view model from controller
    const env = { mode: 'gather' as const, role: 'student' as const };
    this._viewModel = await modelController(this._model, this._session || {}, env);

    // Mount or update Svelte component
    if (!this._component) {
      this._component = mount(MultipleChoice, {
        target: this,
        props: {
          model: this._viewModel,
          session: this._session || { value: [] },
          onChange: this._handleChange.bind(this),
        },
      });
    } else {
      // Update props
      this._component.$set({
        model: this._viewModel,
        session: this._session || { value: [] },
      });
    }
  }

  private _handleChange(value: string[]) {
    if (!this._session) {
      this._session = { value: [] };
    }
    this._session.value = value;

    // Dispatch PIE session-changed event
    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this._isComplete()));
  }

  private _isComplete(): boolean {
    if (!this._session || !this._session.value) {
      return false;
    }

    if (!this._model) {
      return false;
    }

    const { choiceMode, minSelections = 1, maxSelections } = this._model;
    const selections = this._session.value.length || 0;

    if (choiceMode === 'radio') {
      return !!selections;
    }

    if (selections < minSelections || (maxSelections && selections > maxSelections)) {
      return false;
    }

    return true;
  }

  private _dispatchModelSet() {
    this.dispatchEvent(
      new ModelSetEvent(
        this.tagName.toLowerCase(),
        this._isComplete(),
        this._model !== undefined && this._model !== null
      )
    );
  }
}

// Export as default for PIE compatibility
export default MultipleChoiceElement;

// Also export named for convenience
export { MultipleChoiceElement as MultipleChoice };

/**
 * Register element and controller in global PIE registry for ESM player
 */
if (typeof window !== 'undefined') {
  window.pie = window.pie || {};
  window.pie.default = window.pie.default || {};

  window.pie.default['@pie-elements-ng/multiple-choice'] = {
    Element: MultipleChoiceElement,
    controller: { model: modelController },
    config: null,
  };
}
