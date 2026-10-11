import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  ModelUpdatedEvent,
  DeleteImageEvent,
  InsertImageEvent,
  InsertSoundEvent,
  DeleteSoundEvent,
  type DeleteDone,
  type ImageHandler,
  type SoundHandler,
} from '@pie-element/shared-configure-events';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

import Main, { type AuthorModel } from './main.js';

import defaults from './defaults.js';
import type { CategorizeConfiguration, CategorizeModel } from '../types.js';

export default class CategorizeConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: CategorizeConfiguration;

  static createDefaultModel = (model: Partial<CategorizeModel> = {}): AuthorModel => ({
    ...defaults.model,
    ...model,
  });

  // PD-2960: make sure we don't have alternates in model or possibility to add them (temporary solution)
  // this function is used in controller, too
  static disableAlternateResponses = (m: Partial<CategorizeModel>) => {
    let { correctResponse } = m || ({} as Partial<CategorizeModel>);
    correctResponse = correctResponse || [];
    const mappedCorrectResponse = correctResponse.map((cr) => {
      const { alternateResponses, ...response } = cr;
      return response;
    });
    return {
      ...m,
      correctResponse: mappedCorrectResponse,
      allowAlternateEnabled: false,
    };
  };

  constructor() {
    super();
    this._root = null;
    this._model = CategorizeConfigure.createDefaultModel();
    this._configuration = defaults.configuration;
  }

  set model(m: Partial<CategorizeModel>) {
    this._model = CategorizeConfigure.createDefaultModel(m);

    if (m.choices && m.maxAnswerChoices !== undefined && m.choices.length >= m.maxAnswerChoices) {
      this._model.maxAnswerChoices = m.choices.length;
      console.warn("Max Answer Choices can't be less than choices length!");
    }

    this.render();
  }

  set configuration(c: CategorizeConfiguration) {
    const newConfiguration = {
      ...defaults.configuration,
      ...c,
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
      // `this._configuration` is `newConfiguration`
      newConfiguration.language.enabled = true;

      if (!newConfiguration.languageChoices.options || !newConfiguration.languageChoices.options.length) {
        newConfiguration.languageChoices.options = [];
      }

      const language = this._model.language;

      // check if the language is already included in the languageChoices.options array
      // and if not, then add it.
      if (!newConfiguration.languageChoices.options.find((option) => option.value === language)) {
        newConfiguration.languageChoices.options.push({
          value: language,
          label: language,
        });
      }
    } else {
      delete this._model.language;
    }

    this.render();
  }

  onModelChanged(m: AuthorModel) {
    this._model = m;

    this.render();
    this.dispatchEvent(new ModelUpdatedEvent(this._model, false));
  }

  onConfigurationChanged(c: CategorizeConfiguration) {
    this._configuration = c;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  /**
   *
   * @param {done, progress, file} handler
   */
  insertImage(handler: ImageHandler) {
    this.dispatchEvent(new InsertImageEvent(handler));
  }

  onDeleteImage(src: string, done: DeleteDone) {
    this.dispatchEvent(new DeleteImageEvent(src, done));
  }

  insertSound(handler: SoundHandler) {
    this.dispatchEvent(new InsertSoundEvent(handler));
  }

  onDeleteSound(src: string, done: DeleteDone) {
    this.dispatchEvent(new DeleteSoundEvent(src, done));
  }

  render() {
    const el = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged.bind(this),
      onConfigurationChanged: this.onConfigurationChanged.bind(this),
      imageSupport: {
        add: this.insertImage.bind(this),
        delete: this.onDeleteImage.bind(this),
      },
      uploadSoundSupport: {
        add: this.insertSound.bind(this),
        delete: this.onDeleteSound.bind(this),
      },
    });

    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(el);

    setTimeout(() => {
      renderMath(this);
    }, 0);
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
