// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { compact } from '@pie-element/shared-lodash';
import debug from 'debug';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { SessionChangedEvent } from '@pie-element/shared-player-events';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import Main from './main.js';

const log = debug('pie-elements:placement-ordering');

export const isValidSession = ({ model, session }) => {
  const { config } = model;

  const compactSessionValues = (session && compact(session.value)) || [];
  const completeSession = compactSessionValues.length === model.choices.length;

  // if it includes targets, it doesn't have to contain all the choices selected (eg: only 2 targets were filled)
  // but if it does not include targets, it's a must to have all choices selected
  return config.includeTargets || completeSession;
};

export default class Ordering extends HTMLElement {
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

  isComplete = (value) => value && compact(value).length === this._model.completeLength;

  sessionChange: any = (session) => {
    this._session.value = session.value;
    this.render();
    this.dispatchEvent(
      new SessionChangedEvent(this.tagName.toLowerCase(), this._session && this.isComplete(this._session.value)),
    );
  };

  set model(newModel) {
    this._model = newModel;

    this.render();
    this.dispatchEvent(
      new CustomEvent('model-set', {
        bubbles: true,
        detail: {
          complete: false,
        },
      }),
    );
  }

  set session(newSession) {
    this._session = newSession;
    this.render();
  }

  get session() {
    return this._session;
  }

  render() {
    if (this._model && this._session) {
      log('[render] session: ', this._session.value);
      log('[render] model: ', this._model);

      // The chrome speaks the locale the player publishes, else the item's
      // declared language, else `en-US`. Rendered once every catalog on the
      // render path holds it, so no English frame precedes it. The declared
      // language loads too: a stored default note is compared against it.
      const language = this._interfaceLocale ?? this._model.language;
      if (!isLocaleReady(language) || !isLocaleReady(this._model.language)) {
        void Promise.all([loadLocale(language), loadLocale(this._model.language)]).then(() => this.render());
        return;
      }
      // The host names the content language; the chrome roots carry `language`.
      stampElementLanguage(this, this._model.language);

      this._initMathObserver();

      const element = React.createElement(Main, {
        model: this._model,
        session: this._session,
        onSessionChange: this.sessionChange,
        language,
      });

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(element);
    }
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
    this._initMathObserver();
    this.render();
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
