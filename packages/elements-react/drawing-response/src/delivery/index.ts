// @ts-nocheck
/**
 * @synced-from pie-elements/packages/drawing-response/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { isEmpty } from 'lodash-es';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { ModelSetEvent, SessionChangedEvent } from '@pie-element/shared-player-events';

import DrawingResponseComponent from './drawing-response';

export default class DrawingResponse extends HTMLElement {
  constructor() {
    super();
    this._root = null;
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
    this._render();
  }

  _render() {
    if (this._model && this._session) {
      const el = React.createElement(DrawingResponseComponent, {
        model: this._model,
        session: this._session,
        onSessionChange: this.sessionChanged,
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
