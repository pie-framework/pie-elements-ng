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

import Main, { type AuthorModel } from './design.js';
import defaultValues from './defaults.js';
import type { PassageConfiguration } from '../types.js';

export default class PassageConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: PassageConfiguration;

  static createDefaultModel = (model: Partial<AuthorModel> = {}): AuthorModel => ({
    ...defaultValues.model,
    ...model,
  });

  constructor() {
    super();
    this._root = null;
    this._model = PassageConfigure.createDefaultModel();
    this._configuration = defaultValues.configuration;
  }

  set model(m: Partial<AuthorModel>) {
    this._model = PassageConfigure.createDefaultModel(m);
    this.render();
  }

  set configuration(c: PassageConfiguration) {
    this._configuration = c;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  modelChanged(m: AuthorModel) {
    this._model = m;
    this.dispatchEvent(new ModelUpdatedEvent(this._model));
    this.render();
  }

  onConfigurationChanged(c: PassageConfiguration) {
    this._configuration = c;

    this.render();
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

  render() {
    if (this._model) {
      const el = React.createElement(Main, {
        model: this._model,
        configuration: this._configuration,
        onModelChanged: this.modelChanged.bind(this),
        onConfigurationChanged: this.onConfigurationChanged.bind(this),
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
