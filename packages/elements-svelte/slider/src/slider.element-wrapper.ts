/**
 * Slider Custom Element Wrapper
 *
 * Creates a custom element using Svelte's mount API with proper reactive props
 * Includes registration guard to prevent duplicate registration errors
 */

import { mount, unmount, hydrate, type Component } from 'svelte';
import SliderElementComponent from './slider.element.svelte';
import type { SliderModel, SliderSession, SliderEvaluation, PieEnvironment } from './slider.types.js';

const ELEMENT_NAME = 'slider-svelte-element';

/**
 * Custom Element wrapper for Slider
 * Uses Svelte 5's $state and $derived for proper reactivity without remounting
 */
class SliderElement extends HTMLElement {
  private _instance: ReturnType<typeof mount> | null = null;
  private _container: HTMLDivElement | null = null;

  // Reactive state holders
  private _model = $state<SliderModel | null>(null);
  private _session = $state<SliderSession | null>(null);
  private _env = $state<PieEnvironment>({ mode: 'gather', role: 'student' });
  private _evaluation = $state<SliderEvaluation | undefined>(undefined);

  constructor() {
    super();
  }

  // Properties with getters/setters
  set model(value: SliderModel | null) {
    this._model = value;
  }

  get model(): SliderModel | null {
    return this._model;
  }

  set session(value: SliderSession | null) {
    this._session = value;
  }

  get session(): SliderSession | null {
    return this._session;
  }

  set env(value: PieEnvironment) {
    this._env = value;
  }

  get env(): PieEnvironment {
    return this._env;
  }

  set evaluation(value: SliderEvaluation | undefined) {
    this._evaluation = value;
  }

  get evaluation(): SliderEvaluation | undefined {
    return this._evaluation;
  }

  connectedCallback() {
    if (!this._container) {
      this._container = document.createElement('div');
      this._container.style.display = 'contents';
      this.appendChild(this._container);
    }

    if (!this._instance && this._model) {
      this._instance = mount(SliderElementComponent as Component, {
        target: this._container,
        props: {
          model: this._model,
          session: this._session || { value: undefined },
          env: this._env,
          evaluation: this._evaluation,
        },
      });
    }
  }

  disconnectedCallback() {
    if (this._instance) {
      unmount(this._instance);
      this._instance = null;
    }
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }
}

// Only register if not already registered
if (!customElements.get(ELEMENT_NAME)) {
  customElements.define(ELEMENT_NAME, SliderElement);
}

export default SliderElement;
