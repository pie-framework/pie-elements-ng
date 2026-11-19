// @ts-nocheck

import Main from './main.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import debug from 'debug';

import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import {
  ModelSetEvent,
  SessionChangedEvent,
  DEFAULT_IDLE_SAVE_DELAY_MS,
  createSessionNotifier,
  flushSessionNotifiers,
  subscribeIdleSaveDelay,
} from '@pie-element/shared-player-events';
import { flushPendingEditorSaves } from '@pie-lib/editable-html-tip-tap';
import { catalogs } from '../i18n/index.js';

const log = debug('@pie-elements:extended-text-entry');

// Coalesce a burst of editor commits. The editor calls back on blur, on a `done`
// transaction and after the student pauses typing for the player's idle-save delay.
const SESSION_NOTIFY_DELAY_MS = 1500;

const domParser = typeof window !== undefined ? new DOMParser() : { parseFromString: (v) => v };

export function textContent(value) {
  if (typeof value !== 'string') {
    return undefined;
  }

  try {
    const document = domParser.parseFromString(value, 'text/html');
    const textContent = document.body.textContent;

    return textContent;
  } catch (err) {
    log('tried to parse as dom and failed', value);
    return value;
  }
}

export function isComplete(value) {
  const tc = textContent(value);
  const out = tc !== undefined && tc.length > 0;

  return out;
}

export default class RootExtendedTextEntry extends HTMLElement {
  constructor() {
    super();
    this._model = null;
    this._session = null;
    this._root = null;
    this._disconnecting = false;
    // The player sets it through `sessionCommitContext`; the model carries none. See PIE-916.
    this._idleSaveDelay = DEFAULT_IDLE_SAVE_DELAY_MS;
    this._unsubscribeIdleSaveDelay = null;
    // The locale the player publishes, once it answers; null until then. While it is null the
    // chrome follows the item's declared language, else `en-US` (permanent, see the PRD's invariant).
    this._interfaceLocale = null;
    this._unsubscribeInterfaceLocale = null;

    // The session is written synchronously on commit; only the notification is
    // deferred, so a player reading `.session` always sees the committed
    // response. `disconnectedCallback` flushes what is still pending.
    this._valueNotifier = createSessionNotifier(
      this,
      () => {
        this.dispatchEvent(
          new SessionChangedEvent(this.tagName.toLowerCase(), isComplete(this._session && this._session.value)),
        );
      },
      { delayMs: SESSION_NOTIFY_DELAY_MS },
    );

    this._commentNotifier = createSessionNotifier(
      this,
      () => {
        this.dispatchEvent(
          new SessionChangedEvent(this.tagName.toLowerCase(), isComplete(this._session && this._session.comment)),
        );
      },
      { delayMs: SESSION_NOTIFY_DELAY_MS },
    );
  }

  setLangAttribute() {
    // The element asserts the language the item declares, canonicalized, and
    // nothing when it declares none: an `en` default claimed undeclared
    // content — Spanish items included — for English.
    stampElementLanguage(this, this._model?.language ?? null);
  }

  /** The language of the chrome: the player's interface locale, else the item's declared language. */
  chromeLanguage() {
    return this._interfaceLocale ?? this._model?.language;
  }

  /** Names the region in the chrome language, which can change with any model set. */
  setRegionLabel() {
    this.setAttribute('aria-label', catalogs.forLocale(this.chromeLanguage()).t('writtenResponseQuestion'));
  }

  set model(m) {
    this._model = m;
    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), false, !!this._model));

    this.render();
  }

  set session(s) {
    this._session = s;
    this.render();
  }

  get session() {
    return this._session;
  }

  valueChange(value) {
    this._session.value = value;

    this._valueNotifier.notify();

    this.render();
  }

  annotationsChange(annotations) {
    this._session.annotations = annotations;

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), true));

    this.render();
  }

  commentChange(comment) {
    this._session.comment = comment;

    this._commentNotifier.notify();

    this.render();
  }

  connectedCallback() {
    this.setRegionLabel();
    this.setAttribute('role', 'region');

    this._unsubscribeIdleSaveDelay?.();
    this._unsubscribeIdleSaveDelay = subscribeIdleSaveDelay(this, (delay) => {
      if (delay === this._idleSaveDelay) {
        return;
      }

      this._idleSaveDelay = delay;
      this.render();
    });

    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = subscribeInterfaceLocale(this, ({ locale }) => {
      if (locale === this._interfaceLocale) {
        return;
      }

      this._interfaceLocale = locale;
      this.render();
    });

    this.render();
  }

  render() {
    if (this._disconnecting) {
      return;
    }

    if (this._model && this._session) {
      // Rendered once every catalog on the render path holds the chrome language, so no English
      // frame precedes it.
      const language = this.chromeLanguage();
      if (!isLocaleReady(language)) {
        void loadLocale(language).then(() => this.render());
        return;
      }

      let elem = React.createElement(Main, {
        model: this._model,
        session: this._session,
        language,
        idleSaveDelay: this._idleSaveDelay,
        onValueChange: this.valueChange.bind(this),
        onAnnotationsChange: this.annotationsChange.bind(this),
        onCommentChange: this.commentChange.bind(this),
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
  }

  // A prototype method, so the session notifier's `commitPendingSession` wraps it and runs it first:
  // an idle save still waiting in a response editor reaches the session before the notifiers flush.
  // A class field would be an own property, which the notifier leaves alone. See PIE-916.
  commitPendingSession() {
    flushPendingEditorSaves(this);
  }

  disconnectedCallback() {
    this._unsubscribeIdleSaveDelay?.();
    this._unsubscribeIdleSaveDelay = null;
    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = null;

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
