// @ts-nocheck
/**
 * @synced-from pie-elements/packages/extended-text-entry/src/print.js
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { debounce } from 'lodash-es';
import Main from '../delivery/main.js';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

import debug from 'debug';

const log = debug('pie-element:extended-text-entry:print');

const preparePrintModel = (model, opts) => {
  const instr = opts.role === 'instructor';

  model.prompt = model.promptEnabled !== false ? model.prompt : undefined;
  model.teacherInstructions =
    instr && model.teacherInstructionsEnabled !== false ? model.teacherInstructions : undefined;
  model.showTeacherInstructions = instr;
  model.mode = instr ? 'evaluate' : model.mode;

  const defaultDimensions = { height: 100, width: 500 };

  model.dimensions = {
    ...defaultDimensions,
    ...model.dimensions,
  };

  model.disabled = true;
  model.feedback = undefined;
  model.animationsDisabled = true;

  return model;
};

export default class ExtendedTextEntryPrint extends HTMLElement {
  constructor() {
    super();
    this._options = null;
    this._model = null;
    this._session = [];
    this._root = null;
    this._rerender = debounce(
      () => {
        if (this._model && this._session) {
          const printModel = preparePrintModel(this._model, this._options);

          const element =
            this._options &&
            React.createElement(Main, {
              model: printModel,
              session: {},
              onChange: () => {},
              onValueChange: () => {},
              onAnnotationsChange: () => {},
              onCommentChange: () => {},
            });

          if (!this._root) {
            this._root = createRoot(this);
          }
          this._root.render(element);
          queueMicrotask(() => {
            log('render complete - render math');
            renderMath(this);
          });
        } else {
          log('skip');
        }
      },
      50,
      { leading: false, trailing: true },
    );
  }
  set options(o) {
    this._options = o;
  }

  set model(s) {
    this._model = s;
    this._rerender();
  }

  connectedCallback() {}

  disconnectedCallback() {
    if (this._root) {
      this._root.unmount();
    }
  }
}
