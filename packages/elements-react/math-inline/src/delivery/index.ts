// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import debug from 'debug';
import {
  ModelSetEvent,
  SessionChangedEvent,
  createSessionNotifier,
  flushSessionNotifiers,
} from '@pie-element/shared-player-events';
import Translator from '@pie-lib/translator';

const { translator } = Translator;

// Inlined from the legacy configure/lib/defaults, which is ESM-incompatible and was not ported
const defaults = {
  configuration: {
    // Minimal configuration for student-facing UI
    // Full authoring configuration is only needed in the configure package
  } as any
};;
import Main from './main.js';

const log = debug('pie-ui:math-inline');

export { Main as Component };

export default class MathInline extends HTMLElement {
  constructor() {
    super();
    this._root = null;
    this._configuration = defaults.configuration;
    // Session state is already written synchronously in `sessionChanged`; only
    // this dispatch is coalesced, and `disconnectedCallback` flushes it.
    this._sessionNotifier = createSessionNotifier(
      this,
      () => {
        this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), true));
      },
      { delayMs: 1000 },
    );
    this.sessionChangedEventCaller = () => this._sessionNotifier.notify();
  }

  setLangAttribute() {
    const language = this._model && typeof this._model.language ? this._model.language : '';
    const lang = language ? language.slice(0, 2) : 'en';
    this.setAttribute('lang', lang);

    // set the lang attribute for the nearest parent div with class 'player-container' for MPI items as per PD-2483
    const playerContainer = this.closest('.player-container');
    if (playerContainer) {
      playerContainer.setAttribute('lang', lang);
    }
  }

  /** Names the region in the item language, which can change with any model set. */
  setRegionLabel() {
    this.setAttribute('aria-label', translator.t('mathInline.mathResponseQuestion', { lng: this._model?.language }));
  }

  set model(m) {
    this._model = m;
    this.dispatchEvent(new ModelSetEvent(this._model, true, !!this._model));
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

  set configuration(c) {
    this._configuration = c;
    this._render();
  }

  sessionChanged(s) {
    Object.keys(s).map((key) => {
      this._session[key] = s[key];
    });

    this.sessionChangedEventCaller();
    log('session: ', this._session);
  }

  connectedCallback() {
    this.setRegionLabel();
    this.setAttribute('role', 'region');

    this._render();
  }

  _render() {
    if (!this._model || !this._session) {
      return;
    }

    const el = React.createElement(Main, {
      model: this._model,
      session: this._session,
      configuration: this._configuration,
      onSessionChange: this.sessionChanged.bind(this),
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);
  }

  disconnectedCallback() {
    flushSessionNotifiers(this);

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
