// @ts-nocheck
/**
 * @synced-from pie-elements/packages/math-templated/src/print.js
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

const log = debug('pie-element:math-templated:print');

/**
 * Live in same package as main element - so we can access some of the shared comps!
 *
 * - update pslb to build print if src/print.js is there
 * - update demo el
 * - get configure/controller building
 */

const preparePrintModel = (model, opts) => {
  const instr = opts.role === 'instructor';

  model.prompt = model.promptEnabled !== false ? model.prompt : undefined;
  model.teacherInstructions =
    instr && model.teacherInstructionsEnabled !== false ? model.teacherInstructions : undefined;
  model.rationale = instr && model.rationaleEnabled !== false ? model.rationale : undefined;
  model.showTeacherInstructions = instr;
  model.alwaysShowCorrect = instr;
  model.printMode = true;
  model.feedback = undefined;
  model.markup = model.markup || '{{0}}';

  return {
    ...model,
    disabled: true,
    env: { mode: instr ? 'evaluate' : model.mode, role: opts.role },
  };
};

export default class MathTemplatedPrint extends HTMLElement {
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
