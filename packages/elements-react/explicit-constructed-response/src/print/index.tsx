// @ts-nocheck
/**
 * @synced-from pie-elements/packages/explicit-constructed-response/src/print.js
 * @synced-commit 2a252291609481706fda098983c2973ccff27c81
 * @synced-date 2026-01-30
 * @sync-version v3
 * @auto-generated
 *
 * This file is automatically synced from pie-elements and converted to TypeScript.
 * Manual edits will be overwritten on next sync.
 * To make changes, edit the upstream JavaScript file and run sync again.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { debounce } from 'lodash-es';
import Main from '../delivery/main';
import { renderMath } from '@pie-element/shared-math-rendering-katex';
import debug from 'debug';

const log = debug('pie-element:explicit-constructed-response:print');

const preparePrintModel = (model, opts) => {
  const isInstructor = opts.role === 'instructor';

  model.prompt = model.promptEnabled !== false ? model.prompt : undefined;
  model.teacherInstructions =
    isInstructor && model.teacherInstructionsEnabled !== false ? model.teacherInstructions : undefined;
  model.rationale = isInstructor && model.rationaleEnabled !== false ? model.rationale : undefined;
  model.alwaysShowCorrect = isInstructor;
  model.mode = isInstructor ? 'evaluate' : model.mode;
  model.disabled = true;
  model.animationsDisabled = true;

  return model;
};

export default class ExplicitConstructedResponsePrint extends HTMLElement {
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
              ...printModel,
              onChange: () => {},
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
