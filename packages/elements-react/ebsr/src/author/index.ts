import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ModelUpdatedEvent } from '@pie-element/shared-configure-events';
import MultipleChoiceConfigure from '@pie-element/multiple-choice/author';
import { defaults } from '@pie-element/shared-lodash';
import Main, { type AuthorModel } from './main.js';
import { EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG } from '../private-tags.js';

import sensibleDefaults from './defaults.js';
import type { EbsrConfiguration, EbsrPart } from '../types.js';

const MODEL_UPDATED = ModelUpdatedEvent.TYPE;
const MC_TAG_NAME = EBSR_MULTIPLE_CHOICE_CONFIGURE_TAG;

class EbsrMCConfigure extends MultipleChoiceConfigure {}
const defineMultipleChoice = () => {
  if (!customElements.get(MC_TAG_NAME)) {
    customElements.define(MC_TAG_NAME, EbsrMCConfigure);
  }
};

defineMultipleChoice();

const prepareCustomizationObject = (config: EbsrConfiguration, model: AuthorModel) => {
  const configuration = defaults(config, sensibleDefaults.configuration);

  return {
    configuration,
    model,
  };
};

const { model: modelDefault } = sensibleDefaults || {};

/** A model handed to the author, whose parts may be incomplete. */
type AuthorModelInput = Omit<Partial<AuthorModel>, 'partA' | 'partB'> & {
  partA?: Partial<EbsrPart>;
  partB?: Partial<EbsrPart>;
};

export default class EbsrConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: EbsrConfiguration;

  static createDefaultModel = (
    { partA = {}, partB = {}, ...model }: AuthorModelInput = {},
    defaults: AuthorModel = modelDefault,
  ): AuthorModel => ({
    ...defaults,
    ...model,
    partA: {
      ...defaults.partA,
      ...partA,
      choicesLayout:
        partA.choicesLayout || (partA.verticalMode === false && 'horizontal') || defaults.partA.choicesLayout,
    },
    partB: {
      ...defaults.partB,
      ...partB,
      choicesLayout:
        partB.choicesLayout || (partB.verticalMode === false && 'horizontal') || defaults.partB.choicesLayout,
    },
  });

  constructor() {
    super();
    this._root = null;

    this._model = EbsrConfigure.createDefaultModel();

    this._configuration = sensibleDefaults.configuration;
    this.onConfigurationChanged = this.onConfigurationChanged.bind(this);
  }

  set model(m: AuthorModelInput) {
    this._model = EbsrConfigure.createDefaultModel(m, this._model);

    this._render();
  }

  dispatchModelUpdated(reset?: boolean) {
    const resetValue = !!reset;

    this.dispatchEvent(new ModelUpdatedEvent(this._model, resetValue));
  }

  onModelChanged = (m: AuthorModel, reset?: boolean) => {
    this._model = EbsrConfigure.createDefaultModel(m, this._model);

    this.dispatchModelUpdated(reset);
    this._render();
  };

  set configuration(c: EbsrConfiguration) {
    const info = prepareCustomizationObject(c, this._model);

    const newConfiguration = {
      ...sensibleDefaults.configuration,
      ...info.configuration,
    };

    this._configuration = newConfiguration;

    // if language:enabled is true, then the corresponding default item model should include a language value;
    // if it is false, then the language field should be omitted from the item model.
    // if a default item model includes a language value (e.g., en_US) and the corresponding authoring view settings have language:settings = true,
    // then (a) language:enabled should also be true, and (b) that default language value should be represented in languageChoices[] (as a key).
    if (newConfiguration?.language?.enabled) {
      if (newConfiguration?.languageChoices?.options?.length) {
        this._model.language = newConfiguration?.languageChoices.options[0].value;
      }
    } else if (newConfiguration.language.settings && this._model.language) {
      newConfiguration.language.enabled = true;

      if (!newConfiguration.languageChoices.options || !newConfiguration.languageChoices.options.length) {
        newConfiguration.languageChoices.options = [];
      }

      // check if the language is already included in the languageChoices.options array
      // and if not, then add it.
      if (!newConfiguration.languageChoices.options.find((option) => option.value === this._model.language)) {
        newConfiguration.languageChoices.options.push({
          value: this._model.language,
          label: this._model.language,
        });
      }
    } else {
      delete this._model.language;
    }

    this._render();
  }

  onConfigurationChanged(c: EbsrConfiguration) {
    this._configuration = prepareCustomizationObject(c, this._model).configuration;

    if (this._model) {
      this.onModelChanged(this._model);
    }

    this._render();
  }

  onModelUpdated = (event: Event) => {
    const e = event as ModelUpdatedEvent;
    const target = e.target as HTMLElement | null;

    if (target === this) {
      return;
    }

    e.preventDefault();
    e.stopImmediatePropagation();

    const part = target && target.getAttribute('data-part');

    if (part) {
      if (e.update) {
        this._model[`part${part}` as 'partA' | 'partB'] = e.update;
      }

      this.dispatchEvent(new ModelUpdatedEvent(this._model));
    }
  };

  connectedCallback() {
    this.addEventListener(MODEL_UPDATED, this.onModelUpdated);
    this._render();
  }

  _render() {
    let element = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      multipleChoiceTagName: MC_TAG_NAME,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(element);
  }

  disconnectedCallback() {
    this.removeEventListener(MODEL_UPDATED, this.onModelUpdated);
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
