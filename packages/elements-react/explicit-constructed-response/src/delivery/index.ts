// @ts-nocheck
/**
 * @synced-from pie-elements/packages/explicit-constructed-response/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ModelSetEvent,
  SessionChangedEvent,
  createSessionNotifier,
  flushSessionNotifiers,
} from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

import Main from './main.js';

const SESSION_NOTIFY_DELAY_MS = 200;

// Every blank capped at one character means each keystroke is a whole response,
// so there is nothing to coalesce and the dispatch goes out on the next tick.
function notifyDelayForModel(model) {
  const lengths = model && model.maxLengthPerChoice;
  const singleCharacterBlanks =
    Array.isArray(lengths) && lengths.length > 0 && lengths.every((length) => length === 1);
  return singleCharacterBlanks ? 0 : SESSION_NOTIFY_DELAY_MS;
}

export default class InlineDropdown extends HTMLElement {
  constructor() {
    super();
    this._model = null;
    this._session = null;
    this._root = null;

    // The session is written synchronously on commit; the dispatch and the
    // re-render are what get coalesced, which keeps the render cadence the
    // value-path debounce used to set while leaving `.session` readable at any
    // point. `disconnectedCallback` flushes what is still pending.
    this._sessionNotifier = createSessionNotifier(
      this,
      () => {
        this.dispatchChangedEvent();
        this._render();
      },
      { delayMs: () => notifyDelayForModel(this._model), maxWaitMs: SESSION_NOTIFY_DELAY_MS },
    );
  }

  setLangAttribute() {
    const language = this._model && typeof this._model.language ? this._model.language : '';
    const lang = language ? language.slice(0, 2) : 'en';
    this.setAttribute('lang', lang);
  }

  set model(m) {
    this._model = m;
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), this.session && !!this.session.value, !!this._model),
    );
    this.setLangAttribute();

    this._render();
  }

  set session(s) {
    this._session = s;
    this._render();
  }

  get session() {
    return this._session;
  }

  _render: any = () => {
    if (this._model && this._session) {
      let elem = React.createElement(Main, {
        choices: this._model.choices,
        disabled: this._model.disabled,
        displayType: this._model.displayType,
        feedback: this._model.feedback,
        language: this._model.language,
        markup: this._model.markup,
        maxLengthPerChoice: this._model.maxLengthPerChoice,
        maxLengthPerChoiceEnabled: this._model.maxLengthPerChoiceEnabled,
        mode: this._model.mode,
        note: this._model.note,
        onChange: this.changeSession,
        playerSpellCheckEnabled: this._model.playerSpellCheckEnabled,
        prompt: this._model.prompt,
        rationale: this._model.rationale,
        role: this._model.role,
        showNote: this._model.showNote,
        teacherInstructions: this._model.teacherInstructions,
        value: this._session.value,
        responseAreaInputConfiguration: this._model.responseAreaInputConfiguration,
      });

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
    this._sessionNotifier.notify();
  };

  connectedCallback() {
    this.setAttribute('aria-label', 'Fill in the Blank Question');
    this.setAttribute('role', 'region');

    this._render();
  }

  disconnectedCallback() {
    flushSessionNotifiers(this);

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
