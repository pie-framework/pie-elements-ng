import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Configure, { type AuthorModel } from './configure.js';
import {
  DeleteImageEvent,
  DeleteSoundEvent,
  InsertImageEvent,
  InsertSoundEvent,
  ModelUpdatedEvent,
  type DeleteDone,
  type ImageHandler,
  type SoundHandler,
} from '@pie-element/shared-configure-events';
import debug from 'debug';
import defaultValues from './defaults.js';
import { renderMath } from '@pie-element/shared-math-rendering-mathjax';
import { cloneDeep } from '@pie-element/shared-lodash';
import type {
  Graph,
  GraphingAnswers,
  GraphingConfiguration,
  GraphingModel,
  GraphSettings,
  MarkType,
} from '../types.js';

const log = debug('pie-elements:graphing:configure');

// this function is implemented in controller as well
const sortedAnswers = <T>(answers: Record<string, T> | undefined) =>
  Object.keys(answers || {})
    .sort()
    .reduce<Record<string, T>>((result, key) => {
      if (answers && key !== 'correctAnswer') {
        result[key] = answers[key];
      }

      return result;
    }, {});

export default class GraphLinesConfigure extends HTMLElement {
  private _root: Root | null;
  private _model: AuthorModel;
  private _modelCopy?: AuthorModel;
  private _configuration: GraphingConfiguration;
  private hasPlayerAsParent?: boolean;

  static createDefaultModel = (model: Partial<GraphingModel> = {}): AuthorModel => {
    const normalizedModel = { ...defaultValues.model, ...model };
    // The empty fallbacks apply only when the model sets these keys to undefined.
    const {
      answers = {} as GraphingAnswers,
      domain = {} as GraphSettings,
      defaultTool,
      graph = {} as Graph,
      range = {} as GraphSettings,
      standardGrid,
      toolbarTools,
    } = normalizedModel;

    // added support for models without defaultTool defined; also used in packages/graphing/controller/src/index.js
    const toolbarToolsNoLabel = (toolbarTools || []).filter((tool): tool is MarkType => tool !== 'label');
    const normalizedDefaultTool = defaultTool || (toolbarToolsNoLabel.length && toolbarToolsNoLabel[0]) || '';

    return {
      ...normalizedModel,
      answers:
        (answers &&
          answers.correctAnswer && {
            correctAnswer: answers.correctAnswer,
            ...sortedAnswers(answers),
          }) ||
        answers,
      defaultTool: normalizedDefaultTool,
      range:
        (standardGrid && {
          ...range,
          min: domain.min,
          max: domain.max,
          step: domain.step,
          labelStep: domain.labelStep,
        }) ||
        range,
      graph: (standardGrid && { ...graph, height: graph.width }) || graph,
    };
  };

  constructor() {
    super();
    this._root = null;
    this._model = GraphLinesConfigure.createDefaultModel();
    this._configuration = defaultValues.configuration;
  }

  set model(m: Partial<GraphingModel>) {
    this._model = GraphLinesConfigure.createDefaultModel(m);
    this._modelCopy = cloneDeep(this._model);

    this._render();
  }

  resetModelAfterConfigurationIsSet = () => {
    // In environments that use pie-player-components, model is set before configuration.
    // This is the reason why sometimes the model gets altered non-reversible
    // (altered using default configuration instead of client configuration, because at that point client configuration was not set yet)
    // Therefore, in such environments, we will make sure to keep a modelCopy (initialised in set model) and use it to reset
    // the model in set configuration (resetModelAfterConfigurationIsSet) if set configuration is ever called
    const pieAuthors = document.querySelectorAll('pie-author');
    this.hasPlayerAsParent = Array.from(pieAuthors).some((author) => author.contains(this));

    if (this.hasPlayerAsParent) {
      if (this._modelCopy) {
        this._model = this._modelCopy;
      } else {
        delete this._modelCopy;
      }
    }
  };

  set configuration(c: GraphingConfiguration) {
    this._configuration = {
      ...defaultValues.configuration,
      ...c,
    };

    this.resetModelAfterConfigurationIsSet();

    // if language:enabled is true, then the corresponding default item model should include a language value;
    // if it is false, then the language field should be omitted from the item model.
    // if a default item model includes a language value (e.g., en_US) and the corresponding authoring view settings have language:settings = true,
    // then (a) language:enabled should also be true, and (b) that default language value should be represented in languageChoices[] (as a key).
    //TODO: add logic in controller and add tests
    const { language, languageChoices } = this._configuration;
    if (language?.enabled) {
      if (languageChoices?.options?.length) {
        this._model.language = languageChoices.options[0].value;
      }
    } else {
      if (language?.settings) {
        if (this._model.language) {
          language.enabled = true;
        }
      } else {
        delete this._model.language;
      }
    }

    this._render();
  }

  onModelChanged = (model: AuthorModel) => {
    this._model = model;
    this._render();

    log('[onModelChanged]: ', this._model);

    this.dispatchEvent(new ModelUpdatedEvent(this._model));
  };

  onConfigurationChanged = (config: GraphingConfiguration) => {
    this._configuration = config;
    this._render();
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
    if (this._model) {
      const el = React.createElement(Configure, {
        onModelChanged: this.onModelChanged,
        onConfigurationChanged: this.onConfigurationChanged,
        model: this._model,
        configuration: this._configuration,
        imageSupport: {
          add: this.insertImage,
          delete: this.onDeleteImage,
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
      queueMicrotask(() => {
        renderMath(this);
      });
    }
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
