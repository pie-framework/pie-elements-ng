// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ModelSetEvent, SessionChangedEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import InlineDropdown from './inline-dropdown.js';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

export default class RootInlineDropdown extends HTMLElement {
  constructor() {
    super();
    this._model = null;
    this._session = null;
    this._root = null;
  }
  set model(m) {
    this._model = m;
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), this.session && !!this.session.value, !!this._model),
    );

    this._render();
  }

  set session(s) {
    this._session = s;
    this._render();
  }

  get session() {
    return this._session;
  }

  /** Names the region in the item language, which can change with any model set. */
  setRegionLabel() {
    this.setAttribute('aria-label', translator.t('inlineDropdown.inlineDropdownQuestion', { lng: this._model?.language }));
  }

  setLangAttribute() {
    const language = this._model && typeof this._model.language ? this._model.language : '';
    const lang = language ? language.slice(0, 2) : 'en';
    this.setAttribute('lang', lang);
  }

  _render: any = () => {
    if (this._model && this._session) {
      let elem = React.createElement(InlineDropdown, {
        model: this._model,
        prompt: this._model.prompt,
        rationale: this._model.rationale,
        teacherInstructions: this._model.teacherInstructions,
        disabled: this._model.disabled,
        displayType: this._model.displayType,
        markup: this._model.markup,
        mode: this._model.mode,
        choices: this._model.choices,
        value: this._session.value,
        feedback: this._model.feedback,
        language: this._model.language,
        onChange: this.changeSession,
      });

      this.setLangAttribute();
      this.setRegionLabel();

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(elem);
      queueMicrotask(() => {
        renderMath(this);
      });
    }
  };

  dispatchChangedEvent: any = () => {
    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.session && !!this.session.value));
  };

  changeSession: any = (value) => {
    this.session.value = value;
    this.dispatchChangedEvent();
    this._render();
  };

  connectedCallback() {
    this.setRegionLabel();
    this.setAttribute('role', 'region');

    this._render();
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
