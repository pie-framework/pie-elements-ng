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
import Main, { type AuthorModel } from './main.js';
import debug from 'debug';
import { defaults } from '@pie-element/shared-lodash';

import sensibleDefaults from './defaults.js';
import { processMarkup, createSlateMarkup } from './markupUtils.js';
import type { InlineDropdownConfiguration, InlineDropdownModel } from '../types.js';

/** The configuration once `sensibleDefaults.configuration` has filled the keys it carries. */
type AuthorConfiguration = InlineDropdownConfiguration &
  Required<Pick<InlineDropdownConfiguration, 'language' | 'languageChoices'>>;

const log = debug('multiple-choice:configure');

export default class InlineDropdown extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: InlineDropdownConfiguration;
  private _disableSidePanel?: boolean;

  static prepareModel = (model: Partial<InlineDropdownModel> = {}): AuthorModel => {
    const currModal = {
      ...sensibleDefaults.model,
      ...model,
    };
    const slateMarkup = model.slateMarkup || createSlateMarkup(currModal.markup, currModal.choices);
    const markup = processMarkup(slateMarkup);

    return {
      ...currModal,
      slateMarkup,
      markup,
      /*...processedMarkup,*/
    };
  };

  constructor() {
    super();
    this._root = null;
    this._model = InlineDropdown.prepareModel();
    this._configuration = sensibleDefaults.configuration;
    this.onModelChanged = this.onModelChanged.bind(this);
    this.onConfigurationChanged = this.onConfigurationChanged.bind(this);
  }

  set model(s: Partial<InlineDropdownModel>) {
    this._model = InlineDropdown.prepareModel(s);
    this._render();
  }

  set configuration(c: InlineDropdownConfiguration) {
    // `defaults()` fills `c` in place and returns it.
    const configuration = defaults(c, sensibleDefaults.configuration) as AuthorConfiguration;

    this._configuration = configuration;

    // if language:enabled is true, then the corresponding default item model should include a language value;
    // if it is false, then the language field should be omitted from the item model.
    // if a default item model includes a language value (e.g., en_US) and the corresponding authoring view settings have language:settings = true,
    // then (a) language:enabled should also be true, and (b) that default language value should be represented in languageChoices[] (as a key).
    if (c.language?.enabled) {
      if (c.languageChoices?.options?.length) {
        this._model.language = c.languageChoices.options[0].value;
      }
    } else if ((c as AuthorConfiguration).language.settings && this._model.language) {
      configuration.language.enabled = true;

      if (!configuration.languageChoices.options || !configuration.languageChoices.options.length) {
        configuration.languageChoices.options = [];
      }

      // check if the language is already included in the languageChoices.options array
      // and if not, then add it.
      if (!configuration.languageChoices.options.find(option => option.value === this._model.language)) {
        configuration.languageChoices.options.push({
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

  onModelChanged(m: Partial<InlineDropdownModel>, reset?: boolean) {
    this._model = InlineDropdown.prepareModel(m);
    this._render();
    this.dispatchModelUpdated(reset);
  }

  onConfigurationChanged(c: InlineDropdownConfiguration) {
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
