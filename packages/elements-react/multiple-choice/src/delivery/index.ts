// @ts-nocheck

import Main from './main.js';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { debounce } from '@pie-element/shared-lodash';
import debug from 'debug';
import {
  ModelSetEvent,
  SessionChangedEvent,
  createSessionNotifier,
  flushSessionNotifiers,
} from '@pie-element/shared-player-events';
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
import { updateSessionValue } from './session-updater.js';
import { exceedsMaxSelections } from './utils.js';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import { catalogs } from '../i18n/index.js';

const log = debug('pie-ui:multiple-choice');

export const isComplete = (session, model, promptAudio, elementContext) => {
  const { completeAudioEnabled } = model || {};

  // check audio completion if the setting is enabled and audio actually exists,
  // whether the audio is started by autoplay or by the student
  if (completeAudioEnabled && promptAudioPending(elementContext, promptAudio)) {
    return false;
  }

  if (!session || !session.value) {
    return false;
  }

  const { choiceMode, minSelections = 1, maxSelections } = model || {};
  const selections = session.value.length || 0;

  if (choiceMode === 'radio') {
    return !!selections;
  }

  if (selections < minSelections || exceedsMaxSelections(selections, maxSelections)) {
    return false;
  }

  return true;
};

function getPlayerAttributes(element) {
  const player =
    element.closest('pie-player') ||
    element.closest('pie-item-player');

  if (!player) {
    return { baseHeadingLevel: undefined, includeSrHeading: true };
  }

  const getRaw = (camelCaseName, hyphenatedName, allLowerName) => {
    let raw = player[camelCaseName];

    // fallback in case someone sets via HTML attribute manually
    if (raw == null) {
      raw =
        player.getAttribute(hyphenatedName) ??
        player.getAttribute(allLowerName);
    }

    return raw;
  };

  const levelRaw = getRaw('baseHeadingLevel', 'base-heading-level', 'baseheadinglevel');
  const level = parseInt(levelRaw, 10);
  const baseHeadingLevel = Number.isFinite(level) && level >= 1 && level <= 6 ? level : undefined;

  const srRaw = getRaw('includeSrHeading', 'include-sr-heading', 'includesrheading');
  const includeSrHeading = srRaw == null ? true : srRaw !== false && srRaw !== 'false';

  return { baseHeadingLevel, includeSrHeading };
}

// Resolves heading attributes for a custom element, preferring explicit instance
// properties (set by a parent element such as EBSR) over player-level attributes.
function resolveHeadingProps(element) {
  const fromPlayer = getPlayerAttributes(element);

  return {
    baseHeadingLevel: element._baseHeadingLevel !== undefined ? element._baseHeadingLevel : fromPlayer.baseHeadingLevel,
    includeSrHeading: element._includeSrHeading !== undefined ? element._includeSrHeading : fromPlayer.includeSrHeading,
  };
}

export default class MultipleChoice extends HTMLElement {
  /**
   * The AfA PNP 3.0 supports this element takes. A PIE toolkit offers the answer
   * eliminator to an element declaring `answer-masking` and reads its choices
   * from `pieSupportTargets`.
   */
  static pieSupports = Object.freeze(['answer-masking']);

