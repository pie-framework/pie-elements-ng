// @ts-nocheck
/**
 * @synced-from pie-elements/packages/extended-text-entry/src/index.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import Main from './main.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import debug from 'debug';

import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  ModelSetEvent,
  SessionChangedEvent,
  createSessionNotifier,
  flushSessionNotifiers,
} from '@pie-element/shared-player-events';

const log = debug('@pie-elements:extended-text-entry');

// Coalesce a burst of editor commits. The editor only calls back on blur and on
// a `done` transaction, so this window is short-lived in practice.
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
    const language = this._model && typeof this._model.language ? this._model.language : '';
    const lang = language ? language.slice(0, 2) : 'en';
    this.setAttribute('lang', lang);
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
    this.setAttribute('aria-label', 'Written Response Question');
    this.setAttribute('role', 'region');

    this.render();
  }

  render() {
    if (this._model && this._session) {
      let elem = React.createElement(Main, {
        model: this._model,
        session: this._session,
        onValueChange: this.valueChange.bind(this),
        onAnnotationsChange: this.annotationsChange.bind(this),
        onCommentChange: this.commentChange.bind(this),
      });

      this.setLangAttribute();

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
    flushSessionNotifiers(this);

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
