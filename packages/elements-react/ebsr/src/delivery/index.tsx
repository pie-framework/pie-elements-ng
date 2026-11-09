// @ts-nocheck

import { SessionChangedEvent } from '@pie-element/shared-player-events';
import MultipleChoice from '@pie-element/multiple-choice';
import { get } from '@pie-element/shared-lodash';
import debug from 'debug';
import { createUniqueId } from '@pie-lib/render-ui';
import {
  isLocaleReady,
  loadLocale,
  stampElementLanguage,
  subscribeInterfaceLocale,
} from '@pie-element/shared-i18n';
import { catalogs } from '../i18n/index.js';
import { EBSR_MULTIPLE_CHOICE_TAG } from '../private-tags.js';

const SESSION_CHANGED = SessionChangedEvent.TYPE;
const MC_TAG_NAME = EBSR_MULTIPLE_CHOICE_TAG;
const log = debug('pie-elements:ebsr');

class EbsrMC extends MultipleChoice {}

const defineMultipleChoice = () => {
  if (!customElements.get(MC_TAG_NAME)) {
    customElements.define(MC_TAG_NAME, EbsrMC);
  }
};

defineMultipleChoice();

const isNonEmptyArray = (a) => Array.isArray(a) && a.length > 0;

export const isSessionComplete = (session) => {
  const a = get(session, 'value.partA.value');
  const b = get(session, 'value.partB.value');

  return isNonEmptyArray(a) && isNonEmptyArray(b);
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

export default class Ebsr extends HTMLElement {
  /**
   * The AfA PNP 3.0 supports this element takes. Its parts declare the same, and
   * this element answers for them.
   */
  static pieSupports = Object.freeze(['answer-masking']);

  constructor() {
    super();
    this._model = {};
    this._session = {};
    // The locale the player publishes; null until it answers, and then the chrome follows the
    // declared language (permanent, see the PRD's invariant).
    this._interfaceLocale = null;
    this._unsubscribeInterfaceLocale = null;
  }

  /** The item's declared language, read where ebsr has always read it. */
  get declaredLanguage() {
    return this._model?.language ?? this._model?.partA?.language;
  }

  chromeLanguage() {
    return this._interfaceLocale ?? this.declaredLanguage;
  }

  // The item-level rules nest under a class only this element carries, as each part's rules nest
  // under its own layout, so they style this item and no other.
  cssScope = createUniqueId('ebsr-extra-css-rules');

  onSessionUpdated: any = (e) => {
    if (e.target === this) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const part = e.target.getAttribute('data-part');

    if (part) {
      const key = `part${part.toUpperCase()}`;

      if (e.update) {
        this._model[key] = e.update;
      }
      //TODO: accessing a private property here. The session event should contain the update in future to prevent this.
      this.dispatchSessionChanged(e.srcElement._session, key);
    }
  };

  set model(m) {
    this._model = m;
    this._updateRegionName();
    this._updateExtraCSSRules();

    customElements.whenDefined(MC_TAG_NAME).then(() => this.setPartModels());
  }

  /** The parts' models carry their labels in the chrome language, so they wait until it is resident. */
  setPartModels() {
    const language = this.chromeLanguage();
    if (!isLocaleReady(language)) {
      void loadLocale(language).then(() => this.setPartModels());
      return;
    }
    this.setPartModel(this.partA, 'partA');
    this.setPartModel(this.partB, 'partB');
  }

  partLabel(key) {
    if (!this._model?.partLabels) {
      return undefined;
    }
    const letters = this._model.partLabelType === 'Letters';
    const index = key === 'partA' ? (letters ? 'A' : '1') : letters ? 'B' : '2';

    return catalogs.forLocale(this.chromeLanguage()).t('part', { index });
  }

  set session(s) {
    this._session = s;

    customElements.whenDefined(MC_TAG_NAME).then(() => {
      this.setPartSession(this.partA, 'partA');
      this.setPartSession(this.partB, 'partB');
    });
  }

  get session() {
    return this._session;
  }

  setPartModel(part, key) {
    if (this._model && this._model[key] && part) {
      const { mode } = this._model;

      part.model = {
        ...this._model[key],
        // A part that declares no language takes the item's.
        language: this._model[key].language ?? this.declaredLanguage,
        mode,
        keyMode: this._model[key].choicePrefix,
        partLabel: this.partLabel(key),
        // A hold on the item holds both parts.
        ...(this._model.autoplayAudioHeld && { autoplayAudioHeld: true }),
      };

      // Parts of an EBSR item should not render their own SR headings —
      // the EBSR element itself provides the item-level heading.
      const { includeSrHeading, baseHeadingLevel } = getPlayerAttributes(this);
      part.includeSrHeading = includeSrHeading;
      part.baseHeadingLevel = baseHeadingLevel;
    }
  }

  setPartSession(part, key) {
    if (this._session && this._model && part) {
      // A part records each answer in the session object it is given, so this session holds
      // that object and is current before the part's session-changed reaches this element.
      const partSession = this._session.value?.[key] ?? { id: key };
      this._session.value = { ...this._session.value, [key]: partSession };
      part.session = partSession;
    }
  }

  dispatchSessionChanged(partSession, key) {
    this._session.value = {
      ...this._session.value,
      [key]: partSession,
    };

    log('[onSessionChanged] session: ', this._session);
    const complete = isSessionComplete(this._session);
    this.dispatchEvent(new SessionChangedEvent(this.tagName.toLowerCase(), complete));
  }

  /** Both parts' choices, with ids prefixed by the part since the parts share choice values. */
  pieSupportTargets(term) {
    return [
      ['a', this.partA],
      ['b', this.partB],
    ].flatMap(([part, element]) =>
      typeof element?.pieSupportTargets === 'function'
        ? element.pieSupportTargets(term).map((target) => ({ ...target, id: `${part}-${target.id}` }))
        : [],
    );
  }

  get partA() {
    return this.querySelector(`${MC_TAG_NAME}[data-part="a"]`);
  }

  get partB() {
    return this.querySelector(`${MC_TAG_NAME}[data-part="b"]`);
  }

  connectedCallback() {
    // The parts subscribe on their own; their requests bubble through this element to the player.
    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = subscribeInterfaceLocale(this, ({ locale }) => {
      if (locale === this._interfaceLocale) return;
      this._interfaceLocale = locale;
      this._updateRegionName();
      customElements.whenDefined(MC_TAG_NAME).then(() => this.setPartModels());
    });
    this._render();
    this._initPlayerObserver();
    this.addEventListener(SESSION_CHANGED, this.onSessionUpdated);
  }

  disconnectedCallback() {
    this._unsubscribeInterfaceLocale?.();
    this._unsubscribeInterfaceLocale = null;
    this._disconnectPlayerObserver();
    this.removeEventListener(SESSION_CHANGED, this.onSessionUpdated);
  }

  _initPlayerObserver() {
    const player = this.closest('pie-player') || this.closest('pie-item-player');
    if (!player) return;

    this._playerObserver = new MutationObserver(() => {
      this._render();
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

  /** The item-level name in the chrome language; it is renamed once that locale loads. */
  get regionName() {
    return catalogs.forLocale(this.chromeLanguage(), () => this._updateRegionName()).t('twoPartQuestion');
  }

  /** A model set can change the language; the heading is renamed in place so the parts stay mounted. */
  _updateRegionName() {
    if (!this.isConnected) {
      return;
    }

    stampElementLanguage(this, this.declaredLanguage);
    this.setAttribute('aria-label', this.regionName);

    const heading = this.querySelector(':scope > .srOnly');
    if (heading) {
      heading.textContent = this.regionName;
    }
  }

  /** The model usually arrives after the element connects, so the rules are rewritten on every model set. */
  _updateExtraCSSRules() {
    const style = this.querySelector(':scope > style[data-extra-css-rules]');
    if (!style) {
      return;
    }

    const rules = this._model?.extraCSSRules?.rules;
    style.textContent = rules ? `.${this.cssScope} { ${rules} }` : '';
  }

  _render() {
    const language = this.chromeLanguage();
    if (!isLocaleReady(language)) {
      void loadLocale(language).then(() => this.isConnected && this._render());
      return;
    }

    stampElementLanguage(this, this.declaredLanguage);
    this.setAttribute('aria-label', this.regionName);
    this.role = 'region';
    this.classList.add(this.cssScope);

    const { baseHeadingLevel: ebsrLevel, includeSrHeading } = getPlayerAttributes(this);
    const headingTag = ebsrLevel ? `h${Math.min(6, ebsrLevel)}` : 'h2';
    const srHeading = includeSrHeading ? `<${headingTag} class="srOnly">${this.regionName}</${headingTag}>` : '';

    this.innerHTML = `
      <style>
        .srOnly {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        left: -10000px;
        top: auto;
      }
      </style>
      <style data-extra-css-rules></style>
        ${srHeading}
        <${MC_TAG_NAME} data-part="a"></${MC_TAG_NAME}>
        <${MC_TAG_NAME} data-part="b"></${MC_TAG_NAME}>
    `;
    this._updateExtraCSSRules();

    // when item is re-rendered (due to connectedCallback), if the custom element is already defined,
    // we need to set the model and session, otherwise the setters are not reached again
    if (customElements.get(MC_TAG_NAME)) {
      this.setPartModels();
      this.setPartSession(this.partA, 'partA');
      this.setPartSession(this.partB, 'partB');
    }
  }
}