  constructor() {
    super();
    this.promptAudio = new PromptAudioTracker({
      session: () => this._session,
      writeSession: (next) => this._session && Object.assign(this._session, next),
      announce: () => this._dispatchResponseChanged(),
    });
    this._promptAudioWatcher = new PromptAudioWatcher({
      root: this,
      tracker: this.promptAudio,
      settings: () => this._model,
      enableAudioImage: EnableAudioAutoplayImage,
    });
    this._model = null;
    this._session = null;
    // Choice values the answer eliminator struck out; none can be selected.
    this._eliminatedChoices = new Set();
    this._options = null; // added for ebsr print mode detection
    this._boundHandleKeyDown = this.handleKeyDown.bind(this);
    this._keyboardEventsEnabled = false;
    this._root = null;
    this._mathObserver = null;
    this._mathRenderPending = false;
    // The locale the player publishes, once it answers; null until then. While
    // it is null the chrome follows the item's declared language, the
    // transitional precedence (published, else `model.language`, else `en-US`).
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;

    this._rerender = debounce(
      () => {
        if (this._model && this._session) {
          // The chrome speaks the locale the player publishes, else the item's
          // declared language, else `en-US`. Rendered once every catalog on the
          // render path holds it, so no English frame precedes it.
          const chromeLanguage = this._interfaceLocale ?? this._model.language;
          if (!isLocaleReady(chromeLanguage)) {
            void loadLocale(chromeLanguage).then(() => this._rerender());
            return;
          }
          var element = React.createElement(Main, {
            model: this._model,
            session: this._session,
            options: this._options,
            onChoiceChanged: this._onChange.bind(this),
            onShowCorrectToggle: this.onShowCorrectToggle.bind(this),
            eliminatedChoices: [...this._eliminatedChoices],
            language: chromeLanguage,
            ...resolveHeadingProps(this),
          });

          //TODO: aria-label is set in the _rerender because we need to change it when the model.choiceMode is updated. Consider revisiting the placement of the aria-label setting in the _rerender
          const i18n = catalogs.forLocale(chromeLanguage);
          this.setAttribute(
            'aria-label',
            i18n.t(this._model.choiceMode === 'radio' ? 'multipleChoiceQuestion' : 'multipleCorrectAnswerQuestion'),
          );
          this.setAttribute('role', 'region');
          // The host names the content language; the chrome roots (the
          // correct-answer toggle) carry the chrome language from the
          // `language` prop below.
          stampElementLanguage(this, this._model.language);

          this._initMathObserver();

          if (!this._root) {
            this._root = createRoot(this);
          }
          this._root.render(element);

          if (this._model.keyboardEventsEnabled === true && !this._keyboardEventsEnabled) {
            this.enableKeyboardEvents();
          }
        } else {
          log('skip');
        }
      },
      50,
      { leading: false, trailing: true },
    );

    // `_onChange` already wrote the session; only this dispatch is deferred to
    // the next tick, and `disconnectedCallback` flushes it.
    this._sessionNotifier = createSessionNotifier(this, () => {
      this.dispatchEvent(
        new SessionChangedEvent(
          this.tagName.toLowerCase(),
          isComplete(this._session, this._model, this.promptAudio, this),
        ),
      );
    });
    this._dispatchResponseChanged = () => this._sessionNotifier.notify();

    this._dispatchModelSet = debounce(
      () => {
        this.dispatchEvent(
          new ModelSetEvent(
            this.tagName.toLowerCase(),
            isComplete(this._session, this._model, this.promptAudio, this),
            this._model !== undefined,
          ),
        );
      },
      50,
      { leading: false, trailing: true },
    );
  }

  _scheduleMathRender: any = () => {
    if (this._mathRenderPending) return;
    this._mathRenderPending = true;

    requestAnimationFrame(() => {
      if (this._mathObserver) {
        this._mathObserver.disconnect();
      }
      log('render complete - render math');
      renderMath(this);
      this._mathRenderPending = false;
      setTimeout(() => {
        if (this._mathObserver) {
          this._mathObserver.observe(this, { childList: true, subtree: true });
        }
      }, 50);
    });
  };

  _initMathObserver() {
    if (this._mathObserver) return;
    this._mathObserver = new MutationObserver(this._scheduleMathRender);
    this._mathObserver.observe(this, { childList: true, subtree: true });
  }

  _disconnectMathObserver() {
    if (this._mathObserver) {
      this._mathObserver.disconnect();
      this._mathObserver = null;
    }
  }

  onShowCorrectToggle() {
    renderMath(this);
  }

