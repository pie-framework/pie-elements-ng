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
import { deepActiveElement, loadMathLive } from '@pie-lib/math-input-mathlive';
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

/**
 * Renders nothing in place of a Main that throws, as the uncaught error did, and tells the element,
 * whose focus calls wait for Main.
 */
class MainBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

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
    // The rendered Main once React commits it, and the focus calls waiting for that.
    this._main = null;
    this._mainWaiters = [];
    this._setMain = (main) => {
      this._main = main;
      this._settleMainWaiters(!!main);
    };
    // Counts the renders Main threw on; keying the boundary on it makes the next render try again.
    this._mainFailures = 0;
    this._onMainError = (error) => {
      this._mainFailures += 1;
      this._settleMainWaiters(false);
      // Reported as uncaught, as it was before the boundary caught it.
      reportError(error);
    };
    // The promise of a focus call waiting for the field, which a call made meanwhile returns.
    this._pendingFocus = null;
  }

  _settleMainWaiters(rendered) {
    const waiters = this._mainWaiters;
    this._mainWaiters = [];
    waiters.forEach((resolve) => resolve(rendered));
  }

  /**
   * Focus the answer field as Tab does: the caret lands in the first answer block and no keypad
   * opens. While the field mounts this returns a promise, which resolves false and leaves focus
   * alone when focus moves in the meantime, the element leaves the page or Main fails to render.
   * A call made while one waits returns its promise. False when the item shows no field to type into.
   *
   * @param {FocusOptions} [options] passed to the field's `focus()`
   * @returns {boolean | Promise<boolean>}
   */
  focusFirstInput(options) {
    // The first call to settle moves focus, so a second waiting call would see focus gone.
    if (this._pendingFocus) {
      return this._pendingFocus;
    }

    if (this._answerField()) {
      return this._focusAnswerField(options);
    }

    if (!this.isConnected || !this._model || !this._session) {
      return false;
    }

    const activeAtCall = deepActiveElement();

    this._pendingFocus = this._whenFieldsMounted()
      .then(
        (rendered) =>
          rendered && this.isConnected && deepActiveElement() === activeAtCall && this._focusAnswerField(options),
      )
      .finally(() => {
        this._pendingFocus = null;
      });
    return this._pendingFocus;
  }

  _answerField() {
    return this.querySelector('math-field');
  }

  _focusAnswerField(options) {
    const field = this._answerField();
    if (!field) {
      return false;
    }

    // Native focus, as Tab gives it: the field delegates it to its keyboard sink at once. MathLive's
    // own focus() drops the options and moves focus 60ms later.
    HTMLElement.prototype.focus.call(field, options);
    // The sink is fixed in place, so focusing it scrolls nothing; scroll as MathLive's focus() does.
    if (!options?.preventScroll) {
      field.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    return field.getRootNode().activeElement === field;
  }

  /** Whether Main rendered; resolved once every field it renders has had the chance to mount. */
  async _whenFieldsMounted() {
    const rendered = !!this._main || (await new Promise((resolve) => this._mainWaiters.push(resolve)));
    if (!rendered) {
      return false;
    }

    // A field mounts once MathLive loads, and a task later every mount waiting on the load has run.
    await loadMathLive();
    await new Promise((resolve) => setTimeout(resolve, 0));
    return true;
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

    const el = React.createElement(
      MainBoundary,
      { key: this._mainFailures, onError: this._onMainError },
      React.createElement(Main, {
        model: this._model,
        session: this._session,
        language,
        configuration: this._configuration,
        onSessionChange: this.sessionChanged.bind(this),
        ref: this._setMain,
      }),
    );

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

    // A model set while a locale loads has no root yet, so nothing unmounts to release these.
    this._main = null;
    this._settleMainWaiters(false);
  }
}
