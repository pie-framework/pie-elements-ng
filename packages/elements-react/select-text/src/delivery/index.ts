// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { SessionChangedEvent, ModelSetEvent } from '@pie-element/shared-player-events';
import Main from './main.js';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import generateModel from './utils.js';

// The token spans `@pie-lib/text-select` renders, by start and end offset.
const TOKEN_SELECTOR = '[data-token-start][data-token-end]';

const tokenKey = ({ start, end }) => `${start}-${end}`;

export default class SelectText extends HTMLElement {
  /**
   * The AfA PNP 3.0 supports this element takes. A PIE toolkit offers the answer
   * eliminator to an element declaring `answer-masking` and reads its tokens
   * from `pieSupportTargets`.
   */
  static pieSupports = Object.freeze(['answer-masking']);

  constructor() {
    super();
    this._root = null;
    // Tokens the answer eliminator struck out, by `tokenKey`; none can be selected.
    this._eliminatedTokens = new Map();
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

  /**
   * The rendered tokens, for the `answer-masking` support this element
   * declares. Each id is the token's start and end offset.
   */
  pieSupportTargets(term) {
    if (term !== 'answer-masking') {
      return [];
    }

    return Array.from(this.querySelectorAll(TOKEN_SELECTOR)).flatMap((container) => {
      const content = container.querySelector('[data-indexkey]');
      const token = { start: Number(container.dataset.tokenStart), end: Number(container.dataset.tokenEnd) };
      if (!content || !Number.isFinite(token.start) || !Number.isFinite(token.end)) {
        return [];
      }

      return [
        {
          id: tokenKey(token),
          label: content.textContent.trim(),
          container,
          content,
          isSelected: () => this._isTokenSelected(token),
          isEliminable: () =>
            !!this._model && !this._model.disabled && !this._model.animationsDisabled && !this._isTokenSelected(token),
          setEliminated: (eliminated) => this._setTokenEliminated(token, eliminated),
        },
      ];
    });
  }

  _isTokenSelected({ start, end }) {
    return (this._session?.selectedTokens ?? []).some((t) => t.start === start && t.end === end);
  }

  _setTokenEliminated(token, eliminated) {
    const key = tokenKey(token);
    if (eliminated === this._eliminatedTokens.has(key)) {
      return;
    }

    if (eliminated) {
      this._eliminatedTokens.set(key, token);
    } else {
      this._eliminatedTokens.delete(key);
    }
    this.render();
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
        eliminatedTokens: [...this._eliminatedTokens.values()],
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
      this._root = null;
    }
  }
}
