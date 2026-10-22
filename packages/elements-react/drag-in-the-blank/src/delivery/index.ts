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
import { ModelSetEvent, SessionChangedEvent } from '@pie-element/shared-player-events';
import Main from './main.js';

export const isComplete = (session, model, promptAudio, elementContext) => {
  const { completeAudioEnabled, responseAreasToBeFilled } = model || {};

  if (completeAudioEnabled && promptAudioPending(elementContext, promptAudio)) {
    return false;
  }

  if (!session || !session.value) {
    return false;
  }

  const filledResponseAreas = Object.values(session.value || {}).filter((val) => !!val).length;

  return filledResponseAreas >= responseAreasToBeFilled;
};

export default class DragInTheBlank extends HTMLElement {
  constructor() {
    super();
    this.promptAudio = new PromptAudioTracker({
      session: () => this._session,
      writeSession: (next) => this._session && Object.assign(this._session, next),
      announce: () => this.dispatchChangedEvent(),
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
  }

  set model(m) {
    this._model = m;
    this.dispatchEvent(
      new ModelSetEvent(
        this.tagName.toLowerCase(),
        isComplete(this._session, this._model, this.promptAudio, this),
        !!this._model,
      ),
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

  _render: any = () => {
    if (this._model && this._session) {
      let elem = React.createElement(Main, {
        model: this._model,
        value: this._session.value,
        onChange: this.changeSession,
      });

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(elem);
      setTimeout(() => renderMath(this), 0);
    }
  };

  dispatchChangedEvent: any = () => {
    this.dispatchEvent(
      new SessionChangedEvent(
        this.tagName.toLowerCase(),
        isComplete(this._session, this._model, this.promptAudio, this),
      ),
    );
  };

  changeSession: any = (value) => {
    this.session.value = value;
    this.session.selector = 'Mouse';

    this.dispatchChangedEvent();
    this._render();
  };

  connectedCallback() {
    this._render();

    this._promptAudioWatcher.connect();
  }

  disconnectedCallback() {
    this._promptAudioWatcher.disconnect();

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
