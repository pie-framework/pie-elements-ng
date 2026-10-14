// @ts-nocheck

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
import { flushPendingEditorSaves } from '@pie-lib/editable-html-tip-tap';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

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
    this._disconnecting = false;

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

  /** Names the region in the item language, which can change with any model set. */
  setRegionLabel() {
    this.setAttribute('aria-label', translator.t('explicitConstructedResponse.fillInTheBlankQuestion', { lng: this._model?.language }));
  }

  set model(m) {
    this._model = m;
    this.dispatchEvent(
      new ModelSetEvent(this.tagName.toLowerCase(), this.session && !!this.session.value, !!this._model),
    );
    this.setLangAttribute();
    this.setRegionLabel();

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
    if (this._disconnecting) {
      return;
    }

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
        idleSaveDelay: this._model.idleSaveDelay,
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

  // A blank builds `value` on the session from the last render, and the re-render after a commit
  // waits for the notifier, so another blank's commit since then would be overwritten. With the
  // blank's id, only that blank's answer is written.
  changeSession: any = (value, id) => {
    this.session.value = id === undefined ? value : { ...this.session.value, [id]: value[id] };
    this._sessionNotifier.notify();
  };

  connectedCallback() {
    this.setRegionLabel();
    this.setAttribute('role', 'region');

    this._render();
  }

  // A prototype method, so the session notifier's `commitPendingSession` wraps it and runs it first:
  // an idle save still waiting in a response editor reaches the session before the notifiers flush.
  // A class field would be an own property, which the notifier leaves alone. See PIE-916.
  commitPendingSession() {
    flushPendingEditorSaves(this);
  }

  disconnectedCallback() {
    // Unmount first: the response editor sends its pending idle save as it unmounts, and that
    // write has to be in the session before the notifiers flush. Nothing re-renders meanwhile.
    this._disconnecting = true;

    try {
      if (this._root) {
        this._root.unmount();
        this._root = null;
      }

      flushSessionNotifiers(this);
    } finally {
      this._disconnecting = false;
    }
  }
}
