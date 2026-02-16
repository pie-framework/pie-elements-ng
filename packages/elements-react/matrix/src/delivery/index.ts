// @ts-nocheck
/**
 * @synced-from pie-elements/packages/matrix/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SessionChangedEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import Main from './Main';

export const isComplete = (session) => {
  if (!session || !session.value) {
    return false;
  }
  return !!Object.keys(session.value).length;
};

export default class Matrix extends HTMLElement {
  constructor() {
    super();
    this._root = null;
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

  sessionChanged({ matrixKey, matrixValue }) {
    const matrixRowKey = matrixKey.split('-')[0];
    const sessionValueClone = Object.keys(this._session.value || {}).reduce((acc, key) => {
      if (!key.startsWith(matrixRowKey)) {
        acc[key] = this._session.value[key];
      }
      return acc;
    }, {});
    sessionValueClone[matrixKey] = matrixValue;
    this._session.value = sessionValueClone;
    const complete = isComplete(this._session, this._model);

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), complete));
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    if (!this._model || !this._session) {
      return;
    }

    const el = React.createElement(Main, {
      model: this._model,
      session: this._session,
      onSessionChange: this.sessionChanged.bind(this),
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
    if (this._root) {
      this._root.unmount();
    }
  }
}
