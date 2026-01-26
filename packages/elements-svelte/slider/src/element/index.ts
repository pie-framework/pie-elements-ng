/**
 * Slider Web Component Wrapper
 *
 * Wraps the Svelte component as a custom element for use with pie-element-player
 */

import type { Component } from 'svelte';
import { mount, unmount } from 'svelte';
import SliderComponent from '../slider.component.svelte';
import type {
  SliderModel,
  SliderSession,
  SliderEvaluation,
  PieEnvironment,
} from '../slider.types.js';

/**
 * Base class for Svelte-based custom elements
 *
 * Note: Web components and Svelte reactivity don't mix well naturally.
 * This wrapper uses remounting strategy - each prop change remounts the component.
 * This is inefficient but reliable for web component interop.
 */
abstract class BaseSvelteMountElement<TProps extends Record<string, unknown>> extends HTMLElement {
  protected abstract Component: Component<any>;
  protected abstract getProps(): TProps;

  #container: HTMLDivElement | null = null;
  protected _instance: any = null;

  connectedCallback() {
    this._mountOrUpdate();
  }

  disconnectedCallback() {
    this._teardownInstance();

    if (this.#container) {
      this.#container.remove();
      this.#container = null;
    }
  }

  protected _mountOrUpdate() {
    if (!this.#container) {
      this.#container = document.createElement('div');
      this.#container.style.display = 'contents';
      this.appendChild(this.#container);
    }

    // Remount strategy: unmount and remount on every prop change
    // This ensures Svelte sees fresh props in its reactive graph
    if (this._instance) {
      this._teardownInstance();
    }

    const props = this.getProps();
    this._instance = mount(this.Component, {
      target: this.#container as HTMLDivElement,
      props,
    });
  }

  protected _teardownInstance() {
    if (this._instance) {
      try {
        unmount(this._instance);
      } catch {
        // ignore
      }
      this._instance = null;
    }
  }
}

/**
 * Slider Custom Element
 *
 * Web component wrapper for the Slider Svelte component
 */
export class SliderElement extends BaseSvelteMountElement<{
  model: SliderModel;
  session: SliderSession;
  env: PieEnvironment;
  evaluation?: SliderEvaluation;
  onSessionChange: (session: SliderSession) => void;
}> {
  protected Component = SliderComponent;

  private _model: SliderModel | null = null;
  private _session: SliderSession | null = null;
  private _env: PieEnvironment = { mode: 'gather', role: 'student' };
  private _evaluation: SliderEvaluation | undefined = undefined;

  // Model property
  set model(value: SliderModel | null) {
    if (this._model === value) return;
    this._model = value;
    this._mountOrUpdate();
  }

  get model(): SliderModel | null {
    return this._model;
  }

  // Session property
  set session(value: SliderSession | null) {
    const oldValue = this._session?.value;
    const newValue = value?.value;

    // Skip if value hasn't changed (handles NaN correctly)
    const isSame = oldValue === newValue || (Number.isNaN(oldValue) && Number.isNaN(newValue));

    if (isSame) return;

    this._session = value;
    // Note: Remounting on every session change is slow but necessary
    // for Svelte to see the prop updates. This is a limitation of
    // the manual mount() API. Future: use customElement compilation mode.
    this._mountOrUpdate();
  }

  get session(): SliderSession | null {
    return this._session;
  }

  // Environment property
  set env(value: PieEnvironment) {
    if (this._env?.mode === value?.mode && this._env?.role === value?.role) return;
    this._env = value;
    this._mountOrUpdate();
  }

  get env(): PieEnvironment {
    return this._env;
  }

  // Evaluation property
  set evaluation(value: SliderEvaluation | undefined) {
    if (this._evaluation === value) return;
    this._evaluation = value;
    this._mountOrUpdate();
  }

  get evaluation(): SliderEvaluation | undefined {
    return this._evaluation;
  }

  protected _mountOrUpdate() {
    // Don't mount until we have a valid model
    if (!this._model) {
      return;
    }

    super._mountOrUpdate();
  }

  protected getProps() {
    // Ensure session always has a valid structure
    const session = this._session || { value: undefined };

    return {
      model: this._model as SliderModel,
      session,
      env: this._env,
      evaluation: this._evaluation,
      onSessionChange: (newSession: SliderSession) => {
        // Prevent infinite loops - check if value actually changed
        const oldValue = this._session?.value;
        const newValue = newSession.value;

        // Handle NaN comparison (NaN !== NaN)
        const isSame = oldValue === newValue || (Number.isNaN(oldValue) && Number.isNaN(newValue));

        if (isSame) {
          return;
        }

        this._session = newSession;
        this.dispatchEvent(
          new CustomEvent('session-changed', {
            detail: newSession,
            bubbles: true,
            composed: true,
          })
        );
      },
    };
  }
}

// Default export for element loader
export default SliderElement;