  set model(s) {
    this._model = s;
    this._rerender();
    this._dispatchModelSet();
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

  get options() {
    return this._options;
  }

  set options(o) {
    this._options = o;
    this._rerender();
  }

  set baseHeadingLevel(level) {
    this._baseHeadingLevel = level;
    this._rerender();
  }

  set includeSrHeading(value) {
    this._includeSrHeading = value;
    this._rerender();
  }

  set session(s) {
    this._session = s;
    this._rerender();
  }

  _onChange(data) {
    if (data.selected && this._eliminatedChoices.has(String(data.value))) {
      return;
    }
    updateSessionValue(this._session, this._model.choiceMode, data);
    this._dispatchResponseChanged();
    this._rerender();
  }

  /**
   * The rendered choices, for the `answer-masking` support this element
   * declares. Each id is the choice's value.
   */
  pieSupportTargets(term) {
    if (term !== 'answer-masking') {
      return [];
    }

    return Array.from(this.querySelectorAll('.choice-input')).flatMap((container) => {
      const input = container.querySelector('input[type="radio"], input[type="checkbox"]');
      const content = container.querySelector('label');
      if (!input?.value || !content) {
        return [];
      }

      const { value } = input;
      return [
        {
          id: value,
          label: (content.querySelector('.prompt-label') ?? content).textContent.trim(),
          container,
          content,
          isSelected: () => this._isChoiceSelected(value),
          isEliminable: () =>
            this._model?.mode === 'gather' && !this._model.disabled && !this._isChoiceSelected(value),
          setEliminated: (eliminated) => this._setChoiceEliminated(value, eliminated),
        },
      ];
    });
  }

  _isChoiceSelected(value) {
    return (this._session?.value ?? []).some((selected) => String(selected) === value);
  }

  _setChoiceEliminated(value, eliminated) {
    if (eliminated === this._eliminatedChoices.has(value)) {
      return;
    }

    if (eliminated) {
      this._eliminatedChoices.add(value);
    } else {
      this._eliminatedChoices.delete(value);
    }
    this._rerender();
  }

  connectedCallback() {
    this._initMathObserver();
    this._initPlayerObserver();
    if (!this._disconnectInterfaceLocale) {
      this._disconnectInterfaceLocale = subscribeInterfaceLocale(
        this,
        (value) => {
          if (value?.locale && value.locale !== this._interfaceLocale) {
            this._interfaceLocale = value.locale;
            this._rerender();
          }
        },
      );
    }
    this._rerender();

    this._promptAudioWatcher.connect();
  }

  enableKeyboardEvents() {
    if (!this._keyboardEventsEnabled) {
      window.addEventListener('keydown', this._boundHandleKeyDown);
      this._keyboardEventsEnabled = true;
    }
  }

  _initPlayerObserver() {
    const player = this.closest('pie-player') || this.closest('pie-item-player');
    if (!player) return;

    this._playerObserver = new MutationObserver(() => {
      this._rerender();
    });
    this._playerObserver.observe(player, {
      attributes: true,
      attributeFilter: ['base-heading-level', 'baseheadinglevel', 'include-sr-heading', 'includesrheading'],
    });
  }

  _disconnectPlayerObserver() {
    if (this._playerObserver) {
      this._playerObserver.disconnect();
      this._playerObserver = null;
    }
  }

  disconnectedCallback() {
    flushSessionNotifiers(this);

    this._disconnectInterfaceLocale?.();
    this._disconnectInterfaceLocale = null;

    this._disconnectMathObserver();
    this._disconnectPlayerObserver();
    if (this._keyboardEventsEnabled) {
      window.removeEventListener('keydown', this._boundHandleKeyDown);
      this._keyboardEventsEnabled = false;
    }

    this._promptAudioWatcher.disconnect();

    this._rerender.cancel();
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }

  /**
   * Handles global keyboard events for selecting or toggling multiple-choice answers.
   * Maps keys (1-9, 0, a-j, A-J) to choices and updates the session state accordingly.
   * Ensures valid key presses toggle or select the appropriate choice based on the model.
   */
  handleKeyDown(event) {
    if (!this._model || !this._session) {
      return;
    }

    const { mode } = this._model;
    if (mode !== 'gather') {
      return;
    }

    const keyToIndex = (key) => {
      const numOffset = key >= '1' && key <= '9' ? key - '1' : key === '0' ? 9 : -1;
      const letterOffset = /^[a-jA-J]$/.test(key) ? key.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0) : -1;
      return numOffset >= 0 ? numOffset : letterOffset;
    };

    const choiceIndex = keyToIndex(event.key);

    if (choiceIndex === undefined || choiceIndex <= -1 || choiceIndex >= this._model.choices?.length) {
      return;
    }

    const currentValue = this._session.value || [];
    const choiceId = this._model.choices[choiceIndex].value;

    const alreadySelected = currentValue.includes(choiceId);
    const newValue = {
      value: choiceId,
      selected: this._model.choiceMode === 'radio' ? true : !alreadySelected,
      selector: 'Keyboard',
    };

    this._onChange(newValue);
  }
}
