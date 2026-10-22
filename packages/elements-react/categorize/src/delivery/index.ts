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
import CategorizeComponent from './categorize/index.js';

export default class Categorize extends HTMLElement {
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
    this._root = null;
    this._mathObserver = null;
    this._mathRenderPending = false;
  }

  _scheduleMathRender: any = () => {
    if (this._mathRenderPending) return;

    this._mathRenderPending = true;

    requestAnimationFrame(() => {
      if (this._mathObserver && !this._mathObserverPaused) {
        this._mathObserver.disconnect();
      }

      renderMath(this);

      this._mathRenderPending = false;

      setTimeout(() => {
        if (this._mathObserver && !this._mathObserverPaused) {
          this._mathObserver.observe(this, {
            childList: true,
            subtree: true,
            characterData: false,
          });
        }
      }, 50);
    });
  };

  _initMathObserver() {
    if (this._mathObserver) return;

    this._mathObserver = new MutationObserver(() => {
      this._scheduleMathRender();
    });

    this._mathObserver.observe(this, {
      childList: true,
      subtree: true,
      characterData: false,
    });
  }

  _disconnectMathObserver() {
    if (this._mathObserver) {
      this._mathObserver.disconnect();
      this._mathObserver = null;
    }
  }

  pauseMathObserver: any = () => {
    if (this._mathObserver) {
      this._mathObserver.disconnect();
      this._mathObserverPaused = true;
    }
  };

  resumeMathObserver: any = () => {
    if (this._mathObserverPaused) {
      this._mathObserverPaused = false;

      if (this._mathObserver) {
        this._mathObserver.observe(this, {
          childList: true,
          subtree: true,
          characterData: false,
        });
      }
    }
  };

  set model(m) {
    this._model = m;

    this.eliminateBlindAnswersFromSession();
    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this.isComplete(), !!this._model));

    this.render();
  }

  isComplete() {
    const {
      choices,
      completeAudioEnabled,
      hasUnplacedChoices,
      possibleResponses,
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

    // filter answers by category and count the ones with content
    const filledResponseAreas = answers.filter((answer) => answer.choices.length).length;
    // check if an answer choice was added to at least as many response areas
    // as the number of populated response areas in the correct answer
    const areResponseAreasFilled = filledResponseAreas >= responseAreasToBeFilled;
    // check if multiple placements are allowed
    const duplicatesAllowed = (choices || []).some((choice) => choice.categoryCount === 0);

    if (duplicatesAllowed) {
      // an answer choice can be used multiple times
      return areResponseAreasFilled;
    }

    // any correct answer have any unplaced answer choices (by the author)
    if (hasUnplacedChoices) {
      return areResponseAreasFilled;
    }

    const allAnswersIds = answers.map((answer) => answer.choices).flat();

    // check if any correct answer have any unplaced answer choices (by the student)
    const requiredAnswersPlaced = (possibleResponses || []).some((response) =>
      response.every((val) => allAnswersIds.includes(val)),
    );

    // true - all choices (required for a correct response) were placed into a response area
    return requiredAnswersPlaced;
  }

  set session(s) {
    if (s && !s.answers) {
      s.answers = [];
    }

    this._session = s;
    this.render();
  }

  get session() {
    return this._session;
  }

  eliminateBlindAnswersFromSession() {
    const { answers = [] } = this._session || {};
    const { choices = [] } = this._model || {};

    const mappedChoices = choices.map((c) => c.id) || [];
    const filteredAnswers = answers.map((answer) => {
      const answerChoices = answer?.choices || [];
      answer.choices = answerChoices.filter((c) => mappedChoices.includes(c));

      return answer;
    });

    if (filteredAnswers.length > 0) {
      this.changeAnswers(filteredAnswers);
    }
  }

  changeAnswers(answers) {
    this._session.answers = answers;
    this._session.selector = 'Mouse';

    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), this.isComplete()));

    this.render();
  }

  onShowCorrectToggle() {
    renderMath(this);
  }

  connectedCallback() {
    this._initMathObserver();
    
    this._promptAudioWatcher.connect();

    // Disconnecting unmounts the React root, so a reinserted element renders again.
    this.render();
  }

  disconnectedCallback() {
    this._disconnectMathObserver();
    
    this._promptAudioWatcher.disconnect();

    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }

  render() {
    if (this._model && this._session) {
      const el = React.createElement(CategorizeComponent, {
        model: this._model,
        session: this._session,
        onAnswersChange: this.changeAnswers.bind(this),
        onShowCorrectToggle: this.onShowCorrectToggle.bind(this),
        pauseMathObserver: this.pauseMathObserver,
        resumeMathObserver: this.resumeMathObserver,
      });

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(el);
    }
  }
}
