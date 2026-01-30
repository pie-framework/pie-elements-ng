// @ts-nocheck
/**
 * @synced-from pie-elements/packages/select-text/src/index.js
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
import { SessionChangedEvent, ModelSetEvent } from '@pie-element/shared-player-events';
import Main from './main';
import { renderMath } from '@pie-element/shared-math-rendering-katex';
import generateModel from './utils';

export default class SelectText extends HTMLElement {
  constructor() {
    super();
    this._root = null;
  }

  set model(m) {
    this._model = m;

    this.render();
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), this.isSessionComplete(), this._model !== undefined),
    );
  }

  set session(s) {
    this._session = s;

    if (this._model) {
      const generatedModel = generateModel(this._model) || {};
      const { tokens } = generatedModel;
      let { selectedTokens } = s || {};

      selectedTokens = selectedTokens || [];

      // This case was introduced mostly for createCorrectSession:
      // make sure initial session tokens are parsed and have correct start and end (according to the regenerated model)
      const selectedTokenExistsInGeneratedTokens = (s) =>
        tokens.find(({ start: tStart, end: tEnd }) => s.start === tStart && s.end === tEnd);

      // check if ALL the selectedTokens have the correct start and end
      const allAreCorrect = selectedTokens.reduce(
        (acc, selectedToken) => acc && selectedTokenExistsInGeneratedTokens(selectedToken),
        true,
      );

      if (!allAreCorrect) {
        // otherwise, make sure to parse selectedTokens as well
        const generatedModel = generateModel({ ...this._model, tokens: selectedTokens }) || {};
        const { tokens } = generatedModel;

        if (tokens) {
          this._session.selectedTokens = tokens;
        }
      }
    }

    if (!Array.isArray(this._session.selectedTokens)) {
      this._session.selectedTokens = [];
    }
    this.render();
  }

  get session() {
    return this._session;
  }

  isSessionComplete() {
    const { selectedTokens } = this._session || {};
    return Array.isArray(selectedTokens) && selectedTokens.length > 0;
  }

  selectionChanged(selection) {
    this._session.selectedTokens = selection;

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isSessionComplete()));
  }

  connectedCallback() {
    this.render();
  }

  render() {
    if (this._model && this._session) {
      const el = React.createElement(Main, {
        model: this._model,
        session: this._session,
        onSelectionChange: this.selectionChanged.bind(this),
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
