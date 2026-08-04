// @ts-nocheck
/**
 * @synced-from pie-elements/packages/rubric/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Rubric from './main.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import debug from 'debug';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

export default class RubricRender extends HTMLElement {
  constructor() {
    super();
    debug.log('constructor called');
    this.onModelChanged = this.onModelChanged.bind(this);
    this._root = null;
    this._mathObserver = null;
    this._mathRenderPending = false;
  }

  // React commits asynchronously, so a queueMicrotask(renderMath) can run before
  // the LaTeX spans are in the DOM and leave raw LaTeX on first render — this is
  // especially visible when rubric is mounted inside complex-rubric, which swaps
  // its innerHTML and re-defines the inner element. Observing the DOM and
  // typesetting after each commit keeps math in sync regardless of timing.
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

  set model(s) {
    this._model = s;
    this._render();
  }

  onModelChanged(m) {
    this._model = m;
    this._render();
  }

  connectedCallback() {
    this._initMathObserver();
    this._render();
  }

  _render() {
    if (this._model) {
      this._initMathObserver();

      const el = React.createElement(Rubric, { value: this._model });

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(el);
    }
  }

  disconnectedCallback() {
    this._disconnectMathObserver();
    if (this._root) {
      this._root.unmount();
    }
  }
}
