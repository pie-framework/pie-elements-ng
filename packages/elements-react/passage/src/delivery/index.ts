// @ts-nocheck
/**
 * @synced-from pie-elements/packages/passage/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import { ModelSetEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import React from 'react';
import { createRoot } from 'react-dom/client';

import StimulusTabs from './stimulus-tabs';

export default class PiePassage extends HTMLElement {
  constructor() {
    super();
    this._model = {
      passages: [],
    };
    this._session = null;
    this._root = null;
  }

  setLangAttribute() {
    const language = this._model && typeof this._model.language ? this._model.language : '';
    const lang = language ? language.slice(0, 2) : 'en';
    this.setAttribute('lang', lang);
  }

  set model(s) {
    this._model = s;
    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this._session, !!this._model));
    this.setLangAttribute();

    this._render();
  }

  set session(s) {
    this._session = s;
  }

  connectedCallback() {
    this.setAttribute('aria-label', 'Passage');
    this.setAttribute('role', 'region');
    this._render();
  }

  _render() {
    const { passages = [] } = this._model;

    if (this._model.passages.length > 0) {
      const passagesTabs = passages.map((passage, index) => ({
        id: index,
        ...passage,
      }));

      const elem = React.createElement(StimulusTabs, {
        tabs: passagesTabs,
      });

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(elem);
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
