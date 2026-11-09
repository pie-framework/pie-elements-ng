// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './main.js';
import { SessionChangedEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';

export { Main as Component };

export const isComplete = (session, model) => {
  const ids = model?.rows?.map((r) => r.id) || [];

  return ids.reduce((acc, id) => {
    if (!acc) {
      return false;
    }

    const arr = session.answers && session.answers[id];
    const hasChoice = Array.isArray(arr) && arr.includes(true);

    return hasChoice && acc;
  }, true);
};

export default class Match extends HTMLElement {
  constructor() {
    super();
    this._root = null;
    // The locale the player publishes, once it answers; null until then. While
    // it is null the chrome follows the item's declared language (published,
    // else `model.language`, else `en-US`; permanent, see the PRD's invariant).
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;
  }

  set model(m) {
    // config object props should be part of the model props
    // model.config should be no longer used
    this._model = { ...m, ...(m?.config || {}) };
    this._render();
  }

  set session(s) {
    this._session = s;
    this._render();
  }

  get session() {
    return this._session;
  }

  sessionChanged(s) {
    this._session.answers = s.answers;
    const complete = isComplete(this._session, this._model);

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), complete));

    this._render();
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
    this._render();
  }

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

    const el = React.createElement(Main, {
      model: this._model,
      session: this._session,
      onSessionChange: this.sessionChanged.bind(this),
      language,
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);
    queueMicrotask(() => {
      renderMath(this);
    });
  }

  disconnectedCallback() {
    this._disconnectInterfaceLocale?.();
    this._disconnectInterfaceLocale = null;
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
