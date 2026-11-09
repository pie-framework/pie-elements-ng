// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { isEmpty } from '@pie-element/shared-lodash';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { ModelSetEvent, SessionChangedEvent } from '@pie-element/shared-player-events';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';

import DrawingResponseComponent from './drawing-response/index.js';

export default class DrawingResponse extends HTMLElement {
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
    this._model = m;

    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this.isComplete(), !!this._model));
    this._render();
  }

  isComplete() {
    return this._session && (!isEmpty(this._session.drawables) || !isEmpty(this._session.texts));
  }

  sessionChanged: any = (update) => {
    this._session.drawables = update.drawables;
    this._session.texts = update.texts;
    this._session.width = update.width;

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete()));

    this._render();
  };

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
    this._render();
  }

  _render() {
    if (this._model && this._session) {
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

      const el = React.createElement(DrawingResponseComponent, {
        model: this._model,
        session: this._session,
        onSessionChange: this.sessionChanged,
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
