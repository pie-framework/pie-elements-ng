// @ts-nocheck
/**
 * @synced-from pie-elements/packages/passage/configure/src/index.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  ModelUpdatedEvent,
  DeleteImageEvent,
  InsertImageEvent,
  InsertSoundEvent,
  DeleteSoundEvent,
} from '@pie-element/shared-configure-events';

import Main from './design';
import defaultValues from './defaults';

export default class PassageConfigure extends HTMLElement {
  static createDefaultModel = (model = {}) => ({
    ...defaultValues.model,
    ...model,
  });

  constructor() {
    super();
    this._root = null;
    this._model = PassageConfigure.createDefaultModel();
    this._configuration = defaultValues.configuration;
  }

  set model(m) {
    this._model = PassageConfigure.createDefaultModel(m);
    this.render();
  }

  set configuration(c) {
    this._configuration = c;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  modelChanged(m) {
    this._model = m;
    this.dispatchEvent(new ModelUpdatedEvent(this._model), true);
    this.render();
  }

  onConfigurationChanged(c) {
    this._configuration = c;

    this.render();
  }

  insertImage(handler) {
    this.dispatchEvent(new InsertImageEvent(handler));
  }

  onDeleteImage(src, done) {
    this.dispatchEvent(new DeleteImageEvent(src, done));
  }

  insertSound(handler) {
    this.dispatchEvent(new InsertSoundEvent(handler));
  }

  onDeleteSound(src, done) {
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
    }
  }
}
