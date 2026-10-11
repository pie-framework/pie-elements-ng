import {
  DeleteImageEvent,
  DeleteSoundEvent,
  InsertImageEvent,
  InsertSoundEvent,
  ModelUpdatedEvent,
  type DeleteDone,
  type ImageHandler,
  type SoundHandler,
} from '@pie-element/shared-configure-events';

import React from 'react';
import { createRoot, type Root as ReactRoot } from 'react-dom/client';
import debug from 'debug';

import Root, { type AuthorModel } from './root.js';
import sensibleDefaults from './defaults.js';
import type { DrawingResponseConfiguration, DrawingResponseModel } from '../types.js';

const log = debug('hotspot:configure');

export default class DrawableResponseConfigure extends HTMLElement {
  private _root: ReactRoot | null;
  private _model: AuthorModel;
  private _configuration: DrawingResponseConfiguration;

  static createDefaultModel = (
    model: Partial<DrawingResponseModel> = {},
    config?: DrawingResponseConfiguration,
  ): AuthorModel => {
    const defaultModel: AuthorModel = {
      ...sensibleDefaults.model,
      ...model,
    };

    // if configuration.withRubric.forceEnabled is true, then we update the model
    // without triggering the Model Updated event (for more details, check documentation)
    if (config?.withRubric?.forceEnabled && !defaultModel.rubricEnabled) {
      defaultModel.rubricEnabled = true;
    }

    return defaultModel;
  };

  constructor() {
    super();
    this._root = null;
    const configuration: DrawingResponseConfiguration = sensibleDefaults.configuration;
    this._configuration = configuration;

    // if configuration.withRubric.forceEnabled is true, then we
    // update the configuration (we do not want to display the toggle in the Settings Panel)
    if (configuration.withRubric?.forceEnabled) {
      configuration.withRubric.settings = false;
    }

    this._model = DrawableResponseConfigure.createDefaultModel({}, this._configuration);
    this.onModelChanged = this.onModelChanged.bind(this);
  }

  set model(s: Partial<DrawingResponseModel>) {
    this._model = DrawableResponseConfigure.createDefaultModel(s, this._configuration);
    this._render();
  }

  set configuration(c: DrawingResponseConfiguration) {
    const newConfiguration = {
      ...sensibleDefaults.configuration,
      ...c,
    };

    this._configuration = newConfiguration;

    const { withRubric = {} } = c || {};

    // if configuration.withRubric.forceEnabled is true, then we update the model
    // without triggering the Model Updated event (for more details, check documentation)
    // and also update the configuration (we do not want to display the toggle in the Settings Panel)
    if (withRubric?.forceEnabled) {
      newConfiguration.withRubric.settings = false;

      if (!this._model.rubricEnabled) {
        this._model.rubricEnabled = true;
      }
    }

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
      if (!newConfiguration.languageChoices.options.find(option => option.value === this._model.language)) {
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

  dispatchModelUpdated(reset?: boolean) {
    const resetValue = !!reset;

    this.dispatchEvent(new ModelUpdatedEvent(this._model, resetValue));
  }

  onModelChanged = (m: AuthorModel, reset?: boolean) => {
    this._model = m;
    this.dispatchModelUpdated(reset);
    this._render();
  };

  onConfigurationChanged = (c: DrawingResponseConfiguration) => {
    this._configuration = c;

    this._render();
  };

  insertImage = (handler: ImageHandler) => {
    this.dispatchEvent(new InsertImageEvent(handler));
  };

  onDeleteImage = (src: string, done: DeleteDone) => {
    this.dispatchEvent(new DeleteImageEvent(src, done));
  };

  insertSound(handler: SoundHandler) {
    this.dispatchEvent(new InsertSoundEvent(handler));
  }

  onDeleteSound(src: string, done: DeleteDone) {
    this.dispatchEvent(new DeleteSoundEvent(src, done));
  }

  _render() {
    log('_render');

    let element = React.createElement(Root, {
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
      imageSupport: {
        add: this.insertImage,
        delete: this.onDeleteImage,
      },
      uploadSoundSupport: {
        add: this.insertSound.bind(this),
        delete: this.onDeleteSound.bind(this),
      },
    });
    if (!this._root) {
      this._root = createRoot(this);
    }
    this._root.render(element);
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
