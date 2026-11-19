// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  SessionChangedEvent,
  ModelSetEvent,
  createSessionNotifier,
  flushSessionNotifiers,
} from '@pie-element/shared-player-events';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import Main from './main.js';

export default class MathTemplated extends HTMLElement {
  constructor() {
    super();
    this._root = null;
    // The locale the player publishes, once it answers; until then the chrome
    // follows the item's declared language, else `en-US`.
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;
    // Session state is already written synchronously in `onSessionChange`; only
    // this dispatch is coalesced, and `disconnectedCallback` flushes it.
    this._sessionNotifier = createSessionNotifier(
      this,
      () => {
        this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), true));
      },
      { delayMs: 1000 },
    );
    this.sessionChangedEventCaller = () => this._sessionNotifier.notify();
  }

  set model(m) {
    this._model = m;

    this.render();
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), this.isSessionComplete(), this._model !== undefined),
    );
  }

  get model() {
    return this._model;
  }

  set session(s) {
    this._session = s;

    this.render();
  }

  get session() {
    return this._session;
  }

  isSessionComplete() {
    // a method to check if student answered the question
    return true;
  }

  onSessionChange(session) {
    // you can add an extra step here to validate session
    Object.keys(session).map((key) => {
      this._session[key] = session[key];
    });

    this.sessionChangedEventCaller();
    this.render();
  }

  connectedCallback() {
    if (!this._disconnectInterfaceLocale) {
      this._disconnectInterfaceLocale = subscribeInterfaceLocale(this, (value) => {
        if (value?.locale && value.locale !== this._interfaceLocale) {
          this._interfaceLocale = value.locale;
          this.render();
        }
      });
    }
    this.render();
  }

  render() {
    if (!this._model || !this._session) {
      return;
    }

    if (this._model && this._session) {
      const declaredLanguage = this._model.language;
      // Rendered once every catalog on the render path holds the chrome language, so no English
      // frame precedes it. The declared language loads too: a stored default note is compared
      // against it.
      const language = this._interfaceLocale ?? declaredLanguage;
      if (!isLocaleReady(language) || !isLocaleReady(declaredLanguage)) {
        void Promise.all([loadLocale(language), loadLocale(declaredLanguage)]).then(() => this.render());
        return;
      }
      stampElementLanguage(this, declaredLanguage);

      const el = React.createElement(Main, {
        model: this._model,
        session: this._session,
        language,
        onSessionChange: this.onSessionChange.bind(this),
      });

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(el);
    }
  }

  disconnectedCallback() {
    flushSessionNotifiers(this);
    this._disconnectInterfaceLocale?.();
    this._disconnectInterfaceLocale = null;

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
