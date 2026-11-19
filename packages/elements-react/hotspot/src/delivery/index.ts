// @ts-nocheck

import React from 'react';
import { createRoot } from 'react-dom/client';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { EnableAudioAutoplayImage as EnableAudioAutoplayImageImport } from '@pie-lib/render-ui';
import { PromptAudioTracker, PromptAudioWatcher, promptAudioPending } from '@pie-element/shared-utils';

function isRenderableReactInteropType(value: any) {
  return (
    typeof value === 'function' ||
    (typeof value === 'object' && value !== null && typeof value.$$typeof === 'symbol')
  );
}

function unwrapReactInteropSymbol(maybeSymbol: any, namedExport?: string) {
  if (!maybeSymbol) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol)) return maybeSymbol;
  if (isRenderableReactInteropType(maybeSymbol.default)) return maybeSymbol.default;
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport])) {
    return maybeSymbol[namedExport];
  }
  if (namedExport && isRenderableReactInteropType(maybeSymbol[namedExport]?.default)) {
    return maybeSymbol[namedExport].default;
  }
  return maybeSymbol;
}
import * as RenderUiNamespace from '@pie-lib/render-ui';
const renderUiNamespaceAny = RenderUiNamespace as any;
const renderUiDefaultMaybe = renderUiNamespaceAny['default'];
const renderUi =
  renderUiDefaultMaybe && typeof renderUiDefaultMaybe === 'object'
    ? renderUiDefaultMaybe
    : renderUiNamespaceAny;
const EnableAudioAutoplayImage = unwrapReactInteropSymbol(EnableAudioAutoplayImageImport, 'EnableAudioAutoplayImage') || unwrapReactInteropSymbol(renderUi.EnableAudioAutoplayImage, 'EnableAudioAutoplayImage');
import { SessionChangedEvent, ModelSetEvent } from '@pie-element/shared-player-events';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';

import HotspotComponent from './hotspot/index.js';
import { updateSessionValue } from './session-updater.js';

export default class Hotspot extends HTMLElement {
  constructor() {
    super();
    this.promptAudio = new PromptAudioTracker({
      session: () => this._session,
      writeSession: (next) => this._session && Object.assign(this._session, next),
      announce: () => this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete())),
    });
    this._promptAudioWatcher = new PromptAudioWatcher({
      root: this,
      tracker: this.promptAudio,
      settings: () => this._model,
      enableAudioImage: EnableAudioAutoplayImage,
    });
    this._model = null;
    this._session = null;
    this._root = null;
    // The locale the player publishes, once it answers; null until then. While
    // it is null the chrome follows the item's declared language (published,
    // else `model.language`, else `en-US`; permanent, see the PRD's invariant).
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;
  }

  set model(m) {
    this._model = m;

    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this.isComplete(), !!this._model));
    this._render();
  }

  isComplete() {
    if (!this._session || !this._session.answers) {
      return false;
    }

    const { completeAudioEnabled } = this._model || {};
    // check audio completion if the setting is enabled and audio actually exists,
    // whether the audio is started by autoplay or by the student
    if (completeAudioEnabled && promptAudioPending(this, this.promptAudio)) {
      return false;
    }

    if (!Array.isArray(this._session.answers)) {
      return false;
    }

    return this._session.answers.length > 0;
  }

  set session(s) {
    if (s && !s.answers) {
      s.answers = [];
    }

    this._session = s;
    this._render();
  }

  get session() {
    return this._session;
  }

  /** Whether the prompt audio counts as played. A host sets it to skip the `completeAudioEnabled` wait. */
  get audioComplete() {
    return this.promptAudio.hasEnded;
  }

  set audioComplete(value) {
    this.promptAudio.markPlayed(!!value);
  }

  onSelectChoice(data) {
    updateSessionValue(this._session, this._model, data);

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete()));

    this._render();
  }

  connectedCallback() {
    if (!this._disconnectInterfaceLocale) {
      this._disconnectInterfaceLocale = subscribeInterfaceLocale(this, (value) => {
        if (value?.locale && value.locale !== this._interfaceLocale) {
          this._interfaceLocale = value.locale;
          this._render();
        }
      });
    }
    this._render();

    this._promptAudioWatcher.connect();
  }

  _render() {
    if (this._model && this._session) {
      // The chrome speaks the locale the player publishes, else the item's
      // declared language, else `en-US`. Rendered once every catalog on the
      // render path holds it, so no English frame precedes it.
      const language = this._interfaceLocale ?? this._model.language;
      if (!isLocaleReady(language)) {
        void loadLocale(language).then(() => this._render());
        return;
      }
      // The host names the content language; the chrome roots carry `language`.
      stampElementLanguage(this, this._model.language);

      const el = React.createElement(HotspotComponent, {
        model: this._model,
        session: this._session,
        onSelectChoice: this.onSelectChoice.bind(this),
        language,
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
    this._disconnectInterfaceLocale?.();
    this._disconnectInterfaceLocale = null;
    this._promptAudioWatcher.disconnect();

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
