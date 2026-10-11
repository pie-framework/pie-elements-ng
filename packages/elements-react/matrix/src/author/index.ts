import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import debug from 'debug';
import {
  ModelUpdatedEvent,
  InsertSoundEvent,
  DeleteSoundEvent,
  type DeleteDone,
  type SoundHandler,
} from '@pie-element/shared-configure-events';

import Main, { type AuthorModel } from './Main.js';
import { defaults } from '@pie-element/shared-lodash';

import sensibleDefaults from './defaults.js';
import type { MatrixConfiguration, MatrixModel } from '../types.js';

const log = debug('matrix:configure');

const prepareCustomizationObject = (config: MatrixConfiguration, model: AuthorModel) => {
  const configuration = defaults(config, sensibleDefaults.configuration);

  return {
    configuration,
    model,
  };
};

export default class Matrix extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _configuration: MatrixConfiguration;
  private _disableSidePanel?: boolean;

  static createDefaultModel = (model: Partial<MatrixModel> = {}): AuthorModel => ({
    ...sensibleDefaults.model,
    ...model,
  });

  constructor() {
    super();
    this._root = null;
    this._model = Matrix.createDefaultModel();
    this._configuration = sensibleDefaults.configuration;
    this.onModelChanged = this.onModelChanged.bind(this);
    this.onConfigurationChanged = this.onConfigurationChanged.bind(this);
  }

  set model(s: Partial<MatrixModel>) {
    this._model = Matrix.createDefaultModel(s);
    this._render();
  }

  set configuration(c: MatrixConfiguration) {
    const info = prepareCustomizationObject(c, this._model);

    this.onModelChanged(info.model);
    this._configuration = info.configuration;
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
    this._render();
    this.dispatchModelUpdated(reset);
  }

  onConfigurationChanged(c: MatrixConfiguration) {
    this._configuration = prepareCustomizationObject(c, this._model).configuration;

    if (this._model) {
      this.onModelChanged(this._model);
    }

    this._render();
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
