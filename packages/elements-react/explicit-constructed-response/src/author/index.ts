import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import debug from 'debug';
import { defaults, isArray } from '@pie-element/shared-lodash';
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
import type { ConfigurePropWithEnabled } from '@pie-element/shared-types';

import Main, { type AuthorModel } from './main.js';

import sensibleDefaults from './defaults.js';
import { processMarkup, createSlateMarkup } from './markupUtils.js';
import type {
  Choice,
  ExplicitConstructedResponseConfiguration,
  ExplicitConstructedResponseModel,
} from '../types.js';

/** The configuration once `sensibleDefaults.configuration` has filled the keys it carries. */
type AuthorConfiguration = ExplicitConstructedResponseConfiguration &
  Required<Pick<ExplicitConstructedResponseConfiguration, 'language' | 'languageChoices'>>;

const log = debug('explicit-constructed-response:configure');

export default class ExplicitConstructedResponse extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: ExplicitConstructedResponseConfiguration;
  private _disableSidePanel?: boolean;

  static prepareModel = (model: Partial<ExplicitConstructedResponseModel> = {}): AuthorModel => {
    const joinedObj = {
      ...sensibleDefaults.model,
      ...model,
    };
    const slateMarkup = joinedObj.slateMarkup || createSlateMarkup(joinedObj.markup, joinedObj.choices);
    const processedMarkup = processMarkup(slateMarkup);

    // this was added to treat an exception, when the model has choices without the "value" property
    // like: { label: 'test' }
    if (joinedObj.choices) {
      Object.keys(joinedObj.choices).forEach((key) => {
        if (isArray(joinedObj.choices[key])) {
          joinedObj.choices[key] = (joinedObj.choices[key] || []).map((item, index) => {
            if (!item.value) {
              log('Choice does not contain "value" property, which is required.', item);
              return { value: `${index}`, ...(item as Partial<Choice>) } as Choice;
            }

            return item;
          });
        }
      });
    }

    return {
      ...joinedObj,
      slateMarkup,
      markup: processedMarkup,
    };
  };

  constructor() {
    super();
    this._root = null;
    this._model = ExplicitConstructedResponse.prepareModel();
    this._configuration = sensibleDefaults.configuration;
  }

  set model(s: Partial<ExplicitConstructedResponseModel>) {
    this._model = ExplicitConstructedResponse.prepareModel(s);
    if (this._model.responseAreaInputConfiguration) {
      this._model.responseAreaInputConfiguration =
        this._configuration.responseAreaInputConfiguration?.inputConfiguration;
    }
    this._render();
  }

  set configuration(c: ExplicitConstructedResponseConfiguration) {
    const newConfiguration = defaults(c, sensibleDefaults.configuration) as AuthorConfiguration;

    this._configuration = newConfiguration;

    // if language:enabled is true, then the corresponding default item model should include a language value;
    // if it is false, then the language field should be omitted from the item model.
    // if a default item model includes a language value (e.g., en_US) and the corresponding authoring view settings have language:settings = true,
    // then (a) language:enabled should also be true, and (b) that default language value should be represented in languageChoices[] (as a key).
    // `defaults()` fills `c` in place, so `c.language` is set in the `else if` below.
    if (c.language?.enabled) {
      if (c.languageChoices?.options?.length) {
        this._model.language = c.languageChoices.options[0].value;
      }
    } else if ((c.language as ConfigurePropWithEnabled).settings && this._model.language) {
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

  set disableSidePanel(s: boolean) {
    this._disableSidePanel = s;
    this._render();
  }

  dispatchModelUpdated(reset?: boolean) {
    const resetValue = !!reset;

    this.dispatchEvent(new ModelUpdatedEvent(this._model, resetValue));
  }

  onModelChanged = (m: Partial<AuthorModel>, reset?: boolean) => {
    this._model = ExplicitConstructedResponse.prepareModel({
      ...this._model,
      ...m,
    });
    this._render();
    this.dispatchModelUpdated(reset);
  };

  onConfigurationChanged = (c: ExplicitConstructedResponseConfiguration) => {
    this._configuration = c;

    const newInputConfig = this._configuration?.responseAreaInputConfiguration?.inputConfiguration;

    this._model = {
      ...this._model,
      responseAreaInputConfiguration: newInputConfig,
    };

    this.onModelChanged(this._model);
  };

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
