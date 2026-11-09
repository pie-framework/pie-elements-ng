// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import debug from 'debug';
import Main from './main.js';

import { SessionChangedEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';

const log = debug('pie-ui:graph-lines');

export { Main as Component };

export const isComplete = (session, model) => {
  if (!session) {
    return false;
  }

  const value = session.value;
  let complete = true;

  if (value) {
    (model.config.prompts || []).forEach((prompt) => {
      if (!Number.isFinite(value[prompt.id])) {
        complete = false;
      }
    });
  }

  return complete;
};

export default class MatchList extends HTMLElement {
  constructor() {
    super();
    this._root = null;
    // The locale the player publishes, once it answers; until then the chrome
    // follows the item's declared language, else `en-US`.
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;
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

  sessionChanged(s) {
    this._session.value = s.value;

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), isComplete(this._session, this._model)));

    log('session: ', this._session);
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

    // The controller hands the authored model, `language` included, over as `config`.
    const declaredLanguage = this._model.config?.language;
    // Rendered once every catalog on the render path holds the chrome language,
    // so no English frame precedes it.
    const language = this._interfaceLocale ?? declaredLanguage;
    if (!isLocaleReady(language)) {
      void loadLocale(language).then(() => this._render());
      return;
    }
    stampElementLanguage(this, declaredLanguage);

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
