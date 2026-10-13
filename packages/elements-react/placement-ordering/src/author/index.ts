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

import Main, { type AuthorModel } from './design.js';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import defaultValues from './defaults.js';
import { defaults } from '@pie-element/shared-lodash';
import type { Choice, CorrectResponse, PlacementOrderingConfiguration, PlacementOrderingModel } from '../types.js';

const prepareCustomizationObject = (config: PlacementOrderingConfiguration, model: AuthorModel) => {
  const configuration = defaults(config, defaultValues.configuration);

  return { configuration, model };
};

export const addWeightToCorrectResponse = (
  correctResponse?: Array<CorrectResponse | string>,
): CorrectResponse[] | undefined =>
  correctResponse &&
  correctResponse.map((correct) => {
    // if weight is set
    if (typeof correct !== 'string' && correct.weight !== undefined) {
      return { id: correct.id, weight: correct.weight };
    } else {
      return { id: (typeof correct !== 'string' && correct.id) || (correct as string), weight: 0 };
    }
  });
/**
 * assuming that the correct response will be set via ui, not via config,
 * correctResponse (if not set) will be initialized with choices default order
 */
export default class PlacementOrdering extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: PlacementOrderingConfiguration;
  onModelChanged: (model: AuthorModel, resetSession?: boolean) => void;
  onConfigurationChanged: (configuration: PlacementOrderingConfiguration) => void;
  insertImage: (handler: ImageHandler) => void;
  deleteImage: (src: string, done: DeleteDone) => void;

  static createDefaultModel = (model: Partial<PlacementOrderingModel> = {}): AuthorModel => {
    const mapChoicesToReturnCorrectResponse = (choices?: Choice[]) =>
      choices && choices.map((ch) => ({ id: ch.id, weight: 0 }));

    let correctResponse =
      addWeightToCorrectResponse(model.correctResponse) || mapChoicesToReturnCorrectResponse(model.choices);

    const defaultModel: AuthorModel = {
      ...defaultValues.model,
      ...model,
    };

    if (correctResponse) {
      defaultModel.correctResponse = correctResponse;
    }

    return defaultModel;
  };

  constructor() {
    super();
    this._root = null;

    this._model = PlacementOrdering.createDefaultModel();
    this._configuration = defaultValues.configuration;

    this.onModelChanged = (model, resetSession) => {
      this._model = model;
      this._rerender();
      this.dispatchUpdate(resetSession);
    };

    this.onConfigurationChanged = (configuration) => {
      this._configuration = prepareCustomizationObject(configuration, this._model).configuration;

      this.onModelChanged(this._model);
      this._rerender();
    };

    this.insertImage = (handler) => {
      this.dispatchEvent(new InsertImageEvent(handler));
    };

    this.deleteImage = (src, done) => {
      this.dispatchEvent(new DeleteImageEvent(src, done));
    };
  }

  dispatchUpdate(reset?: boolean) {
    this.dispatchEvent(new ModelUpdatedEvent(this._model, reset));
  }

  set model(s: Partial<PlacementOrderingModel>) {
    this._model = PlacementOrdering.createDefaultModel(s);
    this._rerender();
  }

  set configuration(c: PlacementOrderingConfiguration) {
    const info = prepareCustomizationObject(c, this._model);

    this.onModelChanged(info.model);

    const newConfiguration = {
      ...defaultValues.configuration,
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

    this._rerender();
  }

  insertSound(handler: SoundHandler) {
    this.dispatchEvent(new InsertSoundEvent(handler));
  }

  onDeleteSound(src: string, done: DeleteDone) {
    this.dispatchEvent(new DeleteSoundEvent(src, done));
  }

  _rerender() {
    let element = React.createElement(Main, {
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged,
      onConfigurationChanged: this.onConfigurationChanged,
      imageSupport: {
        add: this.insertImage,
        delete: this.deleteImage,
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
    this._rerender();
  }

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
      this._root = null;
    }
  }
}
