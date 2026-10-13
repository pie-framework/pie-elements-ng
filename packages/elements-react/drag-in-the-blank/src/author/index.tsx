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

import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import Main, { type AuthorModel } from './main.js';
import debug from 'debug';
import { defaults } from '@pie-element/shared-lodash';

import sensibleDefaults from './defaults.js';
import { processMarkup, createSlateMarkup } from './markupUtils.js';
import type { DragInTheBlankConfiguration, DragInTheBlankModel } from '../types.js';

/** The configuration once `sensibleDefaults.configuration` has filled the keys it carries. */
type AuthorConfiguration = DragInTheBlankConfiguration &
  Required<Pick<DragInTheBlankConfiguration, 'language' | 'languageChoices'>>;

const log = debug('multiple-choice:configure');

export default class DragInTheBlank extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: DragInTheBlankConfiguration;
  private _disableSidePanel?: boolean;

  static prepareModel = (model: Partial<DragInTheBlankModel> = {}): AuthorModel => {
    const joinedObj = {
      ...sensibleDefaults.model,
      ...model,
    };
    const slateMarkup =
      model.slateMarkup || createSlateMarkup(joinedObj.markup, joinedObj.choices, joinedObj.correctResponse);
    const processedMarkup = processMarkup(slateMarkup);

    return {
      ...joinedObj,
      slateMarkup,
      markup: processedMarkup.markup,
      correctResponse: processedMarkup.correctResponse,
    };
  };

  constructor() {
    super();
    this._root = null;
    this._model = DragInTheBlank.prepareModel();
    this._configuration = sensibleDefaults.configuration;
    this.onModelChanged = this.onModelChanged.bind(this);
    this.onConfigurationChanged = this.onConfigurationChanged.bind(this);
  }

  set model(m: Partial<DragInTheBlankModel>) {
    const formModel = {
      ...m,
      markup: `<div>${m.markup || sensibleDefaults.model.markup}</div>`,
    };

    this._model = DragInTheBlank.prepareModel(formModel);
    this._render();
  }

  set configuration(c: DragInTheBlankConfiguration) {
    const newConfiguration = defaults(c, sensibleDefaults.configuration) as AuthorConfiguration;

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

  set disableSidePanel(s: boolean) {
    this._disableSidePanel = s;
    this._render();
  }

  dispatchModelUpdated(reset?: boolean) {
    const resetValue = !!reset;

    this.dispatchEvent(new ModelUpdatedEvent(this._model, resetValue));
  }

  onModelChanged(m: Partial<DragInTheBlankModel>, reset?: boolean) {
    this._model = DragInTheBlank.prepareModel(m);
    this._render();
    this.dispatchModelUpdated(reset);
  }

  onConfigurationChanged(c: DragInTheBlankConfiguration) {
    this._configuration = c;
    this._render();
  }

  /** @param {done, progress, file} handler */
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
    log('_render');

    let element = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
      disableSidePanel: this._disableSidePanel,
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
    this._root.render(element);

    setTimeout(() => {
      renderMath(this);
    }, 0);
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
