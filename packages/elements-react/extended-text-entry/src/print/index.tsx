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
import { cloneDeep, debounce } from '@pie-element/shared-lodash';
import Main from '../delivery/main.js';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';

import debug from 'debug';

const log = debug('pie-element:extended-text-entry:print');

const preparePrintModel = (model, opts) => {
  const instr = opts.role === 'instructor';
  const printModel = cloneDeep(model);

  printModel.prompt = printModel.promptEnabled !== false ? printModel.prompt : undefined;
  printModel.teacherInstructions =
    instr && printModel.teacherInstructionsEnabled !== false ? printModel.teacherInstructions : undefined;
  printModel.showTeacherInstructions = instr;
  printModel.mode = instr ? 'evaluate' : printModel.mode;

  const defaultDimensions = { height: 100, width: 500 };

  printModel.dimensions = {
    ...defaultDimensions,
    ...printModel.dimensions,
  };

  printModel.disabled = true;
  printModel.feedback = undefined;
  printModel.animationsDisabled = true;

  return printModel;
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
        if (this._model && this._session && this._options) {
          const printModel = preparePrintModel(this._model, this._options);

          const element = React.createElement(Main, {
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
    // re-render so role changes (student/instructor) propagate
    this._rerender();
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
