import React from 'react';
import { createRoot, type Root as ReactRoot } from 'react-dom/client';
import debug from 'debug';
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

import Root, { type AuthorModel } from './root.js';
import sensibleDefaults from './defaults.js';
import type { Dimensions, HotspotConfiguration, HotspotModel, Shapes } from '../types.js';

const log = debug('hotspot:configure');

export default class HotspotConfigure extends HTMLElement {
  private _root: ReactRoot | null;
  private _model: AuthorModel;
  private _configuration: HotspotConfiguration;

  // A one-element array is always truthy, so the defaults' lists are never the fallback.
  static createDefaultModel = (model: Partial<HotspotModel> = {}): AuthorModel => ({
    ...sensibleDefaults.model,
    ...model,
    hotspotList: model.hotspotList || ([model.hotspotColor] as string[]),
    outlineList: model.outlineList || ([model.outlineColor] as string[]),
    shapes: model.shapes || sensibleDefaults.model.shapes,
  });

  constructor() {
    super();
    this._root = null;
    this._model = HotspotConfigure.createDefaultModel();
    this._configuration = sensibleDefaults.configuration;
    this.onModelChanged = this.onModelChanged.bind(this);
  }

  set model(s: Partial<HotspotModel>) {
    this._model = HotspotConfigure.createDefaultModel(s);
    this._render();
  }

  set configuration(c: HotspotConfiguration) {
    const newConfiguration = {
      ...sensibleDefaults.configuration,
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

  dispatchModelUpdated(reset?: boolean) {
    const resetValue = !!reset;

    this.dispatchEvent(new ModelUpdatedEvent(this._model, resetValue));
  }

  onModelChanged(m: AuthorModel, reset?: boolean) {
    this._model = m;
    this.dispatchModelUpdated(reset);
    this._render();
  }

  onConfigurationChanged = (c: HotspotConfiguration) => {
    this._configuration = c;
    this._render();
  };

  onModelChangedByConfig = (m: AuthorModel, propertyType?: string) => {
    const _model = m;

    if (propertyType === 'multipleCorrect') {
      const { rectangles = [], polygons = [], circles = [] } = _model.shapes || {};

      _model.shapes.rectangles = rectangles.map((shape) => ({ ...shape, correct: false }));
      _model.shapes.polygons = polygons.map((shape) => ({ ...shape, correct: false }));
      _model.shapes.circles = circles.map((shape) => ({ ...shape, correct: false }));
    }

    this.onModelChanged(_model);
  };

  onColorChanged = (colorType: 'hotspotColor' | 'outlineColor', color: string) => {
    this.onModelChanged({
      ...this._model,
      [colorType]: color,
    });
  };

  onPromptChanged = (prompt: string) => {
    this.onModelChanged({
      ...this._model,
      prompt,
    });
  };

  onRationaleChanged = (rationale: string) => {
    this.onModelChanged({
      ...this._model,
      rationale,
    });
  };

  onTeacherInstructionsChanged = (teacherInstructions: string) => {
    this.onModelChanged({
      ...this._model,
      teacherInstructions,
    });
  };

  onUpdateImageDimension = (dimensions: Dimensions) => {
    this.onModelChanged({
      ...this._model,
      dimensions,
    });
  };

  onUpdateShapes = (shapes: Shapes) => {
    this.onModelChanged({
      ...this._model,
      shapes,
    });
  };

  onImageUpload = (imageUrl: string) => {
    this.onModelChanged({
      ...this._model,
      imageUrl,
    });
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
      configuration: this._configuration,
      model: this._model,
      onColorChanged: this.onColorChanged,
      onImageUpload: this.onImageUpload,
      onRationaleChanged: this.onRationaleChanged,
      onConfigurationChanged: this.onConfigurationChanged,
      onPromptChanged: this.onPromptChanged,
      onUpdateImageDimension: this.onUpdateImageDimension,
      imageSupport: {
        add: this.insertImage,
        delete: this.onDeleteImage,
      },
      uploadSoundSupport: {
        add: this.insertSound.bind(this),
        delete: this.onDeleteSound.bind(this),
      },
      onUpdateShapes: this.onUpdateShapes,
      onModelChangedByConfig: this.onModelChangedByConfig,
      onTeacherInstructionsChanged: this.onTeacherInstructionsChanged,
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
