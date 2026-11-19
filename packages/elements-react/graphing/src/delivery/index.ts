// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SessionChangedEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';

import Main from './main.js';

export { Main as Component };

export default class Graphing extends HTMLElement {
  constructor() {
    super();
    this._root = null;
    this._mathObserver = null;
    this._mathRenderPending = false;
    // The locale the player publishes, once it answers; null until then. While
    // it is null the chrome follows the item's declared language (published,
    // else `model.language`, else `en-US`; permanent, see the PRD's invariant).
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;
  }

  // The title and axis labels are injected synchronously via dangerouslySetInnerHTML,
  // but createRoot().render() commits asynchronously, so a queueMicrotask(renderMath)
  // would run before the LaTeX spans are in the DOM and leave raw LaTeX on first render.
  // Observing the DOM and typesetting after each commit keeps math in sync regardless of timing.
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

  set model(m) {
    this._model = m;
    this._render();
  }

  set session(s) {
    this._session = s;
    this._render();
  }

  get session() {
    return this._session;
  }

  connectedCallback() {
    if (!this._disconnectInterfaceLocale) {
      this._disconnectInterfaceLocale = subscribeInterfaceLocale(this, (value) => {
        if (value?.locale && value.locale !== this._interfaceLocale) {
          this._interfaceLocale = value.locale;
          this._render();
        }
      });
    }
    this._initMathObserver();
    this._render();
  }

  isComplete = (answer) => Array.isArray(answer) && answer.length > 0;

  changeAnswers: any = (answer) => {
    this._session.answer = answer;

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete(this._session.answer)));

    this._render();
  };

  _render() {
    if (!this._model || !this._session) {
      return;
    }

    // The chrome speaks the locale the player publishes, else the item's
    // declared language, else `en-US`. Rendered once every catalog on the
    // render path holds it, so no English frame precedes it.
    const language = this._interfaceLocale ?? this._model.language;
    if (!isLocaleReady(language)) {
      void loadLocale(language).then(() => this._render());
      return;
    }
    // The host names the content language; the chrome roots carry `language`.
    stampElementLanguage(this, this._model.language);

    this._initMathObserver();

    const el = React.createElement(Main, {
      model: this._model,
      session: this._session,
      onAnswersChange: this.changeAnswers,
      language,
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);
  }

  disconnectedCallback() {
    this._disconnectInterfaceLocale?.();
    this._disconnectInterfaceLocale = null;
    this._disconnectMathObserver();
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
