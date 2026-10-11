import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Main, { type AuthorModel } from './main.js';
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
import defaultValues from './defaults.js';
import type { FractionModelConfiguration, FractionModelModel } from '../types.js';

export default class FractionModelConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: FractionModelConfiguration;
  // Declared only: neither is set until resetModelAfterConfigurationIsSet() runs, and nothing sets `_modelCopy`.
  private declare _modelCopy?: AuthorModel;
  declare hasPlayerAsParent?: boolean;

  /**
   * This function makes sure you set the default values on the model
   * @param model
   * @returns model
   */
  static createDefaultModel = (model: Partial<FractionModelModel> = {}): AuthorModel => {
    const c = defaultValues.configuration;
    let language = model.language || '';

    if (!language && c.language && c.language.enabled) {
      if (c.languageChoices?.options?.length) {
        language = c.languageChoices.options[0].value;
      }
    }

    const normalizedModel = {
      ...defaultValues.model,
      ...model,
      language,
    };

    return normalizedModel;
  };

  constructor() {
    super();
    this._root = null;
    this._model = FractionModelConfigure.createDefaultModel();
    this._configuration = defaultValues.configuration;
  }

  set model(m: Partial<FractionModelModel>) {
    this._model = FractionModelConfigure.createDefaultModel(m);
    this.render();
  }

  set configuration(c: FractionModelConfiguration) {
    const newConfiguration: FractionModelConfiguration = {
      ...defaultValues.configuration,
      ...c,
    };
    this._configuration = newConfiguration;

    this.resetModelAfterConfigurationIsSet();

    // if language:enabled is true, then the corresponding default item model should include a language value;
    // if it is false, then the language field should be omitted from the item model.
    // if a default item model includes a language value (e.g., en_US) and the corresponding authoring view settings have language:settings = true,
    // then (a) language:enabled should also be true, and (b) that default language value should be represented in languageChoices[] (as a key).
    if (newConfiguration?.language?.enabled) {
      if (newConfiguration?.languageChoices?.options?.length) {
        this._model.language = newConfiguration?.languageChoices.options[0].value;
      }
    } else if (newConfiguration.language!.settings && this._model.language) {
      // this._configuration is newConfiguration. Its `language` throws when absent, and `languageChoices` is
      // assumed present, as untyped.
      const language = this._model.language;
      const languageChoices = this._configuration.languageChoices!;

      this._configuration.language!.enabled = true;

      if (!languageChoices.options || !languageChoices.options.length) {
        languageChoices.options = [];
      }

      // check if the language is already included in the languageChoices.options array
      // and if not, then add it.
      if (!languageChoices.options.find((option) => option.value === language)) {
        languageChoices.options.push({
          value: language,
          label: language,
        });
      }
    } else {
      delete this._model.language;
    }
    this.render();
  }

  resetModelAfterConfigurationIsSet = () => {
    // In environments that use pie-player-components, model is set before configuration.
    // This is the reason why sometimes the model gets altered non-reversible
    // (altered using default configuration instead of client configuration, because at that point client configuration was not set yet)
    // Therefore, in such environments, we will make sure to keep a modelCopy (initialised in set model) and use it to reset
    // the model in set configuration (resetModelAfterConfigurationIsSet) if set configuration is ever called
    const pieAuthors = document.querySelectorAll('pie-author');
    this.hasPlayerAsParent = Array.from(pieAuthors).some((author) => author.contains(this));

    if (this.hasPlayerAsParent) {
      if (this._modelCopy) {
        this._model = this._modelCopy;
      } else {
        delete this._modelCopy;
      }
    }
  };

  connectedCallback() {
    this.render();
  }

  modelChanged(m: AuthorModel) {
    this._model = m;
    // This passed `true` to dispatchEvent as a second argument, which ignores it.
    this.dispatchEvent(new ModelUpdatedEvent(this._model));
    this.render();
  }

  onChange = (o: Partial<AuthorModel>) => {
    this._model = { ...this._model, ...o };
    this.dispatchEvent(new ModelUpdatedEvent(this._model));
    this.render();
  };

  onConfigurationChanged(c: FractionModelConfiguration) {
    this._configuration = c;
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
    if (this._model) {
      const el = React.createElement(Main, {
        model: this._model,
        configuration: this._configuration,
        onConfigurationChanged: this.onConfigurationChanged,
        onChange: this.onChange,
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

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
