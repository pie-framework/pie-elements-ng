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

import ImageClozeAssociationComponent from './root.js';

export default class ImageClozeAssociation extends HTMLElement {
  constructor() {
    super();
    this._root = null;
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
  }

  set model(m) {
    this._model = m;

    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this.isComplete(), !!this._model));
    this._render();
  }

  isComplete() {
    const {
      completeAudioEnabled,
      completeResponses,
      duplicateResponses,
      hasUnplacedChoices,
      maxResponsePerZone,
      responseAreasToBeFilled,
    } = this._model || {};
    // check audio completion if the setting is enabled and audio actually exists,
    // whether the audio is started by autoplay or by the student
    if (completeAudioEnabled && promptAudioPending(this, this.promptAudio)) {
      return false;
    }

    if (!this._session || !this._session.answers) {
      return false;
    }

    const { answers } = this._session;

    if (!Array.isArray(answers)) {
      return false;
    }

    // filter answers by containerIndex and count the ones with content
    const filledResponseAreas = [...new Map(answers.map((item) => [item.containerIndex, item])).values()].length;
    // check if an answer choice was added to at least as many response areas
    // as the number of populated response areas in the correct answer
    const areResponseAreasFilled = filledResponseAreas >= responseAreasToBeFilled;

    if (maxResponsePerZone > 1) {
      if (duplicateResponses) {
        // an answer choice can be used multiple times
        return areResponseAreasFilled;
      }

      // any correct answer have any unplaced answer choices (by the author)
      if (hasUnplacedChoices) {
        return areResponseAreasFilled;
      }

      const allAnswersValue = answers.map((answer) => answer.value);

      // check if any correct answer have any unplaced answer choices (by the student)
      const requiredAnswersPlaced = completeResponses.some((response) =>
        response.every((val) => allAnswersValue.includes(val)),
      );

      // true - all choices (required for a correct response) were placed into a response area
      return requiredAnswersPlaced;
    }

    return areResponseAreasFilled;
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

  updateAnswer(data) {
    this._session.answers = data;
    this._session.selector = 'Mouse';

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete()));

    this._render();
  }

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

  _render() {
    if (this._model && this._session) {
      const el = React.createElement(ImageClozeAssociationComponent, {
        model: this._model,
        session: this._session,
        updateAnswer: this.updateAnswer.bind(this),
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
}
