// @ts-nocheck
/**
 * @synced-from pie-elements/packages/match/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import Main from './main';
import { SessionChangedEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-katex';

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
