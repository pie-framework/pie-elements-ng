// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { ModelSetEvent, SessionChangedEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import InlineDropdown from './inline-dropdown.js';
import { catalogs } from '../i18n/index.js';

export default class RootInlineDropdown extends HTMLElement {
  constructor() {
    super();
    this._model = null;
    this._session = null;
    this._root = null;
    // The locale the player publishes, once it answers; null until then. While it is null the
    // chrome follows the item's declared language, else `en-US` (permanent, see the PRD's invariant).
    this._interfaceLocale = null;
    this._unsubscribeInterfaceLocale = null;
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

  /** The language of the chrome: the player's interface locale, else the item's declared language. */
  chromeLanguage() {
    return this._interfaceLocale ?? this._model?.language;
  }

  /** Names the region in the chrome language, which can change with any model set. */
  setRegionLabel() {
    this.setAttribute('aria-label', catalogs.forLocale(this.chromeLanguage()).t('inlineDropdownQuestion'));
  }

  setLangAttribute() {
    // The element asserts the language the item declares, canonicalized, and
    // nothing when it declares none: an `en` default claimed undeclared
    // content — Spanish items included — for English.
    stampElementLanguage(this, this._model?.language ?? null);
  }

  _render: any = () => {
    if (this._model && this._session) {
      // Rendered once every catalog on the render path holds the chrome language, so no English
      // frame precedes it.
      const language = this.chromeLanguage();
      if (!isLocaleReady(language)) {
        void loadLocale(language).then(() => this._render());
        return;
      }

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
        language,
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

    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = subscribeInterfaceLocale(this, ({ locale }) => {
      if (locale === this._interfaceLocale) {
        return;
      }

      this._interfaceLocale = locale;
      this._render();
    });

    this._render();
  }

  disconnectedCallback() {
    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = null;
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
