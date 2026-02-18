// @ts-nocheck
/**
 * @synced-from pie-elements/packages/fraction-model/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SessionChangedEvent } from '@pie-element/shared-player-events';
import Main from './main.js';
import { cloneDeep } from 'lodash-es';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import FractionModelChart from './fraction-model-chart.js';

// Export FractionModelChart for use in configure
export { FractionModelChart };

export default class FractionModel extends HTMLElement {
  constructor() {
    super();
    this._root = null;
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
    this._render();
  }

  _render() {
    if (this._model && this._session) {
      let model = cloneDeep(this._model);
      const el = React.createElement(Main, {
        model,
        session: this._session,
        onSessionChange: this.onSessionChange.bind(this),
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
    if (this._root) {
      this._root.unmount();
    }
  }
}
