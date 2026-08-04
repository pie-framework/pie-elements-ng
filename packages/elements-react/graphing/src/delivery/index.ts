// @ts-nocheck
/**
 * @synced-from pie-elements/packages/graphing/src/index.js
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

import Main from './main.js';

export { Main as Component };

export default class Graphing extends HTMLElement {
  constructor() {
    super();
    this._root = null;
    this._mathObserver = null;
    this._mathRenderPending = false;
  }

  // The title and axis labels are injected synchronously via dangerouslySetInnerHTML,
  // but createRoot().render() commits asynchronously, so a queueMicrotask(renderMath)
  // would run before the LaTeX spans are in the DOM and leave raw LaTeX on first render.
  // Observing the DOM and typesetting after each commit keeps math in sync regardless of timing.
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

  connectedCallback() {
    this._initMathObserver();
    this._render();
  }

  isComplete = (answer) => Array.isArray(answer) && answer.length > 0;

  changeAnswers: any = (answer) => {
    this._session.answer = answer;

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete(this._session.answer)));

    this._render();
  };

  _render() {
    if (!this._model || !this._session) {
      return;
    }

    this._initMathObserver();

    const el = React.createElement(Main, {
      model: this._model,
      session: this._session,
      onAnswersChange: this.changeAnswers,
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);
  }

  disconnectedCallback() {
    this._disconnectMathObserver();
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
