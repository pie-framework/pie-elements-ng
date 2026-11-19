// @ts-nocheck

import { ModelSetEvent } from '@pie-element/shared-player-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import React from 'react';
import { createRoot } from 'react-dom/client';

import StimulusTabs from './stimulus-tabs.js';
import { catalogs } from '../i18n/index.js';

function getBaseHeadingLevel(element) {
  const player =
    element.closest('pie-player') ||
    element.closest('pie-item-player');

  if (player) {
    let raw = player.baseHeadingLevel;

    // fallback in case someone sets via HTML attribute manually
    if (raw == null) {
      raw =
        player.getAttribute('base-heading-level') ??
        player.getAttribute('baseheadinglevel');
    }

    const playerLevel = parseInt(raw, 10);

    if (Number.isFinite(playerLevel) && playerLevel >= 1 && playerLevel <= 6) {
      return playerLevel;
    }
  }

  return undefined;
}

export default class PiePassage extends HTMLElement {
  constructor() {
    super();
    this._model = {
      passages: [],
    };
    this._session = null;
    this._root = null;
    this._mathObserver = null;
    this._mathRenderPending = false;
    this._playerObserver = null;
    // The locale the player publishes, once it answers; until then the chrome
    // follows the item's declared language, else `en-US`.
    this._interfaceLocale = null;
    this._disconnectInterfaceLocale = null;
  }

  setLangAttribute() {
    // The element asserts the language the item declares, canonicalized, and
    // nothing when it declares none: an `en` default claimed undeclared
    // content — Spanish items included — for English.
    stampElementLanguage(this, this._model?.language ?? null);
  }

  _scheduleMathRender: any = () => {
    if (this._mathRenderPending) return;
    this._mathRenderPending = true;

    requestAnimationFrame(() => {
      if (this._mathObserver) {
        this._mathObserver.disconnect();
      }
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

  set model(s) {
    this._model = s;
    this.dispatchEvent(new ModelSetEvent(this.tagName.toLowerCase(), this._session, !!this._model));
    this.setLangAttribute();

    this._render();
  }

  set session(s) {
    this._session = s;
  }

  connectedCallback() {
    this.setAttribute('role', 'region');
    this._initMathObserver();
    this._initPlayerObserver();
    if (!this._disconnectInterfaceLocale) {
      this._disconnectInterfaceLocale = subscribeInterfaceLocale(this, (value) => {
        if (value?.locale && value.locale !== this._interfaceLocale) {
          this._interfaceLocale = value.locale;
          this._render();
        }
      });
    }
    this._render();
  }

  _render() {
    const { passages = [] } = this._model;
    const language = this._interfaceLocale ?? this._model.language;
    if (!isLocaleReady(language)) {
      void loadLocale(language).then(() => this._render());
      return;
    }
    this.setAttribute('aria-label', catalogs.forLocale(language).t('passageRegion'));

    if (passages.length > 0) {
      const passagesTabs = passages.map((passage, index) => ({
        id: index,
        ...passage,
      }));

      const elem = React.createElement(StimulusTabs, {
        tabs: passagesTabs,
        model: this._model,
        language,
        baseHeadingLevel: getBaseHeadingLevel(this),
      });

      if (!this._root) {
        this._root = createRoot(this);
      }
      this._root.render(elem);

      this._initMathObserver();
    }
  }

  _initPlayerObserver() {
    const player = this.closest('pie-player') || this.closest('pie-item-player');
    if (!player) return;

    this._playerObserver = new MutationObserver(() => {
      this._render();
    });
    this._playerObserver.observe(player, { attributes: true, attributeFilter: ['base-heading-level'] });
  }

  _disconnectPlayerObserver() {
    if (this._playerObserver) {
      this._playerObserver.disconnect();
      this._playerObserver = null;
    }
  }

  disconnectedCallback() {
    this._disconnectMathObserver();
    this._disconnectInterfaceLocale?.();
    this._disconnectInterfaceLocale = null;
    this._disconnectPlayerObserver();
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
