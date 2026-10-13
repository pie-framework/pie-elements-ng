import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Configure, { type AuthorModel } from './configure.js';
import { isEmpty } from '@pie-element/shared-lodash';
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
import debug from 'debug';

import defaults from './defaults.js';
import type { MathInlineConfiguration, MathInlineModel, MathInlineResponse } from '../types.js';

const log = debug('pie-elements:math-inline:configure');

export default class MathInlineConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: MathInlineConfiguration;

  static createDefaultModel = (model: Partial<MathInlineModel> = {}): AuthorModel => {
    // making sure that defaults are set
    if (!isEmpty(model.responses)) {
      model.responses = (model.responses as MathInlineResponse[]).map((correctResponse) => ({
        ...correctResponse,
        validation: correctResponse.validation || defaults.model.validationDefault,
        allowTrailingZeros: correctResponse.allowTrailingZeros || defaults.model.allowTrailingZerosDefault,
        ignoreOrder: correctResponse.ignoreOrder || defaults.model.ignoreOrderDefault || false,
      }));
    }

    return { ...defaults.model, ...model };
  };

  constructor() {
    super();
    this._root = null;
    this._model = MathInlineConfigure.createDefaultModel();
    this._configuration = defaults.configuration;
  }

  set model(m: Partial<MathInlineModel>) {
    this._model = MathInlineConfigure.createDefaultModel(m);
    this._render();
  }

  set configuration(c: MathInlineConfiguration) {
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
    } else if (
      (newConfiguration.language as NonNullable<MathInlineConfiguration['language']>).settings &&
      this._model.language
    ) {
      // `language` and `languageChoices` come from the defaults when the host leaves them out.
      const language = this._configuration.language as NonNullable<MathInlineConfiguration['language']>;
      const languageChoices = this._configuration.languageChoices as NonNullable<
        MathInlineConfiguration['languageChoices']
      >;
      const modelLanguage = this._model.language;

      language.enabled = true;

      if (!languageChoices.options || !languageChoices.options.length) {
        languageChoices.options = [];
      }

      // check if the language is already included in the languageChoices.options array
      // and if not, then add it.
      if (!languageChoices.options.find(option => option.value === modelLanguage)) {
        languageChoices.options.push({
          value: modelLanguage,
          label: modelLanguage,
        });
      }
    } else {
      delete this._model.language;
    }

    this._render();
  }

  onModelChanged(model: AuthorModel) {
    this._model = model;
    log('[onModelChanged]: ', this._model);
    this._render();

    this.dispatchEvent(new ModelUpdatedEvent(this._model));
  }

  onConfigurationChanged(c: MathInlineConfiguration) {
    this._configuration = c;

    if (this._model) {
      this.onModelChanged(this._model);
    }

    this._render();
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

  _render() {
    if (this._model) {
      const el = React.createElement(Configure, {
        onModelChanged: this.onModelChanged.bind(this),
        onConfigurationChanged: this.onConfigurationChanged.bind(this),
        model: this._model,
        configuration: this._configuration,
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
    }
  }

  connectedCallback() {
    this._render();
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
