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
import { createRoot, type Root as ReactRoot } from 'react-dom/client';
import debug from 'debug';

import Root, { type AuthorModel } from './root.js';
import sensibleDefaults from './defaults.js';
import type { ImageClozeAssociationConfiguration } from '../types.js';

const log = debug('image-cloze-association:configure');

export default class ImageClozeAssociationConfigure extends HTMLElement {
  private _root: ReactRoot | null;
  private _model: AuthorModel;
  private _configuration: ImageClozeAssociationConfiguration;
  private _disableSidePanel?: boolean;

  static createDefaultModel = (model: AuthorModel = {}): AuthorModel => ({
    ...sensibleDefaults.model,
    ...model,
  });

  constructor() {
    super();
    this._root = null;
    this._model = ImageClozeAssociationConfigure.createDefaultModel();
    this.onModelChanged = this.onModelChanged.bind(this);
    this._configuration = sensibleDefaults.configuration;
  }

  set model(s: AuthorModel) {
    this._model = ImageClozeAssociationConfigure.createDefaultModel(s);
    this._render();
  }

  set configuration(c: ImageClozeAssociationConfiguration) {
    this._configuration = c;
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

  onModelChanged(m: AuthorModel, reset?: boolean) {
    this._model = m;
    this.dispatchModelUpdated(reset);
    this._render();
  }

  onConfigurationChanged(config: ImageClozeAssociationConfiguration) {
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
    log('_render');

    let element = React.createElement(Root, {
      disableSidePanel: this._disableSidePanel,
      model: this._model,
      configuration: this._configuration,
      onModelChanged: this.onModelChanged.bind(this),
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
