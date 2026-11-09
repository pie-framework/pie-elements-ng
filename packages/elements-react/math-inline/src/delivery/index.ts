// @ts-nocheck

import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';
import debug from 'debug';
import {
  ModelSetEvent,
  SessionChangedEvent,
  createSessionNotifier,
  flushSessionNotifiers,
} from '@pie-element/shared-player-events';
import { catalogs } from '../i18n/index.js';

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
    // The locale the player publishes, once it answers; null until then. While it is null the
    // chrome follows the item's declared language, else `en-US` (permanent, see the PRD's invariant).
    this._interfaceLocale = null;
    this._unsubscribeInterfaceLocale = null;
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
    // The element asserts the language the item declares, canonicalized, and
    // nothing when it declares none: an `en` default claimed undeclared
    // content — Spanish items included — for English.
    const language = this._model?.language ?? null;
    stampElementLanguage(this, language);

    // set the lang attribute for the nearest parent div with class 'player-container' for MPI items as per PD-2483,
    // under the same declared-only rule: the container may hold several items.
    const playerContainer = this.closest('.player-container');
    if (playerContainer) {
      stampElementLanguage(playerContainer, language);
    }
  }

  /** The language of the chrome: the player's interface locale, else the item's declared language. */
  chromeLanguage() {
    return this._interfaceLocale ?? this._model?.language;
  }

  /** Names the region in the chrome language, which can change with any model set. */
  setRegionLabel() {
    // Relabels once the locale lands, for a model set before any session renders.
    const i18n = catalogs.forLocale(this.chromeLanguage(), () => this.setRegionLabel());
    this.setAttribute('aria-label', i18n.t('mathResponseQuestion'));
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

    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = subscribeInterfaceLocale(this, ({ locale }) => {
      if (locale === this._interfaceLocale) {
        return;
      }

      this._interfaceLocale = locale;
      this.setRegionLabel();
      this._render();
    });

    this._render();
  }

  _render() {
    if (!this._model || !this._session) {
      return;
    }

    // Rendered once every catalog on the render path holds the chrome language, so no English
    // frame precedes it, and the declared one, against which a stored default note is compared.
    const language = this.chromeLanguage();
    if (!isLocaleReady(language) || !isLocaleReady(this._model.language)) {
      void Promise.all([loadLocale(language), loadLocale(this._model.language)]).then(() => this._render());
      return;
    }

    const el = React.createElement(Main, {
      model: this._model,
      session: this._session,
      language,
      configuration: this._configuration,
      onSessionChange: this.sessionChanged.bind(this),
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);
  }

  disconnectedCallback() {
    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = null;
    flushSessionNotifiers(this);

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
