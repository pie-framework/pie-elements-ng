// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ModelSetEvent } from '@pie-element/shared-player-events';
import Main from './main.js';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';

export default class MultiTraitRubric extends HTMLElement {
  constructor() {
    super();
    this._model = {};
    this._session = null;
    this._root = null;
    this._mathObserver = null;
    this._mathRenderPending = false;
    // The locale the player publishes, once it answers; until then the chrome
    // follows the item's declared language, else `en-US`.
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;
  }

  // React commits asynchronously, so a queueMicrotask(renderMath) can run before
  // the LaTeX spans are in the DOM and leave raw LaTeX on first render — this is
  // especially visible when this element is mounted inside complex-rubric, which
  // swaps its innerHTML and re-defines the inner element. Observing the DOM and
  // typesetting after each commit keeps math in sync regardless of timing.
  _scheduleMathRender: any = () => {
    if (this._mathRenderPending) return;
    this._mathRenderPending = true;

    requestAnimationFrame(() => {
      if (this._mathObserver) {
        this._mathObserver.disconnect();
      }
      renderMath(this);
      this._mathRenderPending = false;
      setTimeout(() => {
        if (this._mathObserver) {
          this._mathObserver.observe(this, { childList: true, subtree: true });
        }
      }, 50);
    });
  };

  _initMathObserver() {
    if (this._mathObserver) return;
    this._mathObserver = new MutationObserver(this._scheduleMathRender);
    this._mathObserver.observe(this, { childList: true, subtree: true });
  }

  _disconnectMathObserver() {
    if (this._mathObserver) {
      this._mathObserver.disconnect();
      this._mathObserver = null;
    }
  }

  set model(s) {
    this._model = s;
    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this._session, !!this._model));

    this._render();
  }

  set session(s) {
    this._session = s;
  }

  get session() {
    return this._session;
  }

  connectedCallback() {
    this._initMathObserver();
    if (!this._disconnectInterfaceLocale) {
      this._disconnectInterfaceLocale = subscribeInterfaceLocale(this, (value) => {
        if (value?.locale && value.locale !== this._interfaceLocale) {
          this._interfaceLocale = value.locale;
          this._render();
        }
      });
    }
    this._render();
  }

  _render() {
    this._initMathObserver();

    const declaredLanguage = this._model?.language;
    // Rendered once every catalog on the render path holds the chrome language,
    // so no English frame precedes it.
    const language = this._interfaceLocale ?? declaredLanguage;
    if (!isLocaleReady(language)) {
      void loadLocale(language).then(() => this._render());
      return;
    }
    stampElementLanguage(this, declaredLanguage);

    const el = React.createElement(Main, { model: this._model, session: this._session, language });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);
  }

  disconnectedCallback() {
    this._disconnectMathObserver();
    this._disconnectInterfaceLocale?.();
    this._disconnectInterfaceLocale = null;
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
