// @ts-nocheck
/**
 * @synced-from pie-elements/packages/rubric/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Rubric from './main';
import React from 'react';
import { createRoot } from 'react-dom/client';
import debug from 'debug';
import { renderMath } from '@pie-element/shared-math-rendering-katex';

export default class RubricRender extends HTMLElement {
  constructor() {
    super();
    debug.log('constructor called');
    this.onModelChanged = this.onModelChanged.bind(this);
    this._root = null;
  }

  set model(s) {
    this._model = s;
    this._render();
  }

  onModelChanged(m) {
    this._model = m;
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    if (this._model) {
      const el = React.createElement(Rubric, { value: this._model });

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
