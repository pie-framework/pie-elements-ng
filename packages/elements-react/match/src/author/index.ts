import { isEmpty, set } from '@pie-element/shared-lodash';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Configure, { type AuthorModel } from './configure.js';
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
import defaultValues from './defaults.js';
import { cloneDeep } from '@pie-element/shared-lodash';
import type { MatchConfiguration, MatchModel } from '../types.js';

const log = debug('pie-elements:match:configure');

export default class MatchConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _modelCopy?: AuthorModel;
  private _configuration: MatchConfiguration;
  hasPlayerAsParent?: boolean;

  static createDefaultModel = (model: Partial<MatchModel> = {}): AuthorModel => ({
    ...defaultValues.model,
    ...model,
  });

  constructor() {
    super();
    this._root = null;
    this._model = MatchConfigure.createDefaultModel();
    this._configuration = defaultValues.configuration;
  }

  set model(m: Partial<MatchModel>) {
    this._model = MatchConfigure.createDefaultModel(m);
    this._modelCopy = cloneDeep(this._model);

    this._render();
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

  set configuration(c: MatchConfiguration) {
    const newConfiguration = {
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

    /**
     * @Deprecated we added rows.inputConfiguration to handle the plugins in the editable html fields
     * if rows.inputConfiguration is not defined we try to default to the old enableImages flag
     * This flag 'enableImages' will be removed in the future
     */

    if (isEmpty(c?.rows?.inputConfiguration)) {
      // `this._configuration` is still `newConfiguration`
      set(newConfiguration.rows, 'inputConfiguration.image.disabled', !this._model?.enableImages);
      set(newConfiguration.rows, 'inputConfiguration.video.disabled', true);
      set(newConfiguration.rows, 'inputConfiguration.audio.disabled', true);
    }

    this._render();
  }

  onModelChanged(model: AuthorModel) {
    this._model = model;
    log('[onModelChanged]: ', this._model);
    this._render();
    this.dispatchEvent(new ModelUpdatedEvent(this._model));
  }

  onConfigurationChanged(config: MatchConfiguration) {
    this._configuration = config;
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
