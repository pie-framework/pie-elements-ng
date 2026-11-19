// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SessionChangedEvent } from '@pie-element/shared-player-events';
import Main from './main.js';
import { cloneDeep } from '@pie-element/shared-lodash';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import FractionModelChart from './fraction-model-chart.js';

// Export FractionModelChart for use in configure
export { FractionModelChart };

export default class FractionModel extends HTMLElement {
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

  get model() {
    return this._model;
  }

  set session(s) {
    this._session = s;
    this._render();
  }

  get session() {
    return this._session;
  }

  /*
   * Method to check if student answered the question
   * @param {session} session contains the session object
   * @param {model} model contains the model object
   * */
  isSessionComplete(session, model) {
    const answers = session && session.answers;
    const configComplete = model.allowedStudentConfig ? answers.noOfModel > 0 && answers.partsPerModel > 0 : true;
    const responseComplete = Array.isArray(answers.response) && answers.response.length > 0;
    return configComplete && responseComplete;
  }

  /*
   * Session change event handler
   * @param {session} session contains the session object
   * */
  onSessionChange(session) {
    this._session.answers = session && session.answers;
    const complete = this.isSessionComplete(this._session, this._model);
    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), complete));
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
      const declaredLanguage = this._model.language;
      // Rendered once every catalog on the render path holds the chrome language,
      // so no English frame precedes it.
      const language = this._interfaceLocale ?? declaredLanguage;
      if (!isLocaleReady(language)) {
        void loadLocale(language).then(() => this._render());
        return;
      }
      stampElementLanguage(this, declaredLanguage);

      let model = cloneDeep(this._model);
      const el = React.createElement(Main, {
        model,
        session: this._session,
        onSessionChange: this.onSessionChange.bind(this),
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
