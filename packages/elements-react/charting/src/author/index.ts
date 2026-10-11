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
import debug from 'debug';
import Configure, { type AuthorModel } from './configure.js';
import defaultValues from './defaults.js';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import type { ChartingConfiguration, ChartingModel } from '../types.js';

const log = debug('pie-elements:graphing:configure');

export default class GraphLinesConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: ChartingConfiguration;

  static createDefaultModel = (model: Partial<ChartingModel> = {}): AuthorModel => ({
    ...defaultValues.model,
    ...model,
  });

  constructor() {
    super();
    this._root = null;
    this._model = GraphLinesConfigure.createDefaultModel();
    this._configuration = defaultValues.configuration;
  }

  set model(m: Partial<ChartingModel>) {
    this._model = GraphLinesConfigure.createDefaultModel(m);
    this._render();
  }

  set configuration(c: ChartingConfiguration) {
    const newConfiguration: ChartingConfiguration = {
      ...defaultValues.configuration,
      ...c,
    };

    this._configuration = newConfiguration;

    // if language:enabled is true, then the corresponding default item model should include a language value;
    // if it is false, then the language field should be omitted from the item model.
    // if a default item model includes a language value (e.g., en_US) and the corresponding authoring view settings have language:settings = true,
    // then (a) language:enabled should also be true, and (b) that default language value should be represented in languageChoices[] (as a key).
    // newConfiguration is this._configuration. Its `language` throws when absent, and `languageChoices` is
    // assumed present, as untyped.
    if (newConfiguration?.language?.enabled) {
      if (newConfiguration?.languageChoices?.options?.length) {
        this._model.language = newConfiguration?.languageChoices.options[0].value;
      }
    } else if (newConfiguration.language!.settings && this._model.language) {
      const language = this._model.language;
      const languageChoices = newConfiguration.languageChoices!;

      newConfiguration.language!.enabled = true;

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

    this._render();
  }

  onModelChanged(model: AuthorModel) {
    this._model = model;
    this._render();

    log('[onModelChanged]: ', this._model);

    this.dispatchEvent(new ModelUpdatedEvent(this._model));
  }

  onConfigurationChanged(config: ChartingConfiguration) {
    this._configuration = config;
    this._render();
  }

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
      queueMicrotask(() => {
        renderMath(this);
      });
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