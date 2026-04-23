// @ts-nocheck
/**
 * @synced-from pie-elements/packages/multi-trait-rubric/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ModelSetEvent } from '@pie-element/shared-player-events';
import Main from './main.js';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

export default class MultiTraitRubric extends HTMLElement {
  constructor() {
    super();
    this._model = {};
    this._session = null;
    this._root = null;
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
    this._render();
  }

  _render() {
    const el = React.createElement(Main, { model: this._model, session: this._session });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);
    queueMicrotask(() => {
      renderMath(this);
    });
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
    }
  }
}
